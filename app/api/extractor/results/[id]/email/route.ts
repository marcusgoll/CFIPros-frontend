/**
 * ACS Extractor Email Capture API Route
 * Maps to backend /v1/results/{id}/email endpoint for email capture on public results
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { proxyApiRequest, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { trackEvent } from '@/lib/analytics/telemetry';
import { z } from 'zod';

interface RouteParams {
  params: {
    id: string;
  };
}

// Email capture validation schema
const emailCaptureSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  consent_marketing: z.boolean().optional().default(false),
  source: z.string().optional().default('extractor_results')
});

async function emailCaptureHandler(request: NextRequest, { params }: RouteParams) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const { id: reportId } = params;

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
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return handleAPIError(
        CommonErrors.VALIDATION_ERROR('Invalid email capture data', { errors })
      );
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

  } catch (error: any) {
    // Track email capture failure
    trackEvent('email_capture_failed', {
      report_id: reportId.substring(0, 8) + '...',
      correlation_id: correlationId,
      error: error.message
    });

    if (error.status === 404) {
      return handleAPIError(
        CommonErrors.NOT_FOUND('Report not found or has expired')
      );
    }

    if (error.status === 409) {
      return handleAPIError(
        CommonErrors.VALIDATION_ERROR('Email already registered for this report')
      );
    }

    return handleAPIError(
      CommonErrors.INTERNAL_SERVER_ERROR(
        'Unable to save email at this time. Please try again.',
        correlationId
      )
    );
  }
}

// Apply middleware with public access
export const POST = withAPIMiddleware(emailCaptureHandler, {
  endpoint: 'extractor/results/[id]/email',
  cors: true,
  methods: ['POST', 'OPTIONS'],
  publicEndpoint: true // Allow public access without authentication
});

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);