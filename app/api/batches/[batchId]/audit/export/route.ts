/**
 * Batch Audit Export API Route v1.2
 * Maps to backend /v1/batches/{batchId}/audit/export endpoint for audit log export
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { proxyRequest, getClientIP, addCorrelationId } from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";
import { trackEvent } from "@/lib/analytics/telemetry";

async function auditExportHandler(
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

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const action = url.searchParams.get("action"); // Filter by specific action

  // Validate batchId format
  if (!batchId || typeof batchId !== "string" || batchId.length < 10) {
    return handleAPIError(CommonErrors.VALIDATION_ERROR("Invalid batch ID"));
  }

  // Validate export format
  const allowedFormats = ["csv", "json"];
  if (!allowedFormats.includes(format)) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR(
        `Invalid export format. Allowed formats: ${allowedFormats.join(", ")}`
      )
    );
  }

  // Validate date range if provided
  if (startDate && !Date.parse(startDate)) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR("Invalid start date format")
    );
  }

  if (endDate && !Date.parse(endDate)) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR("Invalid end date format")
    );
  }

  // Track audit export request
  trackEvent("batch_audit_export_requested", {
    batch_id: batchId.substring(0, 8) + "...",
    format,
    has_date_range: !!(startDate || endDate),
    has_action_filter: !!action,
    correlation_id: correlationId,
    client_ip: clientIP.substring(0, 8) + "...",
  });

  try {
    // Build query string
    const queryParams = new URLSearchParams({ format });

    if (startDate) {
      queryParams.set("startDate", startDate);
    }
    if (endDate) {
      queryParams.set("endDate", endDate);
    }
    if (action) {
      queryParams.set("action", action);
    }

    // Proxy to backend audit export endpoint
    const response = await proxyRequest(
      request,
      `/v1/batches/${batchId}/audit/export?${queryParams.toString()}`,
      {
        headers: {
          "X-Correlation-ID": correlationId,
          "X-Client-IP": clientIP,
          "X-Service": "acs-extractor-v1.2",
        },
      }
    );

    // Track successful audit export
    if (response.status === 200) {
      trackEvent("batch_audit_export_success", {
        batch_id: batchId.substring(0, 8) + "...",
        format,
        correlation_id: correlationId,
        response_status: response.status,
      });
    }

    // Preserve content-type and content-disposition headers for file downloads
    const contentType = response.headers.get("content-type");
    const contentDisposition = response.headers.get("content-disposition");

    if (contentType) {
      response.headers.set("Content-Type", contentType);
    } else {
      // Set default content type based on format
      const mimeType = format === "json" ? "application/json" : "text/csv";
      response.headers.set("Content-Type", mimeType);
    }

    if (contentDisposition) {
      response.headers.set("Content-Disposition", contentDisposition);
    } else {
      // Set default filename
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `batch-${batchId}-audit-${timestamp}.${format}`;
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
    }

    // Add CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );

    return response;
  } catch (error: unknown) {
    // Track audit export failure
    const message = error instanceof Error ? error.message : "unknown_error";
    trackEvent("batch_audit_export_failed", {
      batch_id: batchId.substring(0, 8) + "...",
      format,
      correlation_id: correlationId,
      error: message,
    });

    return handleAPIError(
      CommonErrors.INTERNAL_ERROR(
        "Audit export service temporarily unavailable. Please try again."
      )
    );
  }
}

// Apply middleware with audit export-specific configuration and Next.js RouteContext typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(auditExportHandler, {
    endpoint: "batch-audit-export",
    cors: true,
    methods: ["GET", "OPTIONS"],
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(["GET", "OPTIONS"]);
