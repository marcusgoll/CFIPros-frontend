/**
 * ACS Extractor Results API Route - Public Results Access
 * Maps to backend /v1/results/{id} endpoint for public result viewing
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import {
  proxyApiRequest,
  getClientIP,
  addCorrelationId,
} from "@/lib/api/proxy";
import { CommonErrors, handleAPIError, APIError } from "@/lib/api/errors";
import { trackEvent } from "@/lib/analytics/telemetry";

async function getResultsHandler(
  request: NextRequest,
  ctx:
    | { params: { id: string } }
    | { params: Promise<{ id: string | string[] | undefined }> }
) {
  const correlationId = addCorrelationId(request);
  const clientIP = getClientIP(request);
  const rawParams = (
    ctx as {
      params?: { id: string } | Promise<{ id: string | string[] | undefined }>;
    }
  )?.params;
  const maybePromise = rawParams as unknown as { then?: unknown };
  const isPromise = typeof maybePromise?.then === "function";
  const resolvedParams = isPromise
    ? await (rawParams as Promise<{ id: string | string[] | undefined }>)
    : (rawParams as { id: string } | undefined);
  const { id: reportId } = (resolvedParams || {}) as { id: string };

  // Basic validation for report ID format
  if (!reportId || typeof reportId !== "string" || reportId.length < 10) {
    return handleAPIError(
      CommonErrors.VALIDATION_ERROR("Invalid report ID format")
    );
  }

  // Track public result access
  trackEvent("extractor_results_viewed", {
    report_id: reportId.substring(0, 8) + "...", // Partial ID for privacy
    correlation_id: correlationId,
    is_public: true,
  });

  try {
    // Proxy to backend results endpoint - public access, no auth required
    const response = await proxyApiRequest(
      request,
      `GET`,
      `/v1/results/${reportId}`,
      null,
      {
        headers: {
          "X-Correlation-ID": correlationId,
          "X-Client-IP": clientIP,
          "X-Service": "acs-extractor-results",
          "X-Public-Access": "true",
        },
      }
    );

    // Add no-index meta headers for public results (PII protection)
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    // Add CORS headers for public access
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, X-Requested-With"
    );

    // Add cache headers for public results (short cache for performance)
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");

    return response;
  } catch (error: unknown) {
    // Track result access failure
    trackEvent("extractor_results_error", {
      report_id: reportId.substring(0, 8) + "...",
      correlation_id: correlationId,
      error: error instanceof Error ? error.message : "unknown_error",
    });

    if (error instanceof APIError) {
      if (error.status === 404) {
        return handleAPIError(CommonErrors.RESULT_NOT_FOUND(reportId));
      }
      return handleAPIError(error);
    }

    return handleAPIError(
      CommonErrors.INTERNAL_ERROR(
        "Unable to retrieve results at this time. Please try again."
      )
    );
  }
}

// Apply middleware with public access and Next.js RouteContext typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(getResultsHandler, {
    endpoint: "results",
    cors: true,
    methods: ["GET", "OPTIONS"],
  });
  return wrapped(request, context);
}

// OPTIONS handler for CORS preflight
export const OPTIONS = createOptionsHandler(["GET", "OPTIONS"]);
