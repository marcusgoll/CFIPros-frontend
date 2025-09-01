/**
 * Batch Status API Route v1.2
 * Maps to backend /v1/batches/{batchId} endpoint
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import {
  simpleProxyRequest,
  getClientIP,
  addCorrelationId,
} from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";
import { trackEvent } from "@/lib/analytics/telemetry";

async function batchStatusHandler(
  request: NextRequest,
  ctx:
    | { params: { batchId: string } }
    | { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const rawParams = (
    ctx as {
      params?: { batchId: string } | Promise<{ batchId: string | string[] | undefined }>;
    }
  )?.params;
  const maybePromise = rawParams as unknown as { then?: unknown };
  const isPromise = typeof maybePromise?.then === "function";
  const resolvedParams = isPromise
    ? await (rawParams as Promise<{ batchId: string | string[] | undefined }>)
    : (rawParams as { batchId: string } | undefined);
  const { batchId } = (resolvedParams || {}) as { batchId: string };

  // Validate batchId format (basic validation)
  if (!batchId || typeof batchId !== "string" || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR("Invalid batch ID"));
  }

  // Track batch status request
  trackEvent("batch_status_requested", {
    batch_id: batchId.substring(0, 8) + "...", // Partial ID for privacy
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + "...",
  });

  try {
    // Proxy to backend batch status endpoint
    const response = await simpleProxyRequest(`/v1/batches/${batchId}`, {
      method: request.method,
      headers: {
        "X-Correlation-ID": correlationId,
        "X-Client-IP": clientIP,
        "X-Service": "acs-extractor-v1.2",
      },
    });

    // Track successful status fetch
    if (response.status === 200) {
      trackEvent("batch_status_success", {
        batch_id: batchId.substring(0, 8) + "...",
        correlation_id: correlationId,
        response_status: response.status,
      });
    }

    // Add CORS headers for public access
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );

    return response;
  } catch (error: unknown) {
    // Track batch status failure
    const message = error instanceof Error ? error.message : "unknown_error";
    trackEvent("batch_status_failed", {
      batch_id: batchId.substring(0, 8) + "...",
      correlation_id: correlationId,
      error: message,
    });

    return handleAPIError(
      CommonErrors.INTERNAL_ERROR(
        "Batch status service temporarily unavailable. Please try again."
      )
    );
  }
}

// Apply middleware with batch-specific configuration and Next.js RouteContext typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(batchStatusHandler, {
    endpoint: "batch-status",
    cors: true,
    methods: ["GET", "OPTIONS"],
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(["GET", "OPTIONS"]);
