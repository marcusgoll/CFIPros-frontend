/**
 * Batch Export API Route v1.2
 * Maps to backend /v1/batches/{batchId}/export endpoint
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { simpleProxyRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';

const ALLOWED_FORMATS = ['pdf', 'csv', 'json'];

async function batchExportHandler(request: NextRequest, { params }: { params: { batchId: string } }) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const { batchId } = params;
  
  const url = new URL(request.url);
  const format = url.searchParams.get('format');

  // Validate batchId format
  if (!batchId || typeof batchId !== 'string' || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid batch ID'));
  }

  // Validate format parameter
  if (!format || !ALLOWED_FORMATS.includes(format)) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR(`Invalid export format. Allowed formats: ${ALLOWED_FORMATS.join(', ')}`));
  }

  // Track export request
  trackEvent('batch_export_requested', {
    batch_id: batchId.substring(0, 8) + '...', // Partial ID for privacy
    format,
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + '...'
  });

  try {
    // Proxy to backend batch export endpoint
    const response = await simpleProxyRequest(`/v1/batches/${batchId}/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Client-IP': clientIP,
        'X-Service': 'acs-extractor-v1.2',
      },
    });

    // Track successful export
    if (response.status === 200) {
      trackEvent('batch_export_success', {
        batch_id: batchId.substring(0, 8) + '...',
        format,
        correlation_id: correlationId,
        response_status: response.status
      });
    }

    // Preserve content-type and content-disposition headers for file downloads
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    
    if (contentType) {
      response.headers.set('Content-Type', contentType);
    }
    if (contentDisposition) {
      response.headers.set('Content-Disposition', contentDisposition);
    }

    // Add CORS headers for public access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track export failure
    const message = error instanceof Error ? error.message : 'unknown_error';
    trackEvent('batch_export_failed', {
      batch_id: batchId.substring(0, 8) + '...',
      format,
      correlation_id: correlationId,
      error: message
    });

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Export service temporarily unavailable. Please try again.'));
  }
}

// Apply middleware with export-specific configuration
export const GET = withAPIMiddleware(batchExportHandler, {
  endpoint: 'batch-export',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);