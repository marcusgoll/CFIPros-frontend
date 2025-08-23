/**
 * Simplified API middleware wrapper
 * Eliminates duplicate boilerplate in route handlers
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { handleAPIError, addSecurityHeaders, addCORSHeaders } from './errors';
import { getClientIP } from './proxy';

// Simple rate limiter using Map (sufficient for BFF layer)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function checkRateLimit(clientIP: string, endpoint: keyof typeof config.rateLimiting): RateLimitResult {
  const limits = config.rateLimiting[endpoint];
  const key = `${endpoint}:${clientIP}`;
  const now = Date.now();
  
  // Cleanup expired entries (simple garbage collection)
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.reset < now) {
      rateLimitStore.delete(k);
    }
  }
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || existing.reset < now) {
    // First request or expired window
    const reset = now + limits.windowMs;
    rateLimitStore.set(key, { count: 1, reset });
    
    return {
      success: true,
      limit: limits.maxRequests,
      remaining: limits.maxRequests - 1,
      reset,
    };
  }
  
  if (existing.count >= limits.maxRequests) {
    return {
      success: false,
      limit: limits.maxRequests,
      remaining: 0,
      reset: existing.reset,
    };
  }
  
  // Increment counter
  existing.count += 1;
  
  return {
    success: true,
    limit: limits.maxRequests,
    remaining: limits.maxRequests - existing.count,
    reset: existing.reset,
  };
}

interface MiddlewareOptions {
  endpoint: keyof typeof config.rateLimiting;
  auth?: boolean;
  cors?: boolean;
  methods?: string[];
}

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<any> }
) => Promise<NextResponse>;

/**
 * API middleware wrapper that handles common concerns
 */
export function withAPIMiddleware(
  handler: RouteHandler,
  options: MiddlewareOptions
): RouteHandler {
  return async (request: NextRequest, context?: { params: Promise<any> }) => {
    try {
      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimit = checkRateLimit(clientIP, options.endpoint);
      
      if (!rateLimit.success) {
        const errorResponse = NextResponse.json(
          {
            type: 'about:blank#rate_limit_exceeded',
            title: 'rate_limit_exceeded',
            status: 429,
            detail: `Rate limit exceeded. Try again after ${new Date(rateLimit.reset).toISOString()}`,
          },
          { status: 429 }
        );
        
        // Add rate limit headers
        errorResponse.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
        errorResponse.headers.set('X-RateLimit-Remaining', '0');
        errorResponse.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.reset / 1000).toString());
        errorResponse.headers.set('Retry-After', Math.ceil((rateLimit.reset - Date.now()) / 1000).toString());
        
        return addSecurityHeaders(errorResponse);
      }
      
      // Call the actual handler
      const response = await handler(request, context);
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.reset / 1000).toString());
      
      // Add CORS headers if requested
      let finalResponse = response;
      if (options.cors) {
        finalResponse = addCORSHeaders(response, request, options.methods?.join(', '));
      }
      
      // Add security headers
      return addSecurityHeaders(finalResponse);
      
    } catch (error) {
      console.error(`API error in ${options.endpoint}:`, error);
      return handleAPIError(error as Error);
    }
  };
}

/**
 * Simple OPTIONS handler for CORS preflight
 */
export function createOptionsHandler(methods: string[] = ['GET', 'POST']): RouteHandler {
  return async (request: NextRequest) => {
    const response = new NextResponse(null, { status: 200 });
    return addCORSHeaders(response, request, methods.join(', '));
  };
}