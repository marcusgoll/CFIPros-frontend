/**
 * Upload Status API Route
 * Check processing status of uploaded files
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function statusHandler(request: NextRequest, context?: { params?: Promise<{ id: string }> }) {
  if (!context?.params) {
    const error = CommonErrors.VALIDATION_ERROR('Missing route parameters');
    return handleAPIError(error);
  }
  const { id } = await context.params;
  const clientIP = getClientIP(request);
  
  // Validate upload ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(idValidation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, `/upload/${id}/status`, {
    headers: {
      'X-Client-IP': clientIP,
    },
  });

  // Simple caching based on backend response headers
  const cacheControl = response.headers.get('cache-control');
  if (!cacheControl) {
    // Default caching strategy - don't cache status checks
    response.headers.set('Cache-Control', 'no-cache, must-revalidate');
  }

  return response;
}

// Apply middleware wrapper  
export const GET = withAPIMiddleware(statusHandler, {
  endpoint: 'results',
  cors: true,
  methods: ['GET', 'OPTIONS']
});

export const OPTIONS = createOptionsHandler(['GET', 'OPTIONS']);