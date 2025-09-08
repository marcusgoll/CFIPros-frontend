/**
 * File Upload API Route
 * Handles document upload, validation, and processing with enhanced security
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { validateRequest } from "@/lib/api/validation";
import {
  proxyFileUpload,
  getClientIP,
  addCorrelationId,
} from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";
import { rateLimiter } from "@/lib/api/rateLimiter";
import { currentUser } from "@clerk/nextjs/server";

async function uploadHandler(request: NextRequest) {
  // Add correlation ID for tracing
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  
  // Get authenticated user info (available due to auth: true middleware)
  const user = await currentUser();
  const userId = request.headers.get('X-User-ID') || user?.id;
  const userRole = (user?.privateMetadata?.['role'] as string) || 'student';
  
  if (!userId) {
    return handleAPIError(
      CommonErrors.UNAUTHORIZED('User ID not available')
    );
  }
  
  // Check rate limiting for file uploads
  const rateLimitCheck = await rateLimiter.check(clientIP, 'upload');

  if (!rateLimitCheck.success) {
    const resetDate = new Date(rateLimitCheck.reset).toISOString();
    return handleAPIError(
      CommonErrors.RATE_LIMIT_EXCEEDED(
        `Upload limit exceeded. ${rateLimitCheck.remaining}/${rateLimitCheck.limit} requests remaining. Try again after ${resetDate}`
      )
    );
  }

  // Validate file upload request with security checks
  const validation = await validateRequest.fileUpload(request);
  if (!validation.isValid) {
    // Determine specific error type based on validation message
    const errorMessage = validation.error!;
    let error;

    if (errorMessage.includes("No file was provided")) {
      error = CommonErrors.NO_FILE_PROVIDED(errorMessage);
    } else if (errorMessage.includes("exceeds maximum size")) {
      error = CommonErrors.FILE_TOO_LARGE(errorMessage);
    } else if (
      errorMessage.includes("Unsupported file type") ||
      errorMessage.includes("Unsupported file extension")
    ) {
      error = CommonErrors.UNSUPPORTED_FILE_TYPE(errorMessage);
    } else if (
      errorMessage.includes("security") ||
      errorMessage.includes("dangerous") ||
      errorMessage.includes("suspicious")
    ) {
      // Security-related errors
      error = CommonErrors.VALIDATION_ERROR(
        `Security validation failed: ${errorMessage}`
      );
    } else {
      error = CommonErrors.VALIDATION_ERROR(errorMessage);
    }

    return handleAPIError(error);
  }

  // Proxy request to backend for processing with security headers
  const response = await proxyFileUpload(request, "/upload", {
    headers: {
      "X-Correlation-ID": correlationId,
      "X-Client-IP": clientIP,
      "X-User-ID": userId,
      "X-User-Role": userRole,
      "X-Upload-Remaining": rateLimitCheck.remaining.toString(),
      "X-Rate-Limit-Reset": new Date(rateLimitCheck.reset).toISOString(),
    },
  });

  // Add security headers to response (security headers are already added by middleware)
  
  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", rateLimitCheck.limit.toString());
  response.headers.set("X-RateLimit-Remaining", rateLimitCheck.remaining.toString());
  response.headers.set("X-RateLimit-Reset", new Date(rateLimitCheck.reset).toISOString());

  return response;
}

// Apply middleware wrapper with authentication
export const POST = withAPIMiddleware(uploadHandler, {
  endpoint: "upload",
  cors: true,
  methods: ["POST", "OPTIONS"],
  auth: true, // Require authentication for file uploads
});

// Simple OPTIONS handler
export const OPTIONS = createOptionsHandler(["POST", "OPTIONS"]);
