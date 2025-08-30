/**
 * ACS Extractor Results API Route - Public Results Access
 * Maps to backend /v1/results/{id} endpoint for public result viewing
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { proxyApiRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';

interface RouteParams {
  params: {
    id: string;
  };
}

async function getResultsHandler(request: NextRequest, { params }: RouteParams) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const { id: reportId } = params;

  // Basic validation for report ID format
  if (!reportId || typeof reportId !== 'string' || reportId.length < 10) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR('Invalid report ID format')
    );
  }

  // Track public result access
  trackEvent('extractor_results_viewed', {
    report_id: reportId.substring(0, 8) + '...', // Partial ID for privacy
    correlation_id: correlationId,
    is_public: true
  });

  try {
    // Proxy to backend results endpoint - public access, no auth required
    const response = await proxyApiRequest(
      request,
      `GET`,
      `/v1/results/${reportId}`,
      null,
      {
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Client-IP': clientIP,
          'X-Service': 'acs-extractor-results',
          'X-Public-Access': 'true'
        },
      }
    );

    // Add no-index meta headers for public results (PII protection)
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    
    // Add CORS headers for public access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    
    // Add cache headers for public results (short cache for performance)
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');

    return response;

  } catch (error: any) {
    // Track result access failure
    trackEvent('extractor_results_error', {
      report_id: reportId.substring(0, 8) + '...',
      correlation_id: correlationId,
      error: error.message
    });

    if (error.status === 404) {
      return handleAPIError(
        CommonErrors.NOT_FOUND('Report not found or has expired')
      );
    }

    return handleAPIError(
      CommonErrors.INTERNAL_SERVER_ERROR(
        'Unable to retrieve results at this time. Please try again.',
        correlationId
      )
    );
  }
}

// Apply middleware with public access
export const GET = withAPIMiddleware(getResultsHandler, {
  endpoint: 'extractor/results/[id]',
  cors: true,
  methods: ['GET', 'OPTIONS'],
  publicEndpoint: true // Allow public access without authentication
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);