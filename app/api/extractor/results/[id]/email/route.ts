/**
 * ACS Extractor Email Capture API Route
 * Maps to backend /v1/results/{id}/email endpoint for email capture on public results
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { proxyApiRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError, APIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';
import { z } from 'zod';


// Email capture validation schema
const emailCaptureSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  consent_marketing: z.boolean().optional().default(false),
  source: z.string().optional().default('extractor_results')
});

async function emailCaptureHandler(
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

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = emailCaptureSchema.safeParse(body);

    if (!validation.success) {
      return handleAPIError(CommonErrors.VALIDATION_ERROR('Invalid email capture data'));
    }

    const { email, consent_marketing, source } = validation.data;

    // Track email capture attempt
    trackEvent('email_captured', {
      report_id: reportId.substring(0, 8) + '...', // Partial ID for privacy
      email_domain: email.split('@')[1], // Domain only for analytics
      correlation_id: correlationId,
      source,
      has_marketing_consent: consent_marketing
    });

    // Proxy to backend email capture endpoint
    const response = await proxyApiRequest(
      request,
      'POST',
      `/v1/results/${reportId}/email`,
      {
        email,
        consent_marketing,
        source,
        client_ip: clientIP,
        correlation_id: correlationId
      },
      {
        headers: {
          'X-Correlation-ID': correlationId,
          'X-Client-IP': clientIP,
          'X-Service': 'acs-extractor-email',
          'Content-Type': 'application/json'
        },
      }
    );

    // Track successful email capture
    if (response.status === 200 || response.status === 201) {
      trackEvent('email_capture_success', {
        report_id: reportId.substring(0, 8) + '...',
        email_domain: email.split('@')[1],
        correlation_id: correlationId
      });
    }

    // Add CORS headers for public access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

    return response;

  } catch (error: unknown) {
    // Track email capture failure
    trackEvent('email_capture_failed', {
      report_id: reportId.substring(0, 8) + '...',
      correlation_id: correlationId,
      error: error instanceof Error ? error.message : 'unknown_error'
    });

    if (error instanceof APIError) {
      if (error.status === 404) {
        return handleAPIError(CommonErrors.RESULT_NOT_FOUND(reportId));
      }
      if (error.status === 409) {
        return handleAPIError(CommonErrors.VALIDATION_ERROR('Email already registered for this report'));
      }
      return handleAPIError(error);
    }

    return handleAPIError(CommonErrors.INTERNAL_ERROR('Unable to save email at this time. Please try again.'));
  }
}

// Apply middleware with public access and Next.js RouteContext typing
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(emailCaptureHandler, {
    endpoint: 'results',
    cors: true,
    methods: ['POST', 'OPTIONS']
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);
