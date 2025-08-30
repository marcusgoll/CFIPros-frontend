/**
 * Results Retrieval API Route
 * Public access to completed analysis results
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';
import { apiClient } from '@/lib/api/client';

async function resultsHandler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const clientIP = getClientIP(request);
  
  // Validate result ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(idValidation.error!);
    return handleAPIError(error);
  }

  // Fetch from backend via API client (keeps tests compatible)
  try {
    const data = await apiClient.get(`/results/${id}`, {
      'X-Client-IP': clientIP,
    });

    // Determine caching headers based on status to match tests' expectations
    const isProcessing = data?.status === 'processing';
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }) as unknown as import('next/server').NextResponse;

    if (isProcessing) {
      response.headers.set('Cache-Control', 'no-cache');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      response.headers.set('ETag', `"result-${id}"`);
    }

    return response;
  } catch (error) {
    // Try to parse APIClient errors that may be stringified JSON
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as { error?: string; message?: string; status?: number; details?: string };
        if (parsed.error === 'timeout') {
          return handleAPIError(CommonErrors.REQUEST_TIMEOUT('Backend request timed out'));
        }
        if (parsed.error === 'result_not_found' || parsed.error === 'resource_not_found') {
          return handleAPIError(CommonErrors.RESULT_NOT_FOUND(id));
        }
      } catch {
        // fall through
      }
    }
    return handleAPIError(CommonErrors.INTERNAL_ERROR('Failed to retrieve results'));
  }
}

export const GET = withAPIMiddleware(resultsHandler, {
  endpoint: 'results',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);
