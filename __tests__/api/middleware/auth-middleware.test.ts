/**
 * Comprehensive Authentication Middleware Testing
 * Tests authentication, rate limiting, CORS, and security headers
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIMiddleware } from "@/lib/api/middleware";

// Mock Clerk authentication
jest.mock("@clerk/nextjs/server", () => ({
  auth: jest.fn(),
}));

// Mock rate limiter
jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: {
    check: jest.fn(),
  },
}));

// Mock proxy utilities
jest.mock("@/lib/api/proxy", () => ({
  getClientIP: jest.fn().mockReturnValue("127.0.0.1"),
}));

// Mock configuration
jest.mock("@/lib/config", () => ({
  config: {
    rateLimiting: {
      upload: { requests: 10, window: "1m" },
      auth: { requests: 5, window: "1m" },
      default: { requests: 100, window: "1m" },
    },
  },
}));

describe("Authentication Middleware", () => {
  let mockAuth: jest.MockedFunction<any>;
  let mockRateLimiter: jest.MockedFunction<any>;

  beforeEach(() => {
    const { auth } = require("@clerk/nextjs/server");
    const { rateLimiter } = require("@/lib/api/rateLimiter");
    
    mockAuth = auth;
    mockRateLimiter = rateLimiter.check;

    // Default mocks - authenticated user with rate limiting allowed
    mockAuth.mockResolvedValue({ userId: "test_user_123" });
    mockRateLimiter.mockResolvedValue({ success: true });

    jest.clearAllMocks();
  });

  describe("Authentication Required", () => {
    it("should allow authenticated requests", async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: true,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalledWith(request, undefined);
      expect(mockAuth).toHaveBeenCalled();
    });

    it("should reject unauthenticated requests", async () => {
      // Arrange
      mockAuth.mockResolvedValue({ userId: null }); // Unauthenticated
      
      const mockHandler = jest.fn();
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: true,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.type).toBe("about:blank#unauthorized");
      expect(data.title).toBe("unauthorized");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should handle authentication errors gracefully", async () => {
      // Arrange
      mockAuth.mockRejectedValue(new Error("Clerk service unavailable"));
      
      const mockHandler = jest.fn();
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: true,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.type).toBe("about:blank#unauthorized");
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limits", async () => {
      // Arrange
      mockRateLimiter.mockResolvedValue({ success: true });
      
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "upload",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(response.status).toBe(200);
      expect(mockHandler).toHaveBeenCalled();
      expect(mockRateLimiter).toHaveBeenCalledWith(
        "127.0.0.1",
        "upload"
      );
    });

    it("should reject requests that exceed rate limits", async () => {
      // Arrange
      mockRateLimiter.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: new Date(Date.now() + 60000),
      });
      
      const mockHandler = jest.fn();
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "upload",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/upload", {
        method: "POST",
      });

      // Act
      const response = await wrappedHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.type).toBe("about:blank#rate_limit_exceeded");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it("should use correct rate limits for different endpoints", async () => {
      // Test upload endpoint
      const uploadHandler = withAPIMiddleware(jest.fn(), {
        endpoint: "upload",
        auth: false,
      });

      await uploadHandler(
        new NextRequest("http://localhost:3000/api/upload", {
          method: "POST",
        })
      );

      expect(mockRateLimiter).toHaveBeenCalledWith(
        "127.0.0.1",
        "upload"
      );

      // Test auth endpoint
      const authHandler = withAPIMiddleware(jest.fn(), {
        endpoint: "auth",
        auth: false,
      });

      await authHandler(
        new NextRequest("http://localhost:3000/api/auth", {
          method: "POST",
        })
      );

      expect(mockRateLimiter).toHaveBeenCalledWith(
        "127.0.0.1",
        "auth"
      );
    });
  });

  describe("CORS Headers", () => {
    it("should add CORS headers when enabled", async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
        cors: true,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000"
      );
      expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
      expect(response.headers.get("Access-Control-Allow-Headers")).toContain(
        "Content-Type"
      );
    });

    it("should not add CORS headers when disabled", async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
        cors: false,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Security Headers", () => {
    it("should always add security headers", async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert - Check for security headers
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(response.headers.get("Strict-Transport-Security")).toContain("max-age");
    });

    it("should add Content Security Policy headers", async () => {
      // Arrange
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert
      const csp = response.headers.get("Content-Security-Policy");
      expect(csp).toContain("default-src");
      expect(csp).toContain("script-src");
      expect(csp).toContain("object-src 'none'");
    });
  });

  describe("Error Handling", () => {
    it("should handle handler errors gracefully", async () => {
      // Arrange
      const mockHandler = jest.fn().mockRejectedValue(
        new Error("Internal server error")
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe("about:blank#internal_error");
      expect(data.title).toBe("internal_error");
    });

    it("should handle rate limiter errors gracefully", async () => {
      // Arrange
      mockRateLimiter.mockRejectedValue(new Error("Redis connection failed"));
      
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: "success" })
      );
      
      const wrappedHandler = withAPIMiddleware(mockHandler, {
        endpoint: "default",
        auth: false,
      });

      const request = new NextRequest("http://localhost:3000/api/test", {
        method: "GET",
      });

      // Act
      const response = await wrappedHandler(request);

      // Assert - Should fail with 500 if rate limiter throws error (fail-closed)
      expect(response.status).toBe(500);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

});