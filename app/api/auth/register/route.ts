/**
 * Authentication Register API Route
 * Handle user registration and account creation
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function registerHandler(request: NextRequest) {
  const clientIP = getClientIP(request);

  // Validate registration request
  const validation = await validateRequest.auth(request);
  if (!validation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(validation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, '/auth/register', {
    headers: {
      'X-Client-IP': clientIP,
    },
  });

  // Add security headers for auth endpoints
  response.headers.set('Cache-Control', 'no-store'); // Never cache auth responses
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}

export const POST = withAPIMiddleware(registerHandler, {
  endpoint: 'auth',
  cors: true,
  methods: ['POST', 'OPTIONS']
});

export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);