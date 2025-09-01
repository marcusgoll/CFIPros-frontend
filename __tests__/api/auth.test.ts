/**
 * Tests for /api/auth route handlers
 * Testing authentication and authorization endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import {
  GET as profileGET,
  PUT as profilePUT,
} from "@/app/api/auth/profile/route";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { APIError } from "@/lib/api/errors";
import type { MockAPIClient } from "@/lib/types";

// Mock the API client
jest.mock("@/lib/api/client", () => ({
  APIClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  })),
}));

// Mock proxy layer used by route handlers
jest.mock("@/lib/api/proxy", () => ({
  proxyRequest: jest.fn(),
  authenticatedProxyRequest: jest.fn(),
  getClientIP: jest.fn(() => "127.0.0.1"),
}));

// Mock NextAuth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// Mock rate limiter
jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe("/api/auth", () => {
  let mockApiClient: MockAPIClient;
  let mockGetServerSession: jest.Mock;

  beforeEach(() => {
    const { APIClient } = require("@/lib/api/client");
    const { getServerSession } = require("next-auth/next");
    mockApiClient = new APIClient();
    mockGetServerSession = getServerSession;
    jest.clearAllMocks();
  });

  describe("POST /api/auth/login", () => {
    it("should successfully authenticate with valid credentials", async () => {
      // Arrange
      const loginData = {
        email: "test@example.com",
        password: "validpassword123",
      };

      const mockAuthResponse = {
        access_token: "jwt-access-token",
        refresh_token: "jwt-refresh-token",
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          subscription_tier: "free",
        },
      };

      const { proxyRequest } = require("@/lib/api/proxy");
      proxyRequest.mockResolvedValue(
        NextResponse.json(mockAuthResponse, { status: 200 })
      );

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      // Provide request.json so validation sees the payload
      (request as any).json = jest.fn().mockResolvedValue(loginData);
      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockAuthResponse);
    });

    it("should reject invalid credentials", async () => {
      // Arrange
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      };
      const authError = new APIError(
        "invalid_credentials",
        401,
        "Invalid email or password"
      );
      const { proxyRequest } = require("@/lib/api/proxy");
      proxyRequest.mockResolvedValue(
        NextResponse.json(
          {
            type: "about:blank#invalid_credentials",
            title: "invalid_credentials",
            status: 401,
            detail: "Invalid email or password",
          },
          { status: 401 }
        )
      );

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      (request as any).json = jest.fn().mockResolvedValue(loginData);
      // Act
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.type).toBe("about:blank#invalid_credentials");
      expect(data.title).toBe("invalid_credentials");
      expect(data.detail).toBe("Invalid email or password");
    });

    it("should validate email format", async () => {
      // Arrange
      const loginData = { email: "invalid-email", password: "password123" };

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      (request as any).json = jest.fn().mockResolvedValue(loginData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.title).toBe("validation_error");
      expect(data.detail).toContain("Invalid email format");
    });

    it("should enforce password requirements", async () => {
      // Arrange
      const loginData = { email: "test@example.com", password: "123" }; // Too short

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData),
        headers: { "Content-Type": "application/json" },
      });

      // Act
      (request as any).json = jest.fn().mockResolvedValue(loginData);
      const response = await loginPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.detail).toContain("Password must be at least");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should successfully register new user", async () => {
      // Arrange
      const registrationData = {
        name: "New User",
        email: "newuser@example.com",
        password: "Securepassword123",
        terms_accepted: true,
      };

      const mockRegistrationResponse = {
        user: {
          id: "user-456",
          name: "New User",
          email: "newuser@example.com",
          subscription_tier: "free",
          created_at: "2024-01-01T00:00:00Z",
        },
        access_token: "jwt-access-token",
      };

      const { proxyRequest } = require("@/lib/api/proxy");
      proxyRequest.mockResolvedValue(
        NextResponse.json(mockRegistrationResponse, { status: 201 })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(registrationData),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Act
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      const response = await registerPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockRegistrationResponse);
    });

    it("should reject duplicate email registration", async () => {
      // Arrange
      const registrationData = {
        name: "Test User",
        email: "existing@example.com",
        password: "Password123",
        terms_accepted: true,
      };

      const duplicateError = new APIError(
        "email_already_exists",
        409,
        "Email already registered"
      );
      const { proxyRequest } = require("@/lib/api/proxy");
      proxyRequest.mockResolvedValue(
        NextResponse.json(
          {
            type: "about:blank#email_already_exists",
            title: "email_already_exists",
            status: 409,
            detail: "Email already registered",
          },
          { status: 409 }
        )
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(registrationData),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Act
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      const response = await registerPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.type).toBe("about:blank#email_already_exists");
      expect(data.title).toBe("email_already_exists");
      expect(data.detail).toBe("Email already registered");
    });

    it("should require terms acceptance", async () => {
      // Arrange
      const registrationData = {
        name: "Test User",
        email: "test@example.com",
        password: "Password123",
        terms_accepted: false,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(registrationData),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Act
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      (request as any).json = jest.fn().mockResolvedValue(registrationData);
      const response = await registerPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.detail).toContain("Terms and conditions must be accepted");
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should return profile for authenticated user", async () => {
      // Arrange
      const mockSession = {
        user: { id: "user-123", email: "test@example.com" },
        accessToken: "valid-jwt-token",
      };

      const mockProfile = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        subscription_tier: "premium",
        usage: {
          uploads_this_month: 25,
          uploads_limit: 100,
        },
        preferences: {
          theme: "dark",
          notifications: true,
        },
      };

      const { authenticatedProxyRequest } = require("@/lib/api/proxy");
      authenticatedProxyRequest.mockResolvedValue(
        NextResponse.json(mockProfile, { status: 200 })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
          headers: { Authorization: "Bearer valid-jwt-token" },
        }
      );

      // Act
      const response = await profileGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockProfile);
    });

    it("should return 401 for unauthenticated requests", async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "GET",
        }
      );

      // Act
      const response = await profileGET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.type).toBe("about:blank#unauthorized");
      expect(data.title).toBe("unauthorized");
      expect(data.detail).toBe("Authentication token required");
    });
  });

  describe("PUT /api/auth/profile", () => {
    it("should update profile for authenticated user", async () => {
      // Arrange
      const mockSession = {
        user: { id: "user-123" },
        accessToken: "valid-jwt-token",
      };

      const updateData = {
        name: "Updated Name",
        preferences: {
          theme: "light",
          notifications: false,
        },
      };

      const updatedProfile = {
        id: "user-123",
        name: "Updated Name",
        email: "test@example.com",
        preferences: updateData.preferences,
      };

      const { authenticatedProxyRequest } = require("@/lib/api/proxy");
      authenticatedProxyRequest.mockResolvedValue(
        NextResponse.json(updatedProfile, { status: 200 })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
        }
      );

      // Act
      (request as any).json = jest.fn().mockResolvedValue(updateData);
      const response = await profilePUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(updatedProfile);
      // Route proxies to backend; request body already validated and forwarded
    });

    it("should validate profile update data", async () => {
      // Arrange
      const mockSession = { user: { id: "user-123" } };

      const invalidUpdateData = {
        name: "", // Empty name should be invalid
        preferences: {
          theme: "invalid-theme", // Invalid theme value
        },
      };

      const request = new NextRequest(
        "http://localhost:3000/api/auth/profile",
        {
          method: "PUT",
          body: JSON.stringify(invalidUpdateData),
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
        }
      );

      // Act
      (request as any).json = jest.fn().mockResolvedValue(invalidUpdateData);
      const response = await profilePUT(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.title).toBe("validation_error");
    });
  });
});
