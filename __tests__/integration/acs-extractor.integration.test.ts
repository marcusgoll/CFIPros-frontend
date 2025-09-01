/**
 * Integration Tests for ACS Extractor Full Flow
 * Tests the complete end-to-end workflow from file upload to results retrieval
 */

import { POST as extractPost } from "@/app/api/extractor/extract/route";
import { GET as resultsGet } from "@/app/api/extractor/results/[id]/route";
import { NextRequest } from "next/server";
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

// Mock the actual backend API calls to simulate real API responses
const mockBackendApi = {
  extract: jest.fn(),
  getResults: jest.fn(),
};

// Mock all dependencies for integration testing
jest.mock("@/lib/api/middleware", () => ({
  withAPIMiddleware: jest.fn((handler) => handler),
  createOptionsHandler: jest.fn(() => () => new Response("OK")),
}));

jest.mock("@/lib/api/validation", () => ({
  validateRequest: {
    fileUpload: jest.fn(),
  },
}));

jest.mock("@/lib/api/proxy", () => ({
  proxyFileUploadWithFormData: jest.fn(),
  proxyApiRequest: jest.fn(),
  getClientIP: jest.fn(() => "192.168.1.100"),
  addCorrelationId: jest.fn(() => "integration_test_correlation_id"),
}));

jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: jest.fn(() => ({
      allowed: true,
      remainingUploads: 18,
      resetTime: Date.now() + 3600000,
    })),
  },
}));

jest.mock("@/lib/analytics/telemetry", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@/lib/api/errors", () => ({
  CommonErrors: {
    RATE_LIMIT_EXCEEDED: jest.fn((msg) => ({ type: "RATE_LIMIT_EXCEEDED", message: msg, status: 429 })),
    NO_FILE_PROVIDED: jest.fn((msg) => ({ type: "NO_FILE_PROVIDED", message: msg, status: 400 })),
    FILE_TOO_LARGE: jest.fn((msg) => ({ type: "FILE_TOO_LARGE", message: msg, status: 413 })),
    UNSUPPORTED_FILE_TYPE: jest.fn((msg) => ({ type: "UNSUPPORTED_FILE_TYPE", message: msg, status: 400 })),
    VALIDATION_ERROR: jest.fn((msg) => ({ type: "VALIDATION_ERROR", message: msg, status: 400 })),
    INTERNAL_ERROR: jest.fn((msg) => ({ type: "INTERNAL_ERROR", message: msg, status: 500 })),
    RESULT_NOT_FOUND: jest.fn((id) => ({ type: "RESULT_NOT_FOUND", message: `Result ${id} not found`, status: 404 })),
  },
  handleAPIError: jest.fn((error) =>
    Response.json({ error: error.type, message: error.message }, { status: error.status || 500 })
  ),
  APIError: class APIError extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  }
}));

import { validateRequest } from "@/lib/api/validation";
import { proxyFileUploadWithFormData, proxyApiRequest } from "@/lib/api/proxy";
import { trackEvent } from "@/lib/analytics/telemetry";

describe("ACS Extractor Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default validation success
    const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
    mockValidation.mockResolvedValue({
      isValid: true,
      files: [
        new File(["PDF content for lesson plan"], "lesson_plan.pdf", { type: "application/pdf" }),
        new File(["Image content for diagram"], "aircraft_diagram.jpg", { type: "image/jpeg" }),
      ],
      data: new FormData(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Complete ACS Extraction Workflow", () => {
    it("successfully processes files and retrieves results end-to-end", async () => {
      // Step 1: Mock successful file upload and extraction
      const reportId = "550e8400-e29b-41d4-a716-446655440000";
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      const extractionResponse = {
        report_id: reportId,
        total_files: 2,
        processed_files: 2,
        acs_codes_found: 8,
        results: [
          {
            filename: "lesson_plan.pdf",
            acs_codes: [
              {
                code: "PPT.VII.A.1a",
                description: "Aircraft Systems - Engine Operation",
                confidence: 0.95
              },
              {
                code: "PPT.IV.B.2",
                description: "Navigation Systems - GPS Navigation",
                confidence: 0.88
              },
              {
                code: "COM.III.A.5",
                description: "Airport and Seaplane Base Operations",
                confidence: 0.91
              }
            ],
            confidence_score: 0.91
          },
          {
            filename: "aircraft_diagram.jpg",
            acs_codes: [
              {
                code: "PPT.I.B.1",
                description: "Airworthiness Requirements",
                confidence: 0.87
              },
              {
                code: "PPT.II.A.2",
                description: "Weather Information",
                confidence: 0.83
              }
            ],
            confidence_score: 0.85
          }
        ],
        public_url: `https://api.cfipros.com/v1/extractor/results/${reportId}`
      };

      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify(extractionResponse), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      // Execute extraction
      const extractRequest = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: new FormData(),
      });

      const extractResponse = await extractPost(extractRequest);
      const extractData = await extractResponse.json();

      // Verify extraction response
      expect(extractResponse.status).toBe(200);
      expect(extractData.report_id).toBe(reportId);
      expect(extractData.total_files).toBe(2);
      expect(extractData.processed_files).toBe(2);
      expect(extractData.acs_codes_found).toBe(8);
      expect(extractData.results).toHaveLength(2);

      // Step 2: Mock successful results retrieval
      const mockResultsProxy = proxyApiRequest as jest.MockedFunction<typeof proxyApiRequest>;
      
      const resultsResponse = {
        report_id: reportId,
        created_at: "2024-01-15T10:30:00Z",
        total_files: 2,
        acs_codes_found: 8,
        results: extractionResponse.results
      };

      mockResultsProxy.mockResolvedValue(
        new Response(JSON.stringify(resultsResponse), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      // Execute results retrieval
      const resultsRequest = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
      });

      const context = {
        params: Promise.resolve({ id: reportId })
      };

      const resultsResponseObj = await resultsGet(resultsRequest, context);
      const resultsData = await resultsResponseObj.json();

      // Verify results response
      expect(resultsResponseObj.status).toBe(200);
      expect(resultsData.report_id).toBe(reportId);
      expect(resultsData.created_at).toBe("2024-01-15T10:30:00Z");
      expect(resultsData.total_files).toBe(2);
      expect(resultsData.acs_codes_found).toBe(8);
      expect(resultsData.results).toHaveLength(2);

      // Verify data consistency between extraction and results
      expect(resultsData.results).toEqual(extractData.results);
      
      // Verify ACS codes are properly formatted
      resultsData.results.forEach((result: any) => {
        result.acs_codes.forEach((acsCode: any) => {
          expect(acsCode.code).toMatch(/^[A-Z]+\.[A-Z]+\.[A-Z]+\.[0-9]+[a-z]?$/);
          expect(acsCode.confidence).toBeGreaterThanOrEqual(0);
          expect(acsCode.confidence).toBeLessThanOrEqual(1);
        });
        expect(result.confidence_score).toBeGreaterThanOrEqual(0);
        expect(result.confidence_score).toBeLessThanOrEqual(1);
      });

      // Verify analytics tracking for complete flow
      expect(trackEvent).toHaveBeenCalledWith("batch_upload_started", expect.objectContaining({
        file_count: 2,
        correlation_id: "integration_test_correlation_id",
      }));

      expect(trackEvent).toHaveBeenCalledWith("extractor_results_viewed", expect.objectContaining({
        report_id: expect.stringContaining("550e8400"), // Partial ID for privacy
        correlation_id: expect.any(String),
        is_public: true,
      }));
    });

    it("handles processing multiple file types in a single request", async () => {
      // Setup files of different types
      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: [
          new File(["PDF lesson content"], "ground_school.pdf", { type: "application/pdf" }),
          new File(["JPEG diagram"], "cockpit_layout.jpg", { type: "image/jpeg" }),
          new File(["PNG screenshot"], "weather_chart.png", { type: "image/png" }),
        ],
        data: new FormData(),
      });

      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      const reportId = "multi-file-test-id";
      
      mockProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: reportId,
          total_files: 3,
          processed_files: 3,
          acs_codes_found: 15,
          results: [
            {
              filename: "ground_school.pdf",
              acs_codes: [
                { code: "PPT.I.A.1", description: "Regulations", confidence: 0.94 }
              ],
              confidence_score: 0.94
            },
            {
              filename: "cockpit_layout.jpg", 
              acs_codes: [
                { code: "PPT.VII.A.2", description: "Aircraft Systems", confidence: 0.89 }
              ],
              confidence_score: 0.89
            },
            {
              filename: "weather_chart.png",
              acs_codes: [
                { code: "PPT.II.A.1", description: "Weather", confidence: 0.92 }
              ],
              confidence_score: 0.92
            }
          ]
        }), {
          status: 200,
          headers: new Headers(),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: new FormData(),
      });

      const response = await extractPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_files).toBe(3);
      expect(data.processed_files).toBe(3);
      expect(data.results).toHaveLength(3);
      
      // Verify all file types were processed
      const filenames = data.results.map((r: any) => r.filename);
      expect(filenames).toContain("ground_school.pdf");
      expect(filenames).toContain("cockpit_layout.jpg");
      expect(filenames).toContain("weather_chart.png");
    });
  });

  describe("Error Recovery and Edge Cases", () => {
    it("handles partial processing failures gracefully", async () => {
      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      const reportId = "partial-failure-test";
      
      // Simulate partial processing (some files failed)
      mockProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: reportId,
          total_files: 3,
          processed_files: 2, // One file failed to process
          acs_codes_found: 5,
          results: [
            {
              filename: "successful_file1.pdf",
              acs_codes: [
                { code: "PPT.I.A.1", description: "Regulations", confidence: 0.91 }
              ],
              confidence_score: 0.91
            },
            {
              filename: "successful_file2.jpg",
              acs_codes: [
                { code: "PPT.II.B.1", description: "Weather Systems", confidence: 0.87 }
              ],
              confidence_score: 0.87
            }
            // Note: third file not in results due to processing failure
          ],
          errors: [
            {
              filename: "corrupted_file.pdf",
              error: "File appears to be corrupted or unreadable"
            }
          ]
        }), {
          status: 200, // Still returns 200 for partial success
          headers: new Headers(),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST", 
        body: new FormData(),
      });

      const response = await extractPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_files).toBe(3);
      expect(data.processed_files).toBe(2);
      expect(data.results).toHaveLength(2);
      
      // Verify error information is included
      if (data.errors) {
        expect(data.errors).toHaveLength(1);
        expect(data.errors[0].filename).toBe("corrupted_file.pdf");
      }
    });

    it("handles backend timeout and retry scenario", async () => {
      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      // First call times out
      mockProxy.mockRejectedValueOnce(new Error("Request timeout"));
      
      // Second call succeeds
      mockProxy.mockResolvedValueOnce(
        new Response(JSON.stringify({
          report_id: "retry-success-id",
          total_files: 1,
          processed_files: 1,
          acs_codes_found: 3,
          results: [{
            filename: "test.pdf",
            acs_codes: [
              { code: "PPT.I.A.1", description: "Test Code", confidence: 0.9 }
            ],
            confidence_score: 0.9
          }]
        }), {
          status: 200,
          headers: new Headers(),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: new FormData(),
      });

      // First attempt should fail
      const firstResponse = await extractPost(request);
      expect(firstResponse.status).toBe(500);
      expect(trackEvent).toHaveBeenCalledWith("batch_upload_failed", expect.any(Object));

      // Clear mocks and try again (simulating user retry)
      jest.clearAllMocks();
      
      // Setup mocks for retry
      const mockValidationRetry = jest.mocked(validateRequest.fileUpload);
      mockValidationRetry.mockResolvedValue({
        isValid: true,
        files: [new File(["test"], "test.pdf", { type: "application/pdf" })],
        data: new FormData(),
      });

      const mockProxyRetry = jest.mocked(proxyFileUploadWithFormData);
      mockProxyRetry.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: "retry-success-id",
          total_files: 1,
          processed_files: 1,
          acs_codes_found: 3,
          results: [{
            filename: "test.pdf",
            acs_codes: [{ code: "PPT.I.A.1", description: "Test Code", confidence: 0.9 }],
            confidence_score: 0.9
          }]
        }), { status: 200, headers: new Headers() })
      );

      // Second attempt should succeed
      const retryResponse = await extractPost(request);
      expect(retryResponse.status).toBe(200);
    });
  });

  describe("Performance and Scale Testing", () => {
    it("handles maximum allowed files (30 per OpenAPI spec)", async () => {
      // Create 30 files (maximum allowed per API contract)
      const maxFiles = Array.from({ length: 30 }, (_, i) => 
        new File([`content ${i}`], `file_${i}.pdf`, { type: "application/pdf" })
      );

      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: maxFiles,
        data: new FormData(),
      });

      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      mockProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: "max-files-test",
          total_files: 30,
          processed_files: 30,
          acs_codes_found: 150, // Average 5 codes per file
          results: maxFiles.map((file, i) => ({
            filename: file.name,
            acs_codes: [
              { code: `PPT.${i % 7 + 1}.A.1`, description: `Code ${i}`, confidence: 0.85 + (i % 15) * 0.01 }
            ],
            confidence_score: 0.8 + (i % 20) * 0.01
          }))
        }), {
          status: 200,
          headers: new Headers(),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: new FormData(),
      });

      const response = await extractPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.total_files).toBe(30);
      expect(data.processed_files).toBe(30);
      expect(data.results).toHaveLength(30);

      // Verify all files processed
      expect(data.results.every((r: any) => r.filename.startsWith('file_'))).toBe(true);
    });

    it("handles large response payloads efficiently", async () => {
      // Simulate processing that finds many ACS codes
      const largeResults = Array.from({ length: 5 }, (_, fileIndex) => ({
        filename: `comprehensive_study_${fileIndex}.pdf`,
        acs_codes: Array.from({ length: 20 }, (_, codeIndex) => ({
          code: `PPT.${(fileIndex + 1)}.${String.fromCharCode(65 + (codeIndex % 26))}.${codeIndex + 1}`,
          description: `Detailed ACS requirement ${fileIndex}-${codeIndex} with comprehensive explanation`,
          confidence: 0.7 + Math.random() * 0.3
        })),
        confidence_score: 0.85 + Math.random() * 0.1
      }));

      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      mockProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: "large-payload-test",
          total_files: 5,
          processed_files: 5,
          acs_codes_found: 100, // 5 files × 20 codes each
          results: largeResults
        }), {
          status: 200,
          headers: new Headers(),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: new FormData(),
      });

      const response = await extractPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.acs_codes_found).toBe(100);
      expect(data.results).toHaveLength(5);
      
      // Verify each file has 20 ACS codes
      data.results.forEach((result: any) => {
        expect(result.acs_codes).toHaveLength(20);
      });
    });
  });

  describe("Rate Limiting Integration", () => {
    it("enforces rate limits across multiple requests", async () => {
      const { FileUploadRateLimiter } = await import("@/lib/security/fileUpload");
      const mockRateLimit = FileUploadRateLimiter.checkRateLimit as jest.MockedFunction<typeof FileUploadRateLimiter.checkRateLimit>;
      
      // First 19 requests should succeed
      for (let i = 0; i < 19; i++) {
        mockRateLimit.mockReturnValueOnce({
          allowed: true,
          remainingUploads: 19 - i,
          resetTime: Date.now() + 3600000,
        });
      }
      
      // 20th request should be rate limited
      mockRateLimit.mockReturnValueOnce({
        allowed: false,
        remainingUploads: 0,
        resetTime: Date.now() + 3600000,
      });

      const mockProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      mockProxy.mockResolvedValue(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: new Headers(),
        })
      );

      // Make 20 requests
      const requests = Array.from({ length: 20 }, () =>
        new NextRequest("http://localhost/api/extractor/extract", {
          method: "POST",
          body: new FormData(),
        })
      );

      const responses = [];
      for (const request of requests) {
        responses.push(await extractPost(request));
      }

      // First 19 should succeed, last should be rate limited
      for (let i = 0; i < 19; i++) {
        expect(responses[i].status).toBe(200);
      }
      expect(responses[19].status).toBe(400); // Rate limited
    });
  });
});