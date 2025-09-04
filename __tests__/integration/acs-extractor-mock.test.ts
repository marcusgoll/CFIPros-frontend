/**
 * ACS Extractor Integration Tests with Mock Backend
 * Tests the complete workflow without requiring live backend
 */

// Mock dependencies before ANY imports
const mockCheckRateLimit = jest.fn();
const mockFileUpload = jest.fn();
const mockProxyFileUploadWithFormData = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: mockCheckRateLimit,
  },
}));

jest.mock("@/lib/api/validation", () => ({
  validateRequest: {
    fileUpload: mockFileUpload,
  },
}));

jest.mock("@/lib/api/proxy", () => ({
  proxyFileUploadWithFormData: mockProxyFileUploadWithFormData,
  proxyRequest: jest.fn(),
  getClientIP: jest.fn(() => "192.168.1.1"),
  addCorrelationId: jest.fn(() => "test-correlation-id"),
}));

jest.mock("@/lib/analytics/telemetry", () => ({
  trackEvent: mockTrackEvent,
}));

jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ 
      success: true, 
      limit: 60, 
      reset: Date.now() + 3600000 
    }),
  },
}));

// Now import after all mocks are set up
import { POST as extractHandler } from "@/app/api/extractor/extract/route";
import { GET as resultsHandler } from "@/app/api/extractor/results/[id]/route";
import { NextRequest } from "next/server";

describe("ACS Extractor Integration Tests (Mock Backend)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    mockCheckRateLimit.mockReturnValue({
      allowed: true,
      remainingUploads: 15,
      resetTime: Date.now() + 3600000,
    });

    mockFileUpload.mockResolvedValue({
      isValid: true,
      files: [
        new File(["PDF content"], "test.pdf", { type: "application/pdf" }),
      ],
      data: createMockFormData(),
    });

    mockProxyFileUploadWithFormData.mockResolvedValue(
      new Response(
        JSON.stringify({
          batch_id: "btch_test123",
          status: "processing",
          files_received: 1,
        }),
        {
          status: 202,
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }
      )
    );
  });

  describe("Upload Workflow", () => {
    it("should successfully upload files and return batch ID", async () => {
      const formData = createMockFormData();
      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data).toHaveProperty("batch_id");
      expect(data.batch_id).toBe("btch_test123");
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "batch_upload_accepted",
        expect.objectContaining({
          file_count: 1,
          correlation_id: "test-correlation-id",
        })
      );
    });

    it("should handle validation errors properly", async () => {
      mockFileUpload.mockResolvedValueOnce({
        isValid: false,
        error: "File exceeds maximum size of 15MB",
      });

      const formData = createMockFormData();
      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "extractor_validation_error",
        expect.objectContaining({
          error: "File exceeds maximum size of 15MB",
        })
      );
    });

    it("should enforce rate limiting", async () => {
      mockCheckRateLimit.mockReturnValueOnce({
        allowed: false,
        remainingUploads: 0,
        resetTime: Date.now() + 3600000,
      });

      const formData = createMockFormData();
      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty("type");
      expect(data.type).toContain("rate_limit_exceeded");
    });
  });

  describe("Processing Workflow", () => {
    it("should handle batch processing status updates", async () => {
      // First upload
      const formData = createMockFormData();
      const uploadRequest = new NextRequest(
        "http://localhost/api/extractor/extract",
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResponse = await extractHandler(uploadRequest);
      const uploadData = await uploadResponse.json();
      
      expect(uploadData.batch_id).toBe("btch_test123");
      expect(uploadData.status).toBe("processing");

      // Simulate backend processing completion
      mockProxyFileUploadWithFormData.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            batch_id: "btch_test123",
            status: "completed",
            results: [
              {
                file_name: "test.pdf",
                acs_codes: ["091", "092", "093"],
                confidence: 0.95,
              },
            ],
          }),
          {
            status: 200,
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          }
        )
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle backend service errors gracefully", async () => {
      mockProxyFileUploadWithFormData.mockRejectedValueOnce(
        new Error("Backend service unavailable")
      );

      const formData = createMockFormData();
      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "batch_upload_failed",
        expect.objectContaining({
          error: "Backend service unavailable",
        })
      );
    });

    it("should handle multiple file validation", async () => {
      const files = [
        new File(["PDF 1"], "test1.pdf", { type: "application/pdf" }),
        new File(["PDF 2"], "test2.pdf", { type: "application/pdf" }),
        new File(["PDF 3"], "test3.pdf", { type: "application/pdf" }),
        new File(["PDF 4"], "test4.pdf", { type: "application/pdf" }),
        new File(["PDF 5"], "test5.pdf", { type: "application/pdf" }),
      ];

      mockFileUpload.mockResolvedValueOnce({
        isValid: true,
        files: files,
        data: createMockFormDataWithFiles(files),
      });

      mockProxyFileUploadWithFormData.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            batch_id: "btch_multi123",
            status: "processing",
            files_received: 5,
          }),
          {
            status: 202,
            headers: new Headers({
              "Content-Type": "application/json",
            }),
          }
        )
      );

      const formData = createMockFormDataWithFiles(files);
      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: formData,
      });

      const response = await extractHandler(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.files_received).toBe(5);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        "batch_upload_accepted",
        expect.objectContaining({
          file_count: 5,
        })
      );
    });
  });
});

// Helper functions
function createMockFormData(): FormData {
  const formData = new FormData();
  formData.append("files", new File(["test"], "test.pdf"));
  return formData;
}

function createMockFormDataWithFiles(files: File[]): FormData {
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));
  return formData;
}