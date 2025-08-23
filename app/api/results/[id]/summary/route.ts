/**
 * Results Summary API Route
 * Public access to lightweight analysis summaries
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function summaryHandler(request: NextRequest, context?: { params: Promise<{ id: string }> }) {
  const { id } = await context?.params!;
  const clientIP = getClientIP(request);
  
  // Validate result ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(idValidation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, `/results/${id}/summary`, {
    headers: {
      'X-Client-IP': clientIP,
    },
  });

  // Aggressive caching for summaries - they are lightweight and immutable
  response.headers.set('Cache-Control', 'public, max-age=604800, immutable'); // 1 week
  response.headers.set('ETag', `"summary-${id}"`);

  return response;
}

export const GET = withAPIMiddleware(summaryHandler, {
  endpoint: 'results',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);