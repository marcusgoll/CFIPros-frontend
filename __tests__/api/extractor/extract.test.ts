/**
 * Tests for ACS Extractor API Route - File Processing
 */

import { POST } from "@/app/api/extractor/extract/route";
import { NextRequest } from "next/server";
import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

// Mock dependencies
const mockRateLimiter = {
  check: jest.fn().mockResolvedValue({ success: true, limit: 60, reset: Date.now() + 3600000 }),
};
jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: mockRateLimiter,
}));

jest.mock("@/lib/api/middleware", () => ({
  withAPIMiddleware: jest.fn((handler) => handler),
  createOptionsHandler: jest.fn(() => () => new Response("OK")),
}));

const mockFileUpload = jest.fn();
jest.mock("@/lib/api/validation", () => ({
  validateRequest: {
    fileUpload: mockFileUpload,
  },
}));

const mockProxyFileUploadWithFormDataWithFormData = jest.fn();
jest.mock("@/lib/api/proxy", () => ({
  proxyFileUploadWithFormData: mockProxyFileUploadWithFormDataWithFormData,
  getClientIP: jest.fn(() => "192.168.1.1"),
  addCorrelationId: jest.fn(() => "test-correlation-id"),
}));

const mockCheckRateLimit = jest.fn();
jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: mockCheckRateLimit,
  },
}));

const mockTrackEvent = jest.fn();
jest.mock("@/lib/analytics/telemetry", () => ({
  trackEvent: mockTrackEvent,
}));

const mockHandleAPIError = jest.fn((error) =>
  Response.json(
    { error: error.type, message: error.message },
    { status: 400 }
  )
);
jest.mock("@/lib/api/errors", () => ({
  CommonErrors: {
    RATE_LIMIT_EXCEEDED: jest.fn((msg) => ({
      type: "RATE_LIMIT_EXCEEDED",
      message: msg,
    })),
    NO_FILE_PROVIDED: jest.fn((msg) => ({
      type: "NO_FILE_PROVIDED",
      message: msg,
    })),
    FILE_TOO_LARGE: jest.fn((msg) => ({ type: "FILE_TOO_LARGE", message: msg })),
    UNSUPPORTED_FILE_TYPE: jest.fn((msg) => ({
      type: "UNSUPPORTED_FILE_TYPE",
      message: msg,
    })),
    VALIDATION_ERROR: jest.fn((msg) => ({
      type: "VALIDATION_ERROR",
      message: msg,
    })),
    INTERNAL_SERVER_ERROR: jest.fn((msg, id) => ({
      type: "INTERNAL_SERVER_ERROR",
      message: msg,
      correlationId: id,
    })),
  },
  handleAPIError: mockHandleAPIError,
}));

import { validateRequest } from "@/lib/api/validation";
import { proxyFileUpload } from "@/lib/api/proxy";
import { FileUploadRateLimiter } from "@/lib/security/fileUpload";
import { trackEvent } from "@/lib/analytics/telemetry";
import { handleAPIError } from "@/lib/api/errors";

describe("/api/extractor/extract", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rate Limiting", () => {
    it("blocks requests when rate limit exceeded", async () => {
      mockCheckRateLimit.mockReturnValue({
        allowed: false,
        remainingUploads: 0,
        resetTime: Date.now() + 3600000,
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      const response = await POST(request);

      expect(mockCheckRateLimit).toHaveBeenCalledWith("192.168.1.1", 20, 3600000);
      expect(mockHandleAPIError).toHaveBeenCalled();
    });

    it("allows requests within rate limit", async () => {
      mockCheckRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });

      mockFileUpload.mockResolvedValue({
        isValid: true,
        files: [new File(["test"], "test.pdf", { type: "application/pdf" })],
      });

      mockProxyFileUploadWithFormData.mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: new Headers(),
        })
      );

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockCheckRateLimit).toHaveBeenCalledWith("192.168.1.1", 20, 3600000);
      expect(mockFileUpload).toHaveBeenCalled();
    });
  });

  describe("File Validation", () => {
    beforeEach(() => {
            mockCheckRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });
    });

    it("rejects requests with no files", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: false,
        error: "No files provided",
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockHandleAPIError).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_validation_error",
        expect.any(Object)
      );
    });

    it("rejects files that exceed size limit", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: false,
        error: "File exceeds maximum size of 10MB",
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockHandleAPIError).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_validation_error",
        expect.any(Object)
      );
    });

    it("rejects unsupported file types", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: false,
        error: "Unsupported file type: text/plain",
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockHandleAPIError).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_validation_error",
        expect.any(Object)
      );
    });

    it("rejects more than 5 files", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: false,
        error: "Maximum 6 files provided, but only 5 allowed",
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockHandleAPIError).toHaveBeenCalled();
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_validation_error",
        expect.any(Object)
      );
    });

    it("accepts valid files", async () => {
            const testFiles = [
        new File(["test1"], "test1.pdf", { type: "application/pdf" }),
        new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
      ];

      mockFileUpload.mockResolvedValue({
        isValid: true,
        files: testFiles,
      });

            mockProxyFileUploadWithFormData.mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            report_id: "rpt_123",
          }),
          {
            status: 200,
            headers: new Headers(),
          }
        )
      );

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockFileUpload).toHaveBeenCalledWith(
        request,
        expect.objectContaining({
          maxFiles: 5,
          maxSize: 10 * 1024 * 1024,
          acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
          requiredField: "files",
        })
      );
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_upload_started",
        expect.any(Object)
      );
    });
  });

  describe("Proxy Integration", () => {
    beforeEach(() => {
            mockCheckRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });

            mockFileUpload.mockResolvedValue({
        isValid: true,
        files: [new File(["test"], "test.pdf", { type: "application/pdf" })],
      });
    });

    it("successfully proxies valid requests to backend", async () => {
            const mockResponse = new Response(
        JSON.stringify({
          success: true,
          report_id: "rpt_123456",
          processing_time_ms: 2500,
        }),
        {
          status: 200,
          headers: new Headers(),
        }
      );

      mockProxyFileUploadWithFormData.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      const response = await POST(request);

      expect(mockProxyFileUploadWithFormData).toHaveBeenCalledWith(request, "/v1/extract", {
        headers: expect.objectContaining({
          "X-Correlation-ID": "test-correlation-id",
          "X-Client-IP": "192.168.1.1",
          "X-Service": "acs-extractor",
        }),
      });

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_upload_success",
        expect.any(Object)
      );
    });

    it("handles backend service errors gracefully", async () => {
            mockProxyFileUploadWithFormData.mockRejectedValue(new Error("Backend service unavailable"));

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_upload_failed",
        expect.any(Object)
      );
      expect(mockHandleAPIError).toHaveBeenCalled();
    });

    it("includes proper headers in successful responses", async () => {
            const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers(),
      });

      mockProxyFileUploadWithFormData.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      const response = await POST(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("10");
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
        "POST, OPTIONS"
      );
    });
  });

  describe("Analytics Tracking", () => {
    beforeEach(() => {
            mockCheckRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });
    });

    it("tracks upload start events", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: true,
        files: [
          new File(["test1"], "test1.pdf", { type: "application/pdf" }),
          new File(["test2"], "test2.jpg", { type: "image/jpeg" }),
        ],
      });

            mockProxyFileUploadWithFormData.mockResolvedValue(
        new Response("{}", { status: 200, headers: new Headers() })
      );

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockTrackEvent).toHaveBeenCalledWith("extractor_upload_started", {
        file_count: 2,
        correlation_id: "test-correlation-id",
        client_ip: "192.168.1...",
      });
    });

    it("tracks validation errors", async () => {
            mockFileUpload.mockResolvedValue({
        isValid: false,
        error: "File too large",
      });

      const request = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: new FormData(),
        }
      );

      await POST(request);

      expect(mockTrackEvent).toHaveBeenCalledWith("extractor_validation_error", {
        error: "File too large",
        correlation_id: "test-correlation-id",
        client_ip: "192.168.1.1",
      });
    });
  });
});
