/**
 * ACS Extractor Claim API Route
 * Maps to backend /v1/results/{id}/claim endpoint for authenticated users to claim results
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { proxyApiRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError, APIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';
import { auth } from '@clerk/nextjs/server';

async function claimResultsHandler(
  request: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string | string[] | undefined }> }
) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const rawParams = (ctx as { params?: { id: string } | Promise<{ id: string | string[] | undefined }> })?.params;
  const maybePromise = rawParams as unknown as { then?: unknown };
  const isPromise = typeof maybePromise?.then === 'function';
  const resolvedParams = isPromise
    ? await (rawParams as Promise<{ id: string | string[] | undefined }>)
    : (rawParams as { id: string } | undefined);
  const { id: reportId } = (resolvedParams || {}) as { id: string };

  // Basic validation for report ID format
  if (!reportId || typeof reportId !== 'string' || reportId.length < 10) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR('Invalid report ID format')
    );
  }

  // Get authenticated user from Clerk
  const { userId, getToken } = await auth();
  
  if (!userId) {
    return handleAPIError(
      CommonErrors.UNAUTHORIZED('Authentication required to claim results')
    );
  }

  try {
    // Get JWT token for backend authentication
    const token = await getToken();
    
    if (!token) {
      return handleAPIError(
        CommonErrors.UNAUTHORIZED('Unable to verify authentication')
      );
    }

    // Track claim attempt
    trackEvent('result_claim_attempted', {
      report_id: reportId.substring(0, 8) + '...', // Partial ID for privacy
      user_id: userId.substring(0, 8) + '...', // Partial user ID for privacy
      correlation_id: correlationId
    });

    // Proxy to backend claim endpoint with authentication
    const response = await proxyApiRequest(
      request,
      'POST',
      `/v1/results/${reportId}/claim`,
      {
        user_id: userId,
        correlation_id: correlationId
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Correlation-ID': correlationId,
          'X-Client-IP': clientIP,
          'X-Service': 'acs-extractor-claim',
          'X-User-ID': userId,
          'Content-Type': 'application/json'
        },
      }
    );

    // Track successful claim
    if (response.status === 200 || response.status === 201) {
      trackEvent('result_claimed', {
        report_id: reportId.substring(0, 8) + '...',
        user_id: userId.substring(0, 8) + '...',
        correlation_id: correlationId
      });
    }

    // Add standard headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track claim failure
    trackEvent('result_claim_failed', {
      report_id: reportId.substring(0, 8) + '...',
      user_id: userId.substring(0, 8) + '...',
      correlation_id: correlationId,
      error: error instanceof Error ? error.message : 'unknown_error'
    });

    if (error instanceof APIError) {
      if (error.status === 404) {
        return handleAPIError(CommonErrors.RESULT_NOT_FOUND(reportId));
      }
      if (error.status === 409) {
        return handleAPIError(CommonErrors.VALIDATION_ERROR('Report has already been claimed'));
      }
      if (error.status === 403) {
        return handleAPIError(CommonErrors.FORBIDDEN('You do not have permission to claim this report'));
      }
      return handleAPIError(error);
    }

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Unable to claim results at this time. Please try again.'));
  }
}

// Apply middleware with authentication required and Next.js RouteContext typing
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(claimResultsHandler, {
    endpoint: 'results',
    cors: true,
    methods: ['POST', 'OPTIONS']
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);
