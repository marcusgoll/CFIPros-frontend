/**
 * API Error handling utilities with Problem Details format
 * Following RFC 7807 Problem Details for HTTP APIs
 */

import { NextResponse } from 'next/server';
import type { ProblemDetails, BackendErrorResponse } from '@/lib/types';

export class APIError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly instance?: string | undefined;

  constructor(
    code: string,
    status: number,
    detail: string,
    instance?: string
  ) {
    super(detail);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.detail = detail;
    this.instance = instance;
  }

  /**
   * Convert APIError to Problem Details format
   */
  toProblemDetails(): ProblemDetails {
    const result: ProblemDetails = {
      type: `about:blank#${this.code}`,
      title: this.code,
      status: this.status,
      detail: this.detail,
    };
    
    if (this.instance) {
      result.instance = this.instance;
    }
    
    return result;
  }

  /**
   * Create APIError from backend response
   */
  static fromBackendError(backendError: BackendErrorResponse, fallbackStatus = 500): APIError {
    if (backendError?.type && backendError?.title && backendError?.detail) {
      // Backend already returned Problem Details format
      const code = backendError.title;
      const status = backendError.status || fallbackStatus;
      const detail = backendError.detail;
      const instance = backendError.instance;
      
      return new APIError(code, status, detail, instance);
    }

    if (backendError?.error && backendError?.message) {
      // Backend returned simple error format
      return new APIError(
        backendError.error,
        backendError.status || fallbackStatus,
        backendError.message
      );
    }

    // Unknown error format
    const message = backendError?.message || backendError?.detail || 'Unknown error occurred';
    return new APIError('internal_error', 500, message);
  }
}

/**
 * Handle API errors and return proper HTTP response
 */
export function handleAPIError(error: Error | APIError): NextResponse {
  if (error instanceof APIError) {
    const problemDetails = error.toProblemDetails();
    
    return NextResponse.json(problemDetails, {
      status: error.status,
      headers: {
        'Content-Type': 'application/problem+json',
        'X-Error-Code': error.code,
      },
    });
  }

  // Generic error handling
  console.error('Unhandled API error:', error);
  
  const problemDetails = {
    type: 'about:blank#internal_error',
    title: 'internal_error',
    status: 500,
    detail: 'An internal server error occurred',
  };

  return NextResponse.json(problemDetails, {
    status: 500,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Error-Code': 'internal_error',
    },
  });
}

/**
 * Common API error types
 */
export const CommonErrors = {
  // Authentication & Authorization
  UNAUTHORIZED: (detail = 'Authentication required') => 
    new APIError('unauthorized', 401, detail),
  
  FORBIDDEN: (detail = 'Access forbidden') => 
    new APIError('forbidden', 403, detail),

  // Validation
  VALIDATION_ERROR: (detail: string) => 
    new APIError('validation_error', 400, detail),

  INVALID_REQUEST: (detail: string) => 
    new APIError('invalid_request', 400, detail),

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: (detail = 'Rate limit exceeded') => 
    new APIError('rate_limit_exceeded', 429, detail),

  // File Upload
  FILE_TOO_LARGE: (detail = 'File exceeds maximum size limit') => 
    new APIError('file_too_large', 400, detail),

  UNSUPPORTED_FILE_TYPE: (detail = 'Unsupported file type') => 
    new APIError('unsupported_file_type', 400, detail),

  NO_FILE_PROVIDED: (detail = 'No file was provided for upload') => 
    new APIError('no_file_provided', 400, detail),

  // Resource Access
  RESOURCE_NOT_FOUND: (resource: string, id: string) => 
    new APIError('resource_not_found', 404, `${resource} ${id} not found`),

  RESULT_NOT_FOUND: (resultId: string) => 
    new APIError('result_not_found', 404, `Result ${resultId} not found`),

  // Backend Integration
  BACKEND_ERROR: (detail = 'Backend service error') => 
    new APIError('backend_error', 502, detail),

  REQUEST_TIMEOUT: (detail = 'Backend request timed out') => 
    new APIError('request_timeout', 504, detail),

  PROCESSING_FAILED: (detail = 'Processing failed') => 
    new APIError('processing_failed', 500, detail),

  // Generic
  INTERNAL_ERROR: (detail = 'Internal server error') => 
    new APIError('internal_error', 500, detail),
} as const;

/**
 * Create error response with rate limiting headers
 */
export function createRateLimitErrorResponse(
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  const error = CommonErrors.RATE_LIMIT_EXCEEDED(
    `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`
  );

  const response = handleAPIError(error);
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());

  return response;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Add CORS headers to response with proper origin validation
 */
export function addCORSHeaders(
  response: NextResponse, 
  request?: import('next/server').NextRequest,
  methods = 'GET, POST, OPTIONS'
): NextResponse {
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://cfipros.com',
    'https://www.cfipros.com'
  ];
  
  const origin = request?.headers.get('origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin && process.env.NODE_ENV === 'development') {
    // Allow requests without origin in development (e.g., Postman, curl)
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0] as string);
  }
  
  response.headers.set('Access-Control-Allow-Methods', methods);
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}