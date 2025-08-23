/**
 * File Upload API Route
 * Handles document upload, validation, and processing
 */

import { NextRequest } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';
import { validateRequest } from '@/lib/api/validation';
import { proxyFileUpload, getClientIP, addCorrelationId } from '@/lib/api/proxy';
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

async function uploadHandler(request: NextRequest) {
  // Add correlation ID for tracing
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);

  // Validate file upload request
  const validation = await validateRequest.fileUpload(request);
  if (!validation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(validation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend for processing
  return await proxyFileUpload(request, '/upload', {
    headers: {
      'X-Correlation-ID': correlationId,
      'X-Client-IP': clientIP,
    },
  });
}

// Apply middleware wrapper
export const POST = withAPIMiddleware(uploadHandler, {
  endpoint: 'upload',
  cors: true,
  methods: ['POST', 'OPTIONS']
});

// Simple OPTIONS handler
export const OPTIONS = createOptionsHandler(['POST', 'OPTIONS']);