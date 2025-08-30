/**
 * ACS Extractor API Route - File Processing
 * Maps to backend /v1/extract endpoint for AKTR → ACS processing
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyFileUpload, getClientIP, addCorrelationId } from '@/lib/api/proxy';
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

  // Validate AKTR file upload with specific requirements
  const validation = await validateRequest.fileUpload(request, {
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB per file
    acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    requiredField: 'files' // Expecting 'files' field for multi-file support
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
      error = CommonErrors.FILE_TOO_LARGE('Each file must be 10MB or less');
    } else if (errorMessage.includes('Unsupported file type') || errorMessage.includes('file extension')) {
      error = CommonErrors.UNSUPPORTED_FILE_TYPE('Only PDF, JPG, and PNG files are allowed');
    } else if (errorMessage.includes('Maximum') && errorMessage.includes('files')) {
      error = CommonErrors.VALIDATION_ERROR('Maximum 5 files allowed per upload');
    } else {
      error = CommonErrors.VALIDATION_ERROR(errorMessage);
    }

    return handleAPIError(error);
  }

  // Track extraction attempt
  trackEvent('extractor_upload_started', {
    file_count: validation.files?.length || 0,
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + '...' // Partial IP for privacy
  });

  try {
    // Proxy to backend extraction endpoint
    const response = await proxyFileUpload(request, '/v1/extract', {
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Client-IP': clientIP,
        'X-Service': 'acs-extractor',
        'X-Rate-Limit-Remaining': rateLimitCheck.remainingUploads.toString(),
      },
    });

    // Track successful extraction
    if (response.status === 200 || response.status === 202) {
      trackEvent('extractor_upload_success', {
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
    // Track extraction failure
    const message = error instanceof Error ? error.message : 'unknown_error';
    trackEvent('extractor_upload_failed', {
      file_count: validation.files?.length || 0,
      correlation_id: correlationId,
      error: message
    });

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Extraction service temporarily unavailable. Please try again.'));
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
