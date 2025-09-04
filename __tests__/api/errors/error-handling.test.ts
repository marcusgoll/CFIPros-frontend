/**
 * API Error Handling Testing
 * Tests error responses, status codes, and error message formatting
 */

import { NextResponse } from "next/server";
import { 
  APIError, 
  CommonErrors, 
  handleAPIError, 
  addSecurityHeaders, 
  addCORSHeaders 
} from "@/lib/api/errors";

describe("API Error Handling", () => {
  describe("APIError Class", () => {
    it("should create APIError with correct properties", () => {
      // Arrange & Act
      const error = new APIError(
        "validation_failed",
        400,
        "Validation failed for field 'email'"
      );

      // Assert
      expect(error.code).toBe("validation_failed");
      expect(error.status).toBe(400);
      expect(error.message).toBe("Validation failed for field 'email'");
      expect(error.name).toBe("APIError");
    });

    it("should be instanceof Error", () => {
      // Arrange & Act
      const error = new APIError("test_error", 500, "Test error");

      // Assert
      expect(error instanceof Error).toBe(true);
      expect(error instanceof APIError).toBe(true);
    });

    it("should have stack trace", () => {
      // Arrange & Act
      const error = new APIError("test_error", 500, "Test error");

      // Assert
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
    });
  });

  describe("CommonErrors", () => {
    it("should create UNAUTHORIZED error", () => {
      // Act
      const error = CommonErrors.UNAUTHORIZED("Invalid token");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("unauthorized");
      expect(error.status).toBe(401);
      expect(error.message).toBe("Invalid token");
    });

    it("should create FORBIDDEN error", () => {
      // Act
      const error = CommonErrors.FORBIDDEN("Insufficient permissions");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("forbidden");
      expect(error.status).toBe(403);
      expect(error.message).toBe("Insufficient permissions");
    });

    it("should create NOT_FOUND error", () => {
      // Act
      const error = CommonErrors.NOT_FOUND("Resource not found");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("not_found");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Resource not found");
    });

    it("should create VALIDATION_ERROR", () => {
      // Act
      const error = CommonErrors.VALIDATION_ERROR("Email is required");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("validation_error");
      expect(error.status).toBe(400);
      expect(error.message).toBe("Email is required");
    });

    it("should create RATE_LIMIT_EXCEEDED error", () => {
      // Act
      const error = CommonErrors.RATE_LIMIT_EXCEEDED("Too many requests");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("rate_limit_exceeded");
      expect(error.status).toBe(429);
      expect(error.message).toBe("Too many requests");
    });

    it("should create FILE_TOO_LARGE error", () => {
      // Act
      const error = CommonErrors.FILE_TOO_LARGE("File exceeds 10MB limit");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("file_too_large");
      expect(error.status).toBe(413);
      expect(error.message).toBe("File exceeds 10MB limit");
    });

    it("should create UNSUPPORTED_FILE_TYPE error", () => {
      // Act
      const error = CommonErrors.UNSUPPORTED_FILE_TYPE("Only PDF files allowed");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("unsupported_file_type");
      expect(error.status).toBe(400);
      expect(error.message).toBe("Only PDF files allowed");
    });

    it("should create INTERNAL_ERROR", () => {
      // Act
      const error = CommonErrors.INTERNAL_ERROR("Database connection failed");

      // Assert
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe("internal_error");
      expect(error.status).toBe(500);
      expect(error.message).toBe("Database connection failed");
    });
  });

  describe("handleAPIError", () => {
    it("should handle APIError correctly", async () => {
      // Arrange
      const apiError = new APIError(
        "validation_failed",
        400,
        "Email field is required"
      );

      // Act
      const response = handleAPIError(apiError);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        type: "about:blank#validation_failed",
        title: "validation_failed",
        status: 400,
        detail: "Email field is required",
        instance: expect.any(String),
      });
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle generic Error as internal error", async () => {
      // Arrange
      const genericError = new Error("Something went wrong");

      // Act
      const response = handleAPIError(genericError);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        type: "about:blank#internal_error",
        title: "internal_error",
        status: 500,
        detail: "Internal server error",
        instance: expect.any(String),
      });
    });

    it("should handle string errors", async () => {
      // Act
      const response = handleAPIError("Database connection failed");
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        type: "about:blank#internal_error",
        title: "internal_error",
        status: 500,
        detail: "Database connection failed",
        instance: expect.any(String),
      });
    });

    it("should include security headers", () => {
      // Arrange
      const error = CommonErrors.UNAUTHORIZED("Invalid token");

      // Act
      const response = handleAPIError(error);

      // Assert - Check security headers are present
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });

    it("should generate unique instance IDs", async () => {
      // Arrange
      const error = CommonErrors.NOT_FOUND("Resource not found");

      // Act
      const response1 = handleAPIError(error);
      const response2 = handleAPIError(error);
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Assert
      expect(data1.instance).toBeDefined();
      expect(data2.instance).toBeDefined();
      expect(data1.instance).not.toBe(data2.instance);
    });
  });

  describe("Security Headers", () => {
    it("should add all required security headers", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });

      // Act
      const secureResponse = addSecurityHeaders(response);

      // Assert
      expect(secureResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(secureResponse.headers.get("X-Frame-Options")).toBe("DENY");
      expect(secureResponse.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(secureResponse.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000; includeSubDomains"
      );
      expect(secureResponse.headers.get("Content-Security-Policy")).toContain(
        "default-src 'self'"
      );
      expect(secureResponse.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin"
      );
    });

    it("should not override existing security headers", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });
      response.headers.set("X-Frame-Options", "SAMEORIGIN");

      // Act
      const secureResponse = addSecurityHeaders(response);

      // Assert - Should keep existing value
      expect(secureResponse.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
      // But still add other headers
      expect(secureResponse.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  });

  describe("CORS Headers", () => {
    it("should add CORS headers for allowed origins", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });
      const origin = "https://cfipros.com";

      // Act
      const corsResponse = addCORSHeaders(response, origin);

      // Assert
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe(origin);
      expect(corsResponse.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      expect(corsResponse.headers.get("Access-Control-Allow-Headers")).toContain(
        "Content-Type"
      );
      expect(corsResponse.headers.get("Access-Control-Allow-Headers")).toContain(
        "Authorization"
      );
      expect(corsResponse.headers.get("Access-Control-Max-Age")).toBe("86400");
    });

    it("should handle localhost origins in development", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });
      const origin = "http://localhost:3000";

      // Act
      const corsResponse = addCORSHeaders(response, origin);

      // Assert
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBe(origin);
    });

    it("should reject disallowed origins", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });
      const maliciousOrigin = "https://malicious-site.com";

      // Act
      const corsResponse = addCORSHeaders(response, maliciousOrigin);

      // Assert
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("should handle missing origin header", () => {
      // Arrange
      const response = NextResponse.json({ message: "test" });

      // Act
      const corsResponse = addCORSHeaders(response, null);

      // Assert - Should not add CORS headers
      expect(corsResponse.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("Error Response Format", () => {
    it("should follow RFC 7807 Problem Details format", async () => {
      // Arrange
      const error = new APIError(
        "validation_failed",
        400,
        "Email field is required"
      );

      // Act
      const response = handleAPIError(error);
      const data = await response.json();

      // Assert - Should follow RFC 7807 format
      expect(data).toHaveProperty("type");
      expect(data).toHaveProperty("title");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("detail");
      expect(data).toHaveProperty("instance");
      
      expect(data.type).toMatch(/^about:blank#/);
      expect(typeof data.title).toBe("string");
      expect(typeof data.status).toBe("number");
      expect(typeof data.detail).toBe("string");
      expect(typeof data.instance).toBe("string");
    });

    it("should have consistent error structure", async () => {
      // Test multiple error types
      const errors = [
        CommonErrors.UNAUTHORIZED("Invalid token"),
        CommonErrors.NOT_FOUND("User not found"),
        CommonErrors.VALIDATION_ERROR("Invalid email"),
        CommonErrors.RATE_LIMIT_EXCEEDED("Too many requests"),
      ];

      for (const error of errors) {
        const response = handleAPIError(error);
        const data = await response.json();

        // Assert consistent structure
        expect(data).toHaveProperty("type");
        expect(data).toHaveProperty("title");
        expect(data).toHaveProperty("status");
        expect(data).toHaveProperty("detail");
        expect(data).toHaveProperty("instance");
        
        expect(response.status).toBe(data.status);
        expect(response.headers.get("Content-Type")).toBe("application/json");
      }
    });
  });
});