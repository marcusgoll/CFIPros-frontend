/**
 * Extractor API Routes Testing
 * Tests document extraction and results endpoints
 */

import { NextRequest } from "next/server";
import { POST as extractPOST } from "@/app/api/extractor/extract/route";
import { GET as resultsGET } from "@/app/api/extractor/results/[id]/route";

// Mock dependencies
jest.mock("@/lib/api/proxy", () => ({
  proxyFileUploadWithFormData: jest.fn(),
  proxyRequest: jest.fn(),
  getClientIP: jest.fn().mockReturnValue("127.0.0.1"),
  addCorrelationId: jest.fn().mockReturnValue("test-correlation-id"),
}));

jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: jest.fn().mockReturnValue({
      allowed: true,
      remainingUploads: 15,
      resetTime: Date.now() + 60000,
    }),
  },
  FileUploadSecurity: {
    validateFile: jest.fn().mockResolvedValue({
      isSecure: true,
      warnings: [],
    }),
    getUserUploadLimits: jest.fn().mockReturnValue({
      maxFileSize: 10 * 1024 * 1024,
      maxFilesPerHour: 20,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    }),
  },
}));

jest.mock("@clerk/nextjs/server", () => ({
  currentUser: jest.fn().mockResolvedValue({
    id: "test_user_123",
    privateMetadata: { role: "student" },
  }),
}));

describe("Extractor API Routes", () => {
  let mockProxyFileUpload: jest.MockedFunction<any>;
  let mockProxyRequest: jest.MockedFunction<any>;
  let mockFileUploadSecurity: any;
  let mockRateLimiter: any;

  beforeEach(() => {
    const { proxyFileUploadWithFormData, proxyRequest } = require("@/lib/api/proxy");
    const { FileUploadSecurity, FileUploadRateLimiter } = require("@/lib/security/fileUpload");
    
    mockProxyFileUpload = proxyFileUploadWithFormData;
    mockProxyRequest = proxyRequest;
    mockFileUploadSecurity = FileUploadSecurity;
    mockRateLimiter = FileUploadRateLimiter;

    // Default successful responses
    mockProxyFileUpload.mockResolvedValue(
      new Response(JSON.stringify({
        extractionId: "extraction-123",
        status: "processing",
        message: "File uploaded and extraction started",
      }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      })
    );

    mockProxyRequest.mockResolvedValue(
      new Response(JSON.stringify({
        id: "extraction-123",
        status: "completed",
        results: {
          extractedCodes: ["PA.I.A.K1", "PA.I.B.S1"],
          confidence: 0.95,
          totalCodes: 2,
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    jest.clearAllMocks();
  });

  describe("POST /api/extractor/extract", () => {
    it("should successfully extract ACS codes from PDF", async () => {
      // Arrange
      const pdfFile = new File(
        ["PDF content"], 
        "knowledge-test-report.pdf", 
        { type: "application/pdf" }
      );
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("options", JSON.stringify({
        extractionType: "acs_codes",
        confidence: 0.8,
      }));

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(202);
      expect(data.extractionId).toBe("extraction-123");
      expect(data.status).toBe("processing");
      expect(mockFileUploadSecurity.validateFile).toHaveBeenCalledWith(pdfFile);
      expect(mockProxyFileUpload).toHaveBeenCalledWith(
        request,
        "/extractor/extract",
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Correlation-ID": "test-correlation-id",
            "X-Client-IP": "127.0.0.1",
            "X-User-ID": "test_user_123",
          }),
        })
      );
    });

    it("should handle image file extraction", async () => {
      // Arrange
      const imageFile = new File(
        ["JPEG content"], 
        "test-report-photo.jpg", 
        { type: "image/jpeg" }
      );
      const formData = new FormData();
      formData.append("file", imageFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(202);
      expect(data.extractionId).toBe("extraction-123");
      expect(mockFileUploadSecurity.validateFile).toHaveBeenCalledWith(imageFile);
    });

    it("should reject unauthorized users", async () => {
      // Arrange - Mock unauthorized user
      const { currentUser } = require("@clerk/nextjs/server");
      currentUser.mockResolvedValue(null);

      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.type).toBe("about:blank#unauthorized");
      expect(mockProxyFileUpload).not.toHaveBeenCalled();
    });

    it("should enforce rate limiting", async () => {
      // Arrange - Mock rate limit exceeded
      mockRateLimiter.checkRateLimit.mockReturnValue({
        allowed: false,
        remainingUploads: 0,
        resetTime: Date.now() + 3600000,
      });

      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.type).toBe("about:blank#rate_limit_exceeded");
      expect(response.headers.get("X-RateLimit-Limit")).toBeDefined();
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(mockProxyFileUpload).not.toHaveBeenCalled();
    });

    it("should reject insecure files", async () => {
      // Arrange - Mock insecure file
      mockFileUploadSecurity.validateFile.mockResolvedValue({
        isSecure: false,
        error: "File contains potentially malicious content",
        warnings: ["Embedded JavaScript detected"],
      });

      const maliciousFile = new File(["malicious content"], "malware.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", maliciousFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.detail).toContain("potentially malicious content");
      expect(mockProxyFileUpload).not.toHaveBeenCalled();
    });

    it("should handle backend processing errors", async () => {
      // Arrange - Mock backend error
      mockProxyFileUpload.mockResolvedValue(
        new Response(JSON.stringify({
          error: "Document format not supported",
          code: "UNSUPPORTED_FORMAT",
        }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        })
      );

      const unsupportedFile = new File(["content"], "document.txt", {
        type: "text/plain",
      });
      const formData = new FormData();
      formData.append("file", unsupportedFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(422);
      expect(data.error).toBe("Document format not supported");
      expect(data.code).toBe("UNSUPPORTED_FORMAT");
    });

    it("should include proper security headers", async () => {
      // Arrange
      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);

      // Assert
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("Content-Security-Policy")).toContain("default-src");
    });
  });

  describe("GET /api/extractor/results/[id]", () => {
    it("should retrieve extraction results for completed processing", async () => {
      // Arrange
      const request = new NextRequest(
        "http://localhost:3000/api/extractor/results/extraction-123",
        {
          method: "GET",
          headers: {
            "X-User-ID": "test_user_123",
          },
        }
      );

      // Mock context parameter for dynamic route
      const context = { params: { id: "extraction-123" } };

      // Act
      const response = await resultsGET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.id).toBe("extraction-123");
      expect(data.status).toBe("completed");
      expect(data.results.extractedCodes).toContain("PA.I.A.K1");
      expect(data.results.confidence).toBe(0.95);
      expect(mockProxyRequest).toHaveBeenCalledWith(
        request,
        "/extractor/results/extraction-123",
        expect.any(Object)
      );
    });

    it("should return processing status for ongoing extraction", async () => {
      // Arrange - Mock processing response
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          id: "extraction-456",
          status: "processing",
          progress: 0.65,
          estimatedTimeRemaining: 30,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/extractor/results/extraction-456",
        {
          method: "GET",
          headers: {
            "X-User-ID": "test_user_123",
          },
        }
      );

      const context = { params: { id: "extraction-456" } };

      // Act
      const response = await resultsGET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.status).toBe("processing");
      expect(data.progress).toBe(0.65);
      expect(data.estimatedTimeRemaining).toBe(30);
    });

    it("should return 404 for non-existent extraction", async () => {
      // Arrange
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          error: "Extraction not found",
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/extractor/results/non-existent",
        {
          method: "GET",
          headers: {
            "X-User-ID": "test_user_123",
          },
        }
      );

      const context = { params: { id: "non-existent" } };

      // Act
      const response = await resultsGET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe("Extraction not found");
    });

    it("should enforce user ownership of extraction results", async () => {
      // Arrange - Mock unauthorized access
      mockProxyRequest.mockResolvedValue(
        new Response(JSON.stringify({
          error: "Access denied - not your extraction",
        }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        })
      );

      const request = new NextRequest(
        "http://localhost:3000/api/extractor/results/other-user-extraction",
        {
          method: "GET",
          headers: {
            "X-User-ID": "test_user_123",
          },
        }
      );

      const context = { params: { id: "other-user-extraction" } };

      // Act
      const response = await resultsGET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error).toContain("Access denied");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle network timeouts gracefully", async () => {
      // Arrange - Mock network timeout
      mockProxyFileUpload.mockRejectedValue(
        new Error("Network timeout after 30 seconds")
      );

      const pdfFile = new File(["content"], "large-file.pdf", {
        type: "application/pdf",
      });
      const formData = new FormData();
      formData.append("file", pdfFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe("about:blank#internal_error");
      expect(data.detail).toContain("Network timeout");
    });

    it("should validate extraction ID format", async () => {
      // Arrange - Invalid ID format
      const request = new NextRequest(
        "http://localhost:3000/api/extractor/results/invalid-id-format!",
        {
          method: "GET",
          headers: {
            "X-User-ID": "test_user_123",
          },
        }
      );

      const context = { params: { id: "invalid-id-format!" } };

      // Act
      const response = await resultsGET(request, context);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#validation_error");
      expect(data.detail).toContain("Invalid extraction ID format");
    });

    it("should handle concurrent extraction limits", async () => {
      // Arrange - Mock concurrent limit exceeded
      mockProxyFileUpload.mockResolvedValue(
        new Response(JSON.stringify({
          error: "Maximum concurrent extractions reached",
          code: "CONCURRENT_LIMIT_EXCEEDED",
          retryAfter: 120,
        }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "120",
          },
        })
      );

      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      const formData = new FormData();
      formData.append("file", pdfFile);

      const request = new NextRequest("http://localhost:3000/api/extractor/extract", {
        method: "POST",
        body: formData,
        headers: {
          "X-User-ID": "test_user_123",
        },
      });

      // Act
      const response = await extractPOST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.code).toBe("CONCURRENT_LIMIT_EXCEEDED");
      expect(response.headers.get("Retry-After")).toBe("120");
    });
  });
});