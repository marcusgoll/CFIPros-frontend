/**
 * BFF Proxy utilities for backend integration
 * Handles request forwarding, authentication, and error translation
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIError, handleAPIError } from './errors';
import { config } from '@/lib/config';
import type { BackendErrorResponse } from '@/lib/types';

export interface ProxyConfig {
  timeout?: number;
  headers?: Record<string, string>;
  preserveHeaders?: string[];
}

/**
 * Proxy request to backend API
 */
export async function proxyRequest(
  request: NextRequest,
  path: string,
  options: ProxyConfig = {}
): Promise<NextResponse> {
  const {
    timeout = config.requestTimeout,
    headers: additionalHeaders = {},
    preserveHeaders = ['authorization', 'content-type', 'accept']
  } = options;

  try {
    // Build backend URL
    const backendUrl = `${config.backendUrl}${path}`;
    
    // Extract and forward relevant headers
    const forwardedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CFIPros-BFF/1.0',
      ...additionalHeaders
    };

    // Preserve specific headers from client request
    preserveHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        forwardedHeaders[headerName] = value;
      }
    });

    // Get request body if present
    let body: string | FormData | null = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          body = JSON.stringify(await request.json());
        } catch {
          body = null;
        }
      } else if (contentType.includes('multipart/form-data')) {
        body = await request.formData();
        // Remove Content-Type header for FormData (browser sets it with boundary)
        delete forwardedHeaders['Content-Type'];
      }
    }

    // Create fetch options
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: forwardedHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (body) {
      fetchOptions.body = body;
    }

    // Make request to backend
    const backendResponse = await fetch(backendUrl, fetchOptions);

    // Handle backend response
    if (!backendResponse.ok) {
      await handleBackendError(backendResponse);
    }

    // Forward successful response
    const responseData = await backendResponse.json();
    const response = NextResponse.json(responseData, {
      status: backendResponse.status,
    });

    // Copy relevant response headers
    const headersToForward = [
      'content-type',
      'cache-control',
      'etag',
      'last-modified',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];

    headersToForward.forEach(headerName => {
      const value = backendResponse.headers.get(headerName);
      if (value) {
        response.headers.set(headerName, value);
      }
    });

    return response;

  } catch (error) {
    if (error instanceof APIError) {
      return handleAPIError(error);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        const timeoutError = new APIError(
          'request_timeout',
          504,
          'Backend request timed out'
        );
        return handleAPIError(timeoutError);
      }

      if (error.message.includes('fetch')) {
        const networkError = new APIError(
          'backend_error',
          502,
          'Failed to connect to backend service'
        );
        return handleAPIError(networkError);
      }
    }

    console.error('Proxy request error:', error);
    const internalError = new APIError(
      'internal_error',
      500,
      'Proxy request failed'
    );
    return handleAPIError(internalError);
  }
}

/**
 * Handle backend error responses
 */
async function handleBackendError(response: Response): Promise<never> {
  let errorData: BackendErrorResponse;
  
  try {
    errorData = await response.json();
  } catch {
    // Non-JSON error response
    throw new APIError(
      'backend_error',
      response.status,
      `Backend returned ${response.status} ${response.statusText}`
    );
  }

  // Convert backend error to APIError
  const apiError = APIError.fromBackendError(errorData, response.status);
  throw apiError;
}

/**
 * Create authenticated proxy request
 */
export async function authenticatedProxyRequest(
  request: NextRequest,
  path: string,
  token: string,
  config: ProxyConfig = {}
): Promise<NextResponse> {
  const authConfig: ProxyConfig = {
    ...config,
    headers: {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    },
  };

  return proxyRequest(request, path, authConfig);
}

/**
 * Proxy file upload to backend
 */
export async function proxyFileUpload(
  request: NextRequest,
  path: string,
  config: ProxyConfig = {}
): Promise<NextResponse> {
  // File uploads may take longer
  const uploadConfig: ProxyConfig = {
    timeout: 60000, // 1 minute
    preserveHeaders: ['authorization'],
    ...config,
  };

  return proxyRequest(request, path, uploadConfig);
}

/**
 * Extract client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  // Check for forwarded IP headers (behind proxies/CDN)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback for development
  return 'unknown';
}

/**
 * Check if request is from localhost/development
 */
export function isDevelopmentRequest(request: NextRequest): boolean {
  const clientIP = getClientIP(request);
  const developmentIPs = ['127.0.0.1', '::1', 'localhost', 'unknown'];
  
  return developmentIPs.includes(clientIP) || 
         clientIP.startsWith('192.168.') || 
         clientIP.startsWith('10.') ||
         clientIP.startsWith('172.');
}

/**
 * Add correlation ID for request tracing
 */
export function addCorrelationId(request: NextRequest): string {
  const existingId = request.headers.get('x-correlation-id');
  if (existingId) {
    return existingId;
  }

  // Generate simple correlation ID
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Proxy API request with flexible method and body support
 */
export async function proxyApiRequest(
  request: NextRequest,
  method: string,
  path: string,
  body?: any,
  options: ProxyConfig = {}
): Promise<NextResponse> {
  const {
    timeout = 30000, // Default 30 seconds
    headers: additionalHeaders = {},
    preserveHeaders = ['authorization', 'content-type', 'accept']
  } = options;

  try {
    // Build backend URL (use centralized config)
    const backendUrl = `${config.backendUrl}${path}`;
    
    // Extract and forward relevant headers
    const forwardedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CFIPros-BFF/1.0',
      ...additionalHeaders
    };

    // Preserve specific headers from client request
    preserveHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        forwardedHeaders[headerName] = value;
      }
    });

    // Create fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: forwardedHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    // Add body for non-GET requests
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Make request to backend
    const backendResponse = await fetch(backendUrl, fetchOptions);

    // Handle backend response
    if (!backendResponse.ok) {
      await handleBackendError(backendResponse);
    }

    // Forward successful response
    const responseData = await backendResponse.json();
    const response = NextResponse.json(responseData, {
      status: backendResponse.status,
    });

    // Copy relevant response headers
    const headersToForward = [
      'content-type',
      'cache-control',
      'etag',
      'last-modified',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];

    headersToForward.forEach(headerName => {
      const value = backendResponse.headers.get(headerName);
      if (value) {
        response.headers.set(headerName, value);
      }
    });

    return response;

  } catch (error) {
    if (error instanceof APIError) {
      return handleAPIError(error);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        const timeoutError = new APIError(
          'request_timeout',
          504,
          'Backend request timed out'
        );
        return handleAPIError(timeoutError);
      }

      if (error.message.includes('fetch')) {
        const networkError = new APIError(
          'backend_error',
          502,
          'Failed to connect to backend service'
        );
        return handleAPIError(networkError);
      }
    }

    console.error('Proxy API request error:', error);
    const internalError = new APIError(
      'internal_error',
      500,
      'Proxy API request failed'
    );
    return handleAPIError(internalError);
  }
}

/**
 * Validate backend response structure
 */
export function validateBackendResponse(data: unknown): boolean {
  // Basic validation - backend should return objects with expected structure
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Check for common error indicators
  const errorData = data as Record<string, unknown>;
  if (errorData['error'] && typeof errorData['error'] === 'string') {
    return false;
  }

  return true;
}
