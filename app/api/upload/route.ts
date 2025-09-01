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
import {
  FileUploadRateLimiter,
  FileUploadCSP,
} from "@/lib/security/fileUpload";

async function uploadHandler(request: NextRequest) {
  // Add correlation ID for tracing
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);

  // Check rate limiting for file uploads
  const rateLimitCheck = FileUploadRateLimiter.checkRateLimit(
    clientIP,
    10, // Max 10 uploads per hour
    60 * 60 * 1000 // 1 hour window
  );

  if (!rateLimitCheck.allowed) {
    const resetDate = new Date(rateLimitCheck.resetTime).toISOString();
    return handleAPIError(
      CommonErrors.RATE_LIMIT_EXCEEDED(
        `Upload limit exceeded. Try again after ${resetDate}`
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
      "X-Upload-Remaining": rateLimitCheck.remainingUploads.toString(),
      "X-Rate-Limit-Reset": new Date(rateLimitCheck.resetTime).toISOString(),
    },
  });

  // Add security headers to response
  const securityHeaders = FileUploadCSP.getUploadPageCSP();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers
  response.headers.set("X-RateLimit-Limit", "10");
  response.headers.set(
    "X-RateLimit-Remaining",
    rateLimitCheck.remainingUploads.toString()
  );
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(rateLimitCheck.resetTime).toISOString()
  );

  return response;
}

// Apply middleware wrapper
export const POST = withAPIMiddleware(uploadHandler, {
  endpoint: "upload",
  cors: true,
  methods: ["POST", "OPTIONS"],
});

// Simple OPTIONS handler
export const OPTIONS = createOptionsHandler(["POST", "OPTIONS"]);
