/**
 * Authentication Routes Testing
 * Tests login, register, session, and other auth endpoints
 */

import { NextRequest } from "next/server";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { GET as sessionGET, DELETE as sessionDELETE } from "@/app/api/auth/session/route";
import { GET as statusGET } from "@/app/api/auth/status/route";

// Mock proxy functions
jest.mock("@/lib/api/proxy", () => ({
  proxyRequest: jest.fn(),
  getClientIP: jest.fn().mockReturnValue("127.0.0.1"),
}));

// Mock validation
jest.mock("@/lib/api/validation", () => ({
  validateRequest: {
    auth: jest.fn(),
  },
}));

// Mock rate limiter
jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe("Authentication Routes", () => {
  let mockProxyRequest: jest.MockedFunction<any>;
  let mockValidateAuth: jest.MockedFunction<any>;

  beforeEach(() => {
    const { proxyRequest } = require("@/lib/api/proxy");
    const { validateRequest } = require("@/lib/api/validation");
    
    mockProxyRequest = proxyRequest;
    mockValidateAuth = validateRequest.auth;

    // Default mocks - valid request and successful proxy
    mockValidateAuth.mockResolvedValue({
      isValid: true,
      data: { email: "test@example.com", password: "password123" },
    });

    mockProxyRequest.mockResolvedValue(
      new Response(JSON.stringify({ token: "jwt-token", user: { id: "123" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should handle successful login", async () => {
      // Arrange
      const loginData = {
        email: "test@example.com",
        password: "password123",
      };

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        token: "jwt-token",
        user: { id: "123" },
      });
      expect(mockValidateAuth).toHaveBeenCalledWith(request);
      expect(mockProxyRequest).toHaveBeenCalledWith(
        request,
        "/auth/login",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Client-IP": "127.0.0.1",
          }),
        })
      );
    });

    it("should reject invalid login data", async () => {
      // Arrange
      mockValidateAuth.mockResolvedValue({
        isValid: false,
        error: "Email is required",
      });

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.detail).toBe("Email is required");
      expect(mockProxyRequest).not.toHaveBeenCalled();
    });

    it("should handle backend authentication failure", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Invalid credentials" });
    });

    it("should include security headers for auth responses", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);

      // Assert - Check security headers
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should handle successful registration", async () => {
      // Arrange
      const registerData = {
        email: "newuser@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      };

      mockValidateAuth.mockResolvedValue({
        isValid: true,
        data: registerData,
      });

      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({ 
          message: "User registered successfully",
          user: { id: "new-user-id", email: registerData.email },
        }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await registerPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.message).toBe("User registered successfully");
      expect(data.user.email).toBe(registerData.email);
    });

    it("should reject registration with duplicate email", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({ error: "Email already exists" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "existing@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await registerPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error).toBe("Email already exists");
    });
  });

  describe("GET /api/auth/session", () => {
    it("should return current session for authenticated user", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          user: { id: "123", email: "test@example.com" },
          session: { id: "session-123", expiresAt: "2024-12-31T23:59:59Z" },
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "GET",
        headers: {
          Authorization: "Bearer jwt-token",
        },
      });

      // Act
      const response = await sessionGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.user.id).toBe("123");
      expect(data.session.id).toBe("session-123");
    });

    it("should return 401 for unauthenticated requests", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "GET",
        // No Authorization header
      });

      // Act
      const response = await sessionGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("DELETE /api/auth/session", () => {
    it("should handle successful logout", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({ message: "Logged out successfully" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer jwt-token",
        },
      });

      // Act
      const response = await sessionDELETE(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe("Logged out successfully");
      expect(mockProxyRequest).toHaveBeenCalledWith(
        request,
        "/auth/logout",
        expect.any(Object)
      );
    });

    it("should clear authentication cookies on logout", async () => {
      // Arrange
      const logoutResponse = new Response(
        JSON.stringify({ message: "Logged out successfully" }), 
        {
          status: 200,
          headers: { 
            "Content-Type": "application/json",
            "Set-Cookie": "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure",
          },
        }
      );
      
      mockProxyRequest.mockResolvedValue(logoutResponse);

      const request = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer jwt-token",
        },
      });

      // Act
      const response = await sessionDELETE(request);

      // Assert
      expect(response.headers.get("Set-Cookie")).toContain("auth-token=;");
      expect(response.headers.get("Set-Cookie")).toContain("Expires=Thu, 01 Jan 1970");
    });
  });

  describe("GET /api/auth/status", () => {
    it("should return authentication status for valid token", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          authenticated: true,
          user: { id: "123", email: "test@example.com" },
          permissions: ["read", "write"],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/status", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-jwt-token",
        },
      });

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(true);
      expect(data.user.id).toBe("123");
      expect(data.permissions).toContain("read");
    });

    it("should return unauthenticated status for invalid token", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          authenticated: false,
          error: "Invalid or expired token",
        }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/status", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.authenticated).toBe(false);
      expect(data.error).toBe("Invalid or expired token");
    });

    it("should handle missing authorization header", async () => {
      // Arrange
      const request = new NextRequest("http://localhost:3000/api/auth/status", {
        method: "GET",
        // No Authorization header
      });

      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          authenticated: false,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      // Act
      const response = await statusGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.authenticated).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors to backend", async () => {
      // Arrange
      mockProxyRequest.mockRejectedValue(new Error("Network error"));

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe("about:blank#internal_error");
      expect(data.detail).toBe("Network error");
    });

    it("should handle validation service errors", async () => {
      // Arrange
      mockValidateAuth.mockRejectedValue(new Error("Validation service unavailable"));

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe("about:blank#internal_error");
      expect(data.detail).toBe("Validation service unavailable");
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on authentication endpoints", async () => {
      // This test would need the actual rate limiter implementation
      // For now, we verify the rate limiter is called
      const { rateLimiter } = require("@/lib/api/rateLimiter");

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Act
      await loginPOST(request);

      // Assert - Rate limiter should be checked
      expect(rateLimiter.check).toHaveBeenCalled();
    });
  });
});