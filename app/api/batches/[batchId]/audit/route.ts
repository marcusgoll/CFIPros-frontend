/**
 * Batch Audit API Route v1.2
 * Maps to backend /v1/batches/{batchId}/audit endpoint for audit log retrieval
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { proxyRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';

async function auditHandler(request: NextRequest, { params }: { params: { batchId: string } }) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const { batchId } = params;
  
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '50';
  const offset = url.searchParams.get('offset') || '0';
  const action = url.searchParams.get('action'); // Filter by specific action
  const userId = url.searchParams.get('userId'); // Filter by specific user

  // Validate batchId format
  if (!batchId || typeof batchId !== 'string' || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid batch ID'));
  }

  // Validate pagination parameters
  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid limit parameter (1-100)'));
  }
  
  if (isNaN(offsetNum) || offsetNum < 0) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid offset parameter (>=0)'));
  }

  // Track audit log request
  trackEvent('batch_audit_requested', {
    batch_id: batchId.substring(0, 8) + '...',
    limit: limitNum,
    offset: offsetNum,
    has_filters: !!(action || userId),
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + '...'
  });

  try {
    // Build query string
    const queryParams = new URLSearchParams({
      limit: limit,
      offset: offset
    });
    
    if (action) {
      queryParams.set('action', action);
    }
    if (userId) {
      queryParams.set('userId', userId);
    }

    // Proxy to backend audit endpoint
    const response = await proxyRequest(`/v1/batches/${batchId}/audit?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Client-IP': clientIP,
        'X-Service': 'acs-extractor-v1.2',
      },
    });

    // Track successful audit retrieval
    if (response.status === 200) {
      trackEvent('batch_audit_success', {
        batch_id: batchId.substring(0, 8) + '...',
        correlation_id: correlationId,
        response_status: response.status
      });
    }

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track audit retrieval failure
    const message = error instanceof Error ? error.message : 'unknown_error';
    trackEvent('batch_audit_failed', {
      batch_id: batchId.substring(0, 8) + '...',
      correlation_id: correlationId,
      error: message
    });

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Audit service temporarily unavailable. Please try again.'));
  }
}

// Apply middleware with audit-specific configuration
export const GET = withAPIMiddleware(auditHandler, {
  endpoint: 'batch-audit',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);