/**
 * Upload Status API Route
 * Check processing status of uploaded files
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { validateRequest } from "@/lib/api/validation";
import { proxyRequest, getClientIP } from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";

async function statusHandler(
  request: NextRequest,
  ctx:
    | { params: { id: string } }
    | { params: Promise<{ id: string | string[] | undefined }> }
) {
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
  const clientIP = getClientIP(request);

  // Validate upload ID format
  const idValidation = validateRequest.resultId(id);
  if (!idValidation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(idValidation.error!);
    return handleAPIError(error);
  }

  // Proxy request to backend
  const response = await proxyRequest(request, `/upload/${id}/status`, {
    headers: {
      "X-Client-IP": clientIP,
    },
  });

  // Simple caching based on backend response headers
  const cacheControl = response.headers.get("cache-control");
  if (!cacheControl) {
    // Default caching strategy - don't cache status checks
    response.headers.set("Cache-Control", "no-cache, must-revalidate");
  }

  return response;
}

// Apply middleware wrapper with Next.js RouteContext typing
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string | string[] | undefined }> }
) {
  const wrapped = withAPIMiddleware(statusHandler, {
    endpoint: "results",
    cors: true,
    methods: ["GET", "OPTIONS"],
  });
  return wrapped(request, context);
}

export const OPTIONS = createOptionsHandler(["GET", "OPTIONS"]);
