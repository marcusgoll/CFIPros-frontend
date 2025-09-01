/**
 * ACS Extractor API Route v1.2 - Batch File Processing
 * Maps to backend /v1/aktr endpoint for AKTR → ACS batch processing
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyFileUploadWithFormData, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { FileUploadRateLimiter } from '@/lib/security/fileUpload';
import { trackEvent } from '@/lib/analytics/telemetry';

async function extractHandler(request: NextRequest) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);

  // Rate limiting for extractor - more lenient than general uploads
  const rateLimitCheck = FileUploadRateLimiter.checkRateLimit(
    clientIP,
    20, // Max 20 extractions per hour for ACS extractor
    60 * 60 * 1000 // 1 hour window
  );

  if (!rateLimitCheck.allowed) {
    const resetDate = new Date(rateLimitCheck.resetTime).toISOString();
    return handleAPIError(
      CommonErrors.RATE_LIMIT_EXCEEDED(
        `Extraction limit exceeded. Try again after ${resetDate}`
      )
    );
  }

  // Validate AKTR file upload with v1.2 batch requirements
  const validation = await validateRequest.fileUpload(request, {
    maxFiles: 5,
    maxSize: 15 * 1024 * 1024, // Updated to 15MB per file per v1.2 spec
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    requiredField: 'files' // Expecting 'files[]' field for batch upload
  });

  if (!validation.isValid) {
    const errorMessage = validation.error!;
    trackEvent('extractor_validation_error', {
      error: errorMessage,
      correlation_id: correlationId,
      client_ip: clientIP
    });

    let error;
    if (errorMessage.includes('No files provided') || errorMessage.includes('No file')) {
      error = CommonErrors.NO_FILE_PROVIDED('Please select at least one AKTR file to process');
    } else if (errorMessage.includes('exceeds maximum size')) {
      error = CommonErrors.FILE_TOO_LARGE('Each file must be 15MB or less');
    } else if (errorMessage.includes('Unsupported file type') || errorMessage.includes('file extension')) {
      error = CommonErrors.UNSUPPORTED_FILE_TYPE('Only PDF, JPG, and PNG files are allowed');
    } else if (errorMessage.includes('Maximum') && errorMessage.includes('files')) {
      error = CommonErrors.VALIDATION_ERROR('Maximum 5 files allowed per upload');
    } else {
      error = CommonErrors.VALIDATION_ERROR(errorMessage);
    }

    return handleAPIError(error);
  }

  // Track batch upload attempt
  trackEvent('batch_upload_started', {
    file_count: validation.files?.length || 0,
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + '...' // Partial IP for privacy
  });

  try {
    // Proxy to backend v1.2 batch endpoint using the already-read formData
    const response = await proxyFileUploadWithFormData(validation.data!, '/v1/aktr', {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Client-IP': clientIP,
        'X-Service': 'acs-extractor-v1.2',
        'X-Rate-Limit-Remaining': rateLimitCheck.remainingUploads.toString(),
      },
    });

    // Track successful batch upload (expecting 202 Accepted for async processing)
    if (response.status === 202) {
      trackEvent('batch_upload_accepted', {
        file_count: validation.files?.length || 0,
        correlation_id: correlationId,
        response_status: response.status
      });
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', '20');
    response.headers.set('X-RateLimit-Remaining', rateLimitCheck.remainingUploads.toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitCheck.resetTime).toISOString());
    
    // Add CORS headers for public access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track batch upload failure
    const message = error instanceof Error ? error.message : 'unknown_error';
    trackEvent('batch_upload_failed', {
      file_count: validation.files?.length || 0,
      correlation_id: correlationId,
      error: message
    });

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Batch processing service temporarily unavailable. Please try again.'));
  }
}

// Apply middleware with extractor-specific configuration
export const POST = withAPIMiddleware(extractHandler, {
  endpoint: 'upload',
  cors: true,
  methods: ['POST', 'OPTIONS']
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);
