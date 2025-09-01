/**
 * Batch Consent API Route v1.2
 * Maps to backend /v1/batches/{batchId}/consent endpoint for consent management
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';

async function consentHandler(request: NextRequest, { params }: { params: { batchId: string } }) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const { batchId } = params;
  const method = request.method;

  // Validate batchId format
  if (!batchId || typeof batchId !== 'string' || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid batch ID'));
  }

  try {
    let requestBody = '';
    let validationResult = null;

    switch (method) {
      case 'GET':
        // Get consent records
        trackEvent('batch_consent_list_requested', {
          batch_id: batchId.substring(0, 8) + '...',
          correlation_id: correlationId
        });
        break;

      case 'POST':
        // Grant consent
        validationResult = await validateRequest.json(request, {
          requiredFields: ['consentType', 'consentGiven', 'version'],
          optionalFields: ['userId', 'userEmail']
        });

        if (!validationResult.isValid) {
          return handleAPIError(CommonErrors.VALIDATION_ERROR(validationResult.error!));
        }

        // Add client metadata for audit trail
        const consentData = {
          ...validationResult.data,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        };

        requestBody = JSON.stringify(consentData);
        
        trackEvent('batch_consent_granted', {
          batch_id: batchId.substring(0, 8) + '...',
          consent_type: validationResult.data.consentType,
          correlation_id: correlationId
        });
        break;

      case 'DELETE':
        // Revoke consent
        validationResult = await validateRequest.json(request, {
          requiredFields: ['consentId'],
          optionalFields: ['reason']
        });

        if (!validationResult.isValid) {
          return handleAPIError(CommonErrors.VALIDATION_ERROR(validationResult.error!));
        }

        requestBody = JSON.stringify({
          ...validationResult.data,
          revokedBy: clientIP,
          revokedAt: new Date().toISOString()
        });
        
        trackEvent('batch_consent_revoked', {
          batch_id: batchId.substring(0, 8) + '...',
          consent_id: validationResult.data.consentId.substring(0, 8) + '...',
          correlation_id: correlationId
        });
        break;

      default:
        return handleAPIError(CommonErrors.METHOD_NOT_ALLOWED(`Method ${method} not allowed`));
    }

    // Proxy to backend consent endpoint
    const response = await proxyRequest(`/v1/batches/${batchId}/consent`, {
      method,
      body: requestBody || undefined,
      headers: {
        'Content-Type': method !== 'GET' ? 'application/json' : undefined,
        'X-Correlation-ID': correlationId,
        'X-Client-IP': clientIP,
        'X-Service': 'acs-extractor-v1.2',
      },
    });

    // Track successful consent operation
    if (response.status >= 200 && response.status < 300) {
      trackEvent('batch_consent_success', {
        batch_id: batchId.substring(0, 8) + '...',
        method,
        correlation_id: correlationId,
        response_status: response.status
      });
    }

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track consent operation failure
    const message = error instanceof Error ? error.message : 'unknown_error';
    trackEvent('batch_consent_failed', {
      batch_id: batchId.substring(0, 8) + '...',
      method,
      correlation_id: correlationId,
      error: message
    });

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Consent service temporarily unavailable. Please try again.'));
  }
}

// Apply middleware with consent-specific configuration
export const GET = withAPIMiddleware(consentHandler, {
  endpoint: 'batch-consent',
  cors: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
});

export const POST = withAPIMiddleware(consentHandler, {
  endpoint: 'batch-consent',
  cors: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
});

export const DELETE = withAPIMiddleware(consentHandler, {
  endpoint: 'batch-consent',
  cors: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS']
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['GET', 'POST', 'DELETE', 'OPTIONS']);