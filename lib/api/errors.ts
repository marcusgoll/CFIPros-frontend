/**
 * API Error handling utilities with Problem Details format
 * Following RFC 7807 Problem Details for HTTP APIs
 */

import { NextResponse } from "next/server";
import { logError } from "@/lib/utils/logger";
import type { ProblemDetails, BackendErrorResponse } from "@/lib/types";

export class APIError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly instance?: string | undefined;

  constructor(code: string, status: number, detail: string, instance?: string) {
    super(detail);
    this.name = "APIError";
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
  static fromBackendError(
    backendError: BackendErrorResponse,
    fallbackStatus = 500
  ): APIError {
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
    const message =
      backendError?.message || backendError?.detail || "Unknown error occurred";
    return new APIError("internal_error", 500, message);
  }
}

/**
 * Handle API errors and return proper HTTP response
 */
export function handleAPIError(error: Error | APIError): NextResponse {
  if (error instanceof APIError) {
    const problemDetails = error.toProblemDetails();
    // Add unique instance ID if not present
    if (!problemDetails.instance) {
      problemDetails.instance = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const response = NextResponse.json(problemDetails, {
      status: error.status,
      headers: {
        "Content-Type": "application/json",
        "X-Error-Code": error.code,
      },
    });
    
    return addSecurityHeaders(response);
  }

  // Generic error handling
  logError("Unhandled API error:", error);

  const problemDetails = {
    type: "about:blank#internal_error",
    title: "internal_error",
    status: 500,
    detail: typeof error === 'string' ? error : (error.message || "Internal server error"),
    instance: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const response = NextResponse.json(problemDetails, {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      "X-Error-Code": "internal_error",
    },
  });
  
  return addSecurityHeaders(response);
}

/**
 * Common API error types
 */
export const CommonErrors = {
  // Authentication & Authorization
  UNAUTHORIZED: (detail = "Authentication required") =>
    new APIError("unauthorized", 401, detail),

  FORBIDDEN: (detail = "Access forbidden") =>
    new APIError("forbidden", 403, detail),

  // Validation
  VALIDATION_ERROR: (detail: string) =>
    new APIError("validation_error", 400, detail),

  INVALID_REQUEST: (detail: string) =>
    new APIError("invalid_request", 400, detail),

  INVALID_RESULT_ID: (detail = "Invalid result ID format") =>
    new APIError("invalid_result_id", 400, detail),

  METHOD_NOT_ALLOWED: (detail = "Method not allowed") =>
    new APIError("method_not_allowed", 405, detail),

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: (detail = "Rate limit exceeded") =>
    new APIError("rate_limit_exceeded", 429, detail),

  // File Upload
  FILE_TOO_LARGE: (detail = "File exceeds maximum size limit") =>
    new APIError("file_too_large", 413, detail),

  UNSUPPORTED_FILE_TYPE: (detail = "Unsupported file type") =>
    new APIError("unsupported_file_type", 400, detail),

  NO_FILE_PROVIDED: (detail = "No file was provided for upload") =>
    new APIError("no_file_provided", 400, detail),

  // Resource Access
  NOT_FOUND: (detail = "Resource not found") =>
    new APIError("not_found", 404, detail),

  RESOURCE_NOT_FOUND: (resource: string, id: string) =>
    new APIError("resource_not_found", 404, `${resource} ${id} not found`),

  RESULT_NOT_FOUND: (resultId: string) =>
    new APIError("result_not_found", 404, `Result ${resultId} not found`),

  // Backend Integration
  BACKEND_ERROR: (detail = "Backend service error") =>
    new APIError("backend_error", 502, detail),

  REQUEST_TIMEOUT: (detail = "Backend request timed out") =>
    new APIError("request_timeout", 504, detail),

  PROCESSING_FAILED: (detail = "Processing failed") =>
    new APIError("processing_failed", 500, detail),

  // Generic
  INTERNAL_ERROR: (detail = "Internal server error") =>
    new APIError("internal_error", 500, detail),
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
  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set(
    "X-RateLimit-Reset",
    Math.ceil(resetTime / 1000).toString()
  );
  response.headers.set(
    "Retry-After",
    Math.ceil((resetTime - Date.now()) / 1000).toString()
  );

  return response;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Only add header if not already set
  if (!response.headers.has("X-Content-Type-Options")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!response.headers.has("X-Frame-Options")) {
    response.headers.set("X-Frame-Options", "DENY");
  }
  if (!response.headers.has("X-XSS-Protection")) {
    response.headers.set("X-XSS-Protection", "1; mode=block");
  }
  if (!response.headers.has("Strict-Transport-Security")) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (!response.headers.has("Content-Security-Policy")) {
    response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'");
  }
  if (!response.headers.has("Referrer-Policy")) {
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return response;
}

/**
 * Add CORS headers to response with proper origin validation
 */
export function addCORSHeaders(
  response: NextResponse,
  request?: import("next/server").NextRequest,
  methods = "GET, POST, PUT, DELETE, OPTIONS"
): NextResponse {
  const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",") || [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://cfipros.com",
    "https://www.cfipros.com",
  ];

  const origin = request?.headers.get("origin");

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (!origin && process.env.NODE_ENV === "development") {
    // Allow requests without origin in development (e.g., Postman, curl)
    response.headers.set(
      "Access-Control-Allow-Origin",
      allowedOrigins[0] as string
    );
  }

  response.headers.set("Access-Control-Allow-Methods", methods);
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Correlation-ID"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}
