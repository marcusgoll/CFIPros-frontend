/**
 * Results Retrieval API Route
 * Public access to completed analysis results
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function resultsHandler(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context?.params!;
  const clientIP = getClientIP(request);
  
  // Validate result ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(idValidation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, `/results/${id}`, {
    headers: {
      'X-Client-IP': clientIP,
    },
  });

  // Add caching headers - results are immutable once completed
  response.headers.set('Cache-Control', 'public, max-age=86400, immutable'); // 24 hours
  response.headers.set('ETag', `"result-${id}"`);

  return response;
}

export const GET = withAPIMiddleware(resultsHandler, {
  endpoint: 'results',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);