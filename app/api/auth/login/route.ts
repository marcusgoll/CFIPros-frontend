/**
 * Authentication Login API Route
 * Handle user authentication and token generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyRequest, getClientIP } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function loginHandler(request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const clientIP = getClientIP(request);

  // Validate authentication request
  const validation = await validateRequest.auth(request);
  if (!validation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(validation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, '/auth/login', {
    headers: {
      'X-Client-IP': clientIP,
    },
  });

  // Add security headers for auth endpoints
  response.headers.set('Cache-Control', 'no-store'); // Never cache auth responses
  response.headers.set('Pragma', 'no-cache');
  
  return response;
}

export const POST = withAPIMiddleware(loginHandler, {
  endpoint: 'auth',
  cors: true,
  methods: ['POST', 'OPTIONS']
});

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-IP');
  return response;
}