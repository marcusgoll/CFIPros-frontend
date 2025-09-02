/**
 * Batch Sharing API Route v1.2
 * Maps to backend /v1/batches/{batchId}/sharing endpoint for cohort management
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { validateRequest } from "@/lib/api/validation";
import { proxyRequest, getClientIP, addCorrelationId } from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";
import { trackEvent } from "@/lib/analytics/telemetry";

async function sharingHandler(
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

  // Validate batchId format
  if (!batchId || typeof batchId !== "string" || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR("Invalid batch ID"));
  }

  const method = request.method;

  try {
    let validationResult = null;

    // Handle different HTTP methods
    switch (method) {
      case "GET":
        // Get sharing settings and cohort list
        trackEvent("batch_sharing_list_requested", {
          batch_id: batchId.substring(0, 8) + "...",
          correlation_id: correlationId,
        });
        break;

      case "POST":
        // Create new sharing permissions or add to cohort
        validationResult = await validateRequest.json(request, {
          requiredFields: ["action"],
          optionalFields: ["cohortId", "permissions", "emails", "roles"],
        });

        if (!validationResult.isValid) {
          return handleAPIError(
            CommonErrors.VALIDATION_ERROR(validationResult.error!)
          );
        }

        // Validate sharing data structure
        trackEvent("batch_sharing_update_requested", {
          batch_id: batchId.substring(0, 8) + "...",
          action: (validationResult.data as Record<string, unknown>)["action"],
          correlation_id: correlationId,
        });
        break;

      case "DELETE":
        // Remove sharing permissions
        const url = new URL(request.url);
        const cohortId = url.searchParams.get("cohortId");

        trackEvent("batch_sharing_revoke_requested", {
          batch_id: batchId.substring(0, 8) + "...",
          cohort_id: cohortId?.substring(0, 8) + "...",
          correlation_id: correlationId,
        });
        break;

      default:
        return handleAPIError(
          CommonErrors.METHOD_NOT_ALLOWED(`Method ${method} not allowed`)
        );
    }

    // Proxy to backend sharing endpoint
    const response = await proxyRequest(request, `/v1/batches/${batchId}/sharing`, {
      headers: {
        "X-Correlation-ID": correlationId,
        "X-Client-IP": clientIP,
        "X-Service": "acs-extractor-v1.2",
      },
    });

    // Track successful sharing operation
    if (response.status >= 200 && response.status < 300) {
      trackEvent("batch_sharing_success", {
        batch_id: batchId.substring(0, 8) + "...",
        method,
        correlation_id: correlationId,
        response_status: response.status,
      });
    }

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );

    return response;
  } catch (error: unknown) {
    // Track sharing operation failure
    const message = error instanceof Error ? error.message : "unknown_error";
    trackEvent("batch_sharing_failed", {
      batch_id: batchId.substring(0, 8) + "...",
      method,
      correlation_id: correlationId,
      error: message,
    });

    return handleAPIError(
      CommonErrors.INTERNAL_ERROR(
        "Sharing service temporarily unavailable. Please try again."
      )
    );
  }
}

// Apply middleware with sharing-specific configuration and Next.js RouteContext typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(sharingHandler, {
    endpoint: "batch-sharing",
    cors: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });
  return wrapped(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(sharingHandler, {
    endpoint: "batch-sharing",
    cors: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });
  return wrapped(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(sharingHandler, {
    endpoint: "batch-sharing",
    cors: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler([
  "GET",
  "POST",
  "DELETE",
  "OPTIONS",
]);
