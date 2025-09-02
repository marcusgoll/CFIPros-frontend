/**
 * User Profile API Route
 * Handle profile retrieval and updates
 */

import { NextRequest } from "next/server";
import { withAPIMiddleware, createOptionsHandler } from "@/lib/api/middleware";
import { validateRequest } from "@/lib/api/validation";
import { authenticatedProxyRequest, getClientIP } from "@/lib/api/proxy";
import { CommonErrors, handleAPIError } from "@/lib/api/errors";

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

async function profileGetHandler(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    const error = CommonErrors.UNAUTHORIZED("Authentication token required");
    return handleAPIError(error);
  }

  const clientIP = getClientIP(request);

  // Proxy authenticated request to backend
  const response = await authenticatedProxyRequest(
    request,
    "/auth/profile",
    token,
    {
      headers: {
        "X-Client-IP": clientIP,
      },
    }
  );

  // Add security headers
  response.headers.set("Cache-Control", "private, no-cache"); // Private data, don't cache

  return response;
}

async function profileUpdateHandler(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) {
    const error = CommonErrors.UNAUTHORIZED("Authentication token required");
    return handleAPIError(error);
  }

  // Validate profile update request
  const validation = await validateRequest.profileUpdate(request);
  if (!validation.isValid) {
    const error = CommonErrors.VALIDATION_ERROR(validation.error!);
    return handleAPIError(error);
  }

  const clientIP = getClientIP(request);

  // Proxy authenticated request to backend
  const response = await authenticatedProxyRequest(
    request,
    "/auth/profile",
    token,
    {
      headers: {
        "X-Client-IP": clientIP,
      },
    }
  );

  // Add security headers
  response.headers.set("Cache-Control", "no-store"); // Don't cache profile updates

  return response;
}

export const GET = withAPIMiddleware(profileGetHandler, {
  endpoint: "default",
  auth: true,
  cors: true,
  methods: ["GET", "PUT", "OPTIONS"],
});

export const PUT = withAPIMiddleware(profileUpdateHandler, {
  endpoint: "default",
  auth: true,
  cors: true,
  methods: ["GET", "PUT", "OPTIONS"],
});

export const OPTIONS = createOptionsHandler(["GET", "PUT", "OPTIONS"]);
