/**
 * Results Summary API Route
 * Public access to lightweight analysis summaries
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function summaryHandler(
  request: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string | string[] | undefined }> }
) {
  const rawParams = (ctx as { params?: { id: string } | Promise<{ id: string | string[] | undefined }> })?.params;
  const maybePromise = rawParams as unknown as { then?: unknown };
  const isPromise = typeof maybePromise?.then === 'function';
  const resolvedParams = isPromise
    ? await (rawParams as Promise<{ id: string | string[] | undefined }>)
    : (rawParams as { id: string } | undefined);
  const { id } = (resolvedParams || {}) as { id: string };
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(summaryHandler, {
    endpoint: 'results',
    cors: true,
    methods: ['GET', 'OPTIONS']
  });
  return wrapped(request, context);
}

export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);
