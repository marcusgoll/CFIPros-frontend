/**
 * Results Retrieval API Route
 * Public access to completed analysis results
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { validateRequest } from "@/lib/api/validation";
import { CommonErrors, handleAPIError, APIError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";

async function resultsHandler(
  request: NextRequest,
  ctx:
    | { params: { id: string } }
    | { params: Promise<{ id: string | string[] | undefined }> }
) {
  // Support both direct params and Promise-wrapped params (used in tests)
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
  const { id } = (resolvedParams || {}) as { id: string };

  void request;
  // Validate result ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.INVALID_RESULT_ID("Invalid result ID format");
    return handleAPIError(error);
  }

  // Fetch from backend via API client (keeps tests compatible)
  try {
    const data = await apiClient.get<
      Record<string, unknown> | { status?: string }
    >(`/results/${id}`);

    // Determine caching headers based on status to match tests' expectations
    const isProcessing =
      (data as { status?: string } | undefined)?.status === "processing";
    const res = NextResponse.json(data, { status: 200 });
    if (isProcessing) {
      res.headers.set("Cache-Control", "no-cache");
    } else {
      res.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.headers.set("ETag", `"result-${id}"`);
    }
    return res;
  } catch (error) {
    // Try to parse APIClient errors that may be stringified JSON
    if (error instanceof APIError) {
      return handleAPIError(error);
    }
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message) as {
          error?: string;
          message?: string;
          status?: number;
          details?: string;
        };
        if (parsed.error === "timeout") {
          return handleAPIError(
            CommonErrors.REQUEST_TIMEOUT("Backend request timed out")
          );
        }
        if (
          parsed.error === "result_not_found" ||
          parsed.error === "resource_not_found"
        ) {
          return handleAPIError(CommonErrors.RESULT_NOT_FOUND(id));
        }
      } catch {
        // fall through
      }
    }
    return handleAPIError(
      CommonErrors.INTERNAL_ERROR("Failed to retrieve results")
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(resultsHandler, {
    endpoint: "results",
    cors: true,
    methods: ["GET", "OPTIONS"],
  });
  return wrapped(request, context);
}

export const OPTIONS = createOptionsHandler(["GET", "OPTIONS"]);
