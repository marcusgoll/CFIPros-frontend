/**
 * Simplified API middleware wrapper
 * Eliminates duplicate boilerplate in route handlers
 */

import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { handleAPIError, addSecurityHeaders, addCORSHeaders } from "./errors";
import { getClientIP } from "./proxy";
import { rateLimiter } from "@/lib/api/rateLimiter";
import { logError } from "@/lib/utils/logger";

// Use shared rate limiter so tests can mock its behavior

interface MiddlewareOptions {
  endpoint: keyof typeof config.rateLimiting;
  auth?: boolean;
  cors?: boolean;
  methods?: string[];
}

// (internal): handler type captured in overloads below

/**
 * API middleware wrapper that handles common concerns
 */
// Overload: handler without context
export function withAPIMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: MiddlewareOptions
): (request: NextRequest) => Promise<NextResponse>;

// Overload: handler with context
export function withAPIMiddleware<Ctx>(
  handler: (request: NextRequest, context: Ctx) => Promise<NextResponse>,
  options: MiddlewareOptions
): (request: NextRequest, context: Ctx) => Promise<NextResponse>;

// Implementation
export function withAPIMiddleware<Ctx = unknown>(
  handler: (request: NextRequest, context?: Ctx) => Promise<NextResponse>,
  options: MiddlewareOptions
): (request: NextRequest, context?: Ctx) => Promise<NextResponse> {
  return async (request: NextRequest, context?: Ctx) => {
    try {
      // Rate limiting
      const clientIP = getClientIP(request);
      const rateLimit = await rateLimiter.check(clientIP, options.endpoint);

      const isAllowed = rateLimit.success !== false;
      if (!isAllowed) {
        const errorResponse = NextResponse.json(
          {
            type: "about:blank#rate_limit_exceeded",
            title: "rate_limit_exceeded",
            status: 429,
            detail: `Rate limit exceeded. Try again after ${new Date(rateLimit.reset).toISOString()}`,
          },
          { status: 429 }
        );

        // Add rate limit headers
        if (rateLimit.limit !== null && rateLimit.limit !== undefined) {
          errorResponse.headers.set(
            "X-RateLimit-Limit",
            rateLimit.limit.toString()
          );
        }
        errorResponse.headers.set("X-RateLimit-Remaining", "0");
        if (rateLimit.reset !== null && rateLimit.reset !== undefined) {
          errorResponse.headers.set(
            "X-RateLimit-Reset",
            Math.ceil(rateLimit.reset / 1000).toString()
          );
          errorResponse.headers.set(
            "Retry-After",
            Math.ceil((rateLimit.reset - Date.now()) / 1000).toString()
          );
        }

        return addSecurityHeaders(errorResponse);
      }

      // Call the actual handler
      const response = await handler(request, context);

      // Add rate limit headers to successful responses (guard undefined in tests)
      const endpointLimits = config.rateLimiting[options.endpoint];
      const limit =
        rateLimit.limit !== undefined && rateLimit.limit !== null
          ? rateLimit.limit
          : endpointLimits.maxRequests;
      const remaining =
        rateLimit.remaining !== undefined && rateLimit.remaining !== null
          ? rateLimit.remaining
          : Math.max(0, endpointLimits.maxRequests - 1);
      const resetMs =
        rateLimit.reset !== undefined && rateLimit.reset !== null
          ? rateLimit.reset
          : Date.now() + endpointLimits.windowMs;
      response.headers.set("X-RateLimit-Limit", String(limit));
      response.headers.set("X-RateLimit-Remaining", String(remaining));
      response.headers.set(
        "X-RateLimit-Reset",
        String(Math.ceil(resetMs / 1000))
      );

      // Add CORS headers if requested
      let finalResponse = response;
      if (options.cors) {
        finalResponse = addCORSHeaders(
          response,
          request,
          options.methods?.join(", ")
        );
      }

      // Add security headers
      return addSecurityHeaders(finalResponse);
    } catch (error) {
      logError(`API error in ${options.endpoint}:`, error);
      return handleAPIError(error as Error);
    }
  };
}

/**
 * Simple OPTIONS handler for CORS preflight
 */
export function createOptionsHandler(methods: string[] = ["GET", "POST"]) {
  return async (request: NextRequest) => {
    const response = new NextResponse(null, { status: 200 });
    return addCORSHeaders(response, request, methods.join(", "));
  };
}
