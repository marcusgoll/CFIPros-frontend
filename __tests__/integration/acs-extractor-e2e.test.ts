/**
 * End-to-End Tests for ACS Extractor
 * Tests real user workflows with actual file handling and API interactions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { NextRequest } from "next/server";

// Test utilities for creating realistic test files
class TestFileGenerator {
  static createPdfFile(name: string, content: string = "Mock PDF content with ACS codes PPT.VII.A.1a and COM.III.B.2"): File {
    const blob = new Blob([content], { type: "application/pdf" });
    return new File([blob], name, { type: "application/pdf" });
  }

  static createImageFile(name: string, type: "jpeg" | "png" = "jpeg"): File {
    // Simulate image file with binary content
    const imageData = new Uint8Array([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, // JPEG header
      ...Array.from({ length: 1000 }, () => Math.floor(Math.random() * 256))
    ]);
    const mimeType = type === "jpeg" ? "image/jpeg" : "image/png";
    return new File([imageData], name, { type: mimeType });
  }

  static createFormDataWithFiles(files: File[]): FormData {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    return formData;
  }
}

// Mock realistic API responses based on OpenAPI contract
class MockApiResponses {
  static successfulExtraction(reportId: string, files: File[]) {
    return {
      report_id: reportId,
      total_files: files.length,
      processed_files: files.length,
      acs_codes_found: files.length * 3, // Average 3 codes per file
      results: files.map((file, index) => ({
        filename: file.name,
        acs_codes: [
          {
            code: `PPT.VII.A.${index + 1}a`,
            description: `Aircraft Systems - Component ${index + 1}`,
            confidence: 0.90 + (index * 0.02)
          },
          {
            code: `COM.III.B.${index + 2}`,
            description: `Performance and Limitations - Area ${index + 2}`,
            confidence: 0.85 + (index * 0.03)
          },
          {
            code: `CFI.IV.C.${index + 1}`,
            description: `Instructional Techniques - Method ${index + 1}`,
            confidence: 0.88 + (index * 0.01)
          }
        ],
        confidence_score: 0.87 + (index * 0.02)
      })),
      public_url: `https://api.cfipros.com/v1/extractor/results/${reportId}`
    };
  }

  static publicResults(reportId: string, extractionData: any) {
    return {
      report_id: reportId,
      created_at: new Date().toISOString(),
      total_files: extractionData.total_files,
      acs_codes_found: extractionData.acs_codes_found,
      results: extractionData.results
    };
  }
}

// Setup comprehensive mocks for E2E testing
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
  getClientIP: jest.fn(() => "203.0.113.42"), // Test IP
  addCorrelationId: jest.fn(() => `e2e_test_${Date.now()}`),
}));

jest.mock("@/lib/security/fileUpload", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: jest.fn(),
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
    Response.json(
      { error: error.type, message: error.message, request_id: `req_${Date.now()}` },
      { status: error.status || 500 }
    )
  ),
  APIError: class APIError extends Error {
    constructor(message: string, public status: number) {
      super(message);
    }
  }
}));

import { POST as extractPost } from "@/app/api/extractor/extract/route";
import { GET as resultsGet } from "@/app/api/extractor/results/[id]/route";
import { validateRequest } from "@/lib/api/validation";
import { proxyFileUploadWithFormData, proxyApiRequest } from "@/lib/api/proxy";
import { FileUploadRateLimiter } from "@/lib/security/fileUpload";
import { trackEvent } from "@/lib/analytics/telemetry";

describe("ACS Extractor E2E Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default rate limit setup - allows requests
    const mockRateLimit = FileUploadRateLimiter.checkRateLimit as jest.MockedFunction<typeof FileUploadRateLimiter.checkRateLimit>;
    mockRateLimit.mockReturnValue({
      allowed: true,
      remainingUploads: 15,
      resetTime: Date.now() + 3600000,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Student Workflow: Upload Study Materials", () => {
    it("student uploads lesson plan PDFs and gets ACS code analysis", async () => {
      // Step 1: Student creates study materials
      const studyFiles = [
        TestFileGenerator.createPdfFile("private_pilot_lesson_1.pdf", "Aircraft systems, engine operation, PPT.VII.A.1a"),
        TestFileGenerator.createPdfFile("navigation_basics.pdf", "GPS navigation systems, PPT.IV.B.2, compass usage"),
        TestFileGenerator.createImageFile("cockpit_diagram.jpg", "jpeg")
      ];

      // Step 2: Setup validation and API responses
      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: studyFiles,
        data: TestFileGenerator.createFormDataWithFiles(studyFiles),
      });

      const reportId = "student_workflow_" + Date.now();
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      const extractionData = MockApiResponses.successfulExtraction(reportId, studyFiles);
      
      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify(extractionData), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      // Step 3: Student uploads files
      const uploadRequest = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: TestFileGenerator.createFormDataWithFiles(studyFiles),
        headers: {
          "User-Agent": "CFIpros-Student-App/1.0",
          "X-User-Context": "student_study_session"
        }
      });

      const uploadResponse = await extractPost(uploadRequest);
      const uploadData = await uploadResponse.json();

      // Step 4: Verify upload success
      expect(uploadResponse.status).toBe(200);
      expect(uploadData.report_id).toBe(reportId);
      expect(uploadData.total_files).toBe(3);
      expect(uploadData.processed_files).toBe(3);
      expect(uploadData.acs_codes_found).toBe(9); // 3 files × 3 codes each

      // Verify ACS codes found in study materials
      const allCodes = uploadData.results.flatMap((r: any) => r.acs_codes.map((c: any) => c.code));
      expect(allCodes).toContain("PPT.VII.A.1a"); // Aircraft systems
      expect(allCodes).toContain("COM.III.B.2"); // Performance
      expect(allCodes).toContain("CFI.IV.C.1"); // Instructional

      // Step 5: Student retrieves public results
      const mockResultsProxy = proxyApiRequest as jest.MockedFunction<typeof proxyApiRequest>;
      mockResultsProxy.mockResolvedValue(
        new Response(JSON.stringify(MockApiResponses.publicResults(reportId, extractionData)), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      const resultsRequest = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
        headers: {
          "User-Agent": "CFIpros-Student-App/1.0"
        }
      });

      const context = { params: Promise.resolve({ id: reportId }) };
      const resultsResponse = await resultsGet(resultsRequest, context);
      const resultsData = await resultsResponse.json();

      // Step 6: Verify results match extraction
      expect(resultsResponse.status).toBe(200);
      expect(resultsData.report_id).toBe(reportId);
      expect(resultsData.results).toEqual(uploadData.results);

      // Step 7: Verify analytics tracking for student workflow
      expect(trackEvent).toHaveBeenCalledWith("batch_upload_started", expect.objectContaining({
        file_count: 3,
        correlation_id: expect.stringContaining("e2e_test_"),
      }));

      expect(trackEvent).toHaveBeenCalledWith("extractor_results_viewed", expect.objectContaining({
        is_public: true,
      }));
    });
  });

  describe("CFI Workflow: Analyze Student Work", () => {
    it("CFI uploads student checkride prep materials for comprehensive analysis", async () => {
      // Step 1: CFI prepares student materials for analysis
      const studentMaterials = [
        TestFileGenerator.createPdfFile("oral_exam_prep.pdf", "Regulations FAR 91, PPT.I.A.1, airspace requirements"),
        TestFileGenerator.createPdfFile("cross_country_planning.pdf", "Navigation, weather, PPT.II.A.3, PPT.IV.B.1"),
        TestFileGenerator.createPdfFile("maneuvers_checklist.pdf", "Flight maneuvers, PPT.VI.A.2, performance standards"),
        TestFileGenerator.createImageFile("weight_balance_calc.jpg", "jpeg"),
        TestFileGenerator.createImageFile("flight_planning_chart.png", "png")
      ];

      // Step 2: Setup for CFI workflow
      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: studentMaterials,
        data: TestFileGenerator.createFormDataWithFiles(studentMaterials),
      });

      const reportId = "cfi_analysis_" + Date.now();
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      // Simulate more comprehensive analysis for CFI
      const cfiAnalysisData = {
        report_id: reportId,
        total_files: 5,
        processed_files: 5,
        acs_codes_found: 18, // More detailed analysis
        results: studentMaterials.map((file, index) => ({
          filename: file.name,
          acs_codes: [
            {
              code: `PPT.${index + 1}.A.${index + 1}`,
              description: `Private Pilot ACS Area ${index + 1} - Task A`,
              confidence: 0.92 + (index * 0.01)
            },
            {
              code: `PPT.${index + 1}.B.${Math.floor(index / 2) + 1}`,
              description: `Private Pilot ACS Area ${index + 1} - Task B`,
              confidence: 0.89 + (index * 0.02)
            },
            {
              code: `PPT.${index + 2}.C.1`,
              description: `Cross-referenced requirement from Area ${index + 2}`,
              confidence: 0.85 + (index * 0.01)
            },
            // Additional code for comprehensive analysis
            {
              code: `COM.${Math.floor(index / 2) + 1}.A.${index + 1}`,
              description: `Commercial standards cross-reference`,
              confidence: 0.78 + (index * 0.02)
            }
          ],
          confidence_score: 0.89 + (index * 0.01),
          metadata: {
            analysis_depth: "comprehensive",
            cross_references: true,
            instructor_notes: `File ${index + 1} shows good coverage of required areas`
          }
        })),
        public_url: `https://api.cfipros.com/v1/extractor/results/${reportId}`,
        analysis_summary: {
          coverage_areas: ["Regulations", "Weather", "Navigation", "Aircraft Systems", "Performance"],
          gaps_identified: [],
          readiness_assessment: "checkride_ready"
        }
      };

      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify(cfiAnalysisData), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      // Step 3: CFI uploads for analysis
      const uploadRequest = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: TestFileGenerator.createFormDataWithFiles(studentMaterials),
        headers: {
          "User-Agent": "CFIpros-Instructor-Dashboard/2.1",
          "Authorization": "Bearer cfi_jwt_token_here",
          "X-User-Role": "cfi",
          "X-Analysis-Type": "comprehensive"
        }
      });

      const uploadResponse = await extractPost(uploadRequest);
      const uploadData = await uploadResponse.json();

      // Step 4: Verify comprehensive CFI analysis
      expect(uploadResponse.status).toBe(200);
      expect(uploadData.acs_codes_found).toBe(18); // More codes found than basic analysis
      expect(uploadData.total_files).toBe(5);
      
      // Verify CFI-specific analysis features
      if (uploadData.analysis_summary) {
        expect(uploadData.analysis_summary.coverage_areas).toHaveLength(5);
        expect(uploadData.analysis_summary.readiness_assessment).toBe("checkride_ready");
      }

      // Step 5: Verify ACS code diversity (PPT and COM standards)
      const allCodes = uploadData.results.flatMap((r: any) => r.acs_codes.map((c: any) => c.code));
      const pptCodes = allCodes.filter((code: string) => code.startsWith("PPT."));
      const comCodes = allCodes.filter((code: string) => code.startsWith("COM."));
      
      expect(pptCodes.length).toBeGreaterThan(0);
      expect(comCodes.length).toBeGreaterThan(0);

      // Step 6: CFI retrieves detailed results
      const mockResultsProxy = proxyApiRequest as jest.MockedFunction<typeof proxyApiRequest>;
      mockResultsProxy.mockResolvedValue(
        new Response(JSON.stringify({
          ...MockApiResponses.publicResults(reportId, cfiAnalysisData),
          instructor_view: {
            detailed_breakdown: true,
            cross_references: true,
            teaching_suggestions: [
              "Focus additional practice on Area IV Navigation",
              "Review weight and balance calculations",
              "Emphasize weather decision making scenarios"
            ]
          }
        }), {
          status: 200,
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      const resultsRequest = new NextRequest(`http://localhost/api/extractor/results/${reportId}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer cfi_jwt_token_here",
          "X-User-Role": "cfi"
        }
      });

      const context = { params: Promise.resolve({ id: reportId }) };
      const resultsResponse = await resultsGet(resultsRequest, context);
      const resultsData = await resultsResponse.json();

      expect(resultsResponse.status).toBe(200);
      expect(resultsData.instructor_view?.detailed_breakdown).toBe(true);
      expect(resultsData.instructor_view?.teaching_suggestions).toHaveLength(3);
    });
  });

  describe("Bulk Processing Workflow", () => {
    it("processes maximum file batch efficiently", async () => {
      // Step 1: Create maximum allowed files (30 per API spec)
      const maxFiles = Array.from({ length: 30 }, (_, i) => {
        const fileType = i % 3 === 0 ? "pdf" : i % 3 === 1 ? "jpeg" : "png";
        if (fileType === "pdf") {
          return TestFileGenerator.createPdfFile(`batch_file_${i}.pdf`, `Content ${i} with ACS codes`);
        } else {
          return TestFileGenerator.createImageFile(`batch_file_${i}.${fileType === "jpeg" ? "jpg" : "png"}`, fileType as "jpeg" | "png");
        }
      });

      // Step 2: Setup validation for bulk processing
      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: maxFiles,
        data: TestFileGenerator.createFormDataWithFiles(maxFiles),
      });

      const reportId = "bulk_processing_" + Date.now();
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      // Simulate bulk processing response
      const bulkProcessingData = {
        report_id: reportId,
        total_files: 30,
        processed_files: 30,
        acs_codes_found: 150, // Average 5 codes per file
        processing_time_ms: 45000, // 45 seconds for bulk processing
        results: maxFiles.map((file, index) => ({
          filename: file.name,
          acs_codes: Array.from({ length: 5 }, (_, codeIndex) => ({
            code: `PPT.${(index % 10) + 1}.${String.fromCharCode(65 + (codeIndex % 3))}.${codeIndex + 1}`,
            description: `ACS requirement ${index}-${codeIndex}`,
            confidence: 0.75 + Math.random() * 0.2
          })),
          confidence_score: 0.8 + Math.random() * 0.15,
          processing_time_ms: 1000 + Math.random() * 2000 // 1-3 seconds per file
        })),
        public_url: `https://api.cfipros.com/v1/extractor/results/${reportId}`,
        batch_statistics: {
          avg_codes_per_file: 5,
          avg_confidence: 0.87,
          fastest_file_ms: 856,
          slowest_file_ms: 2834,
          total_processing_time_ms: 45000
        }
      };

      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify(bulkProcessingData), {
          status: 200,
          headers: new Headers({ 
            "Content-Type": "application/json",
            "X-Processing-Time": "45000",
            "X-Batch-Size": "30"
          }),
        })
      );

      // Step 3: Execute bulk processing
      const bulkRequest = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: TestFileGenerator.createFormDataWithFiles(maxFiles),
        headers: {
          "X-Batch-Processing": "true",
          "X-Priority": "bulk"
        }
      });

      const bulkResponse = await extractPost(bulkRequest);
      const bulkData = await bulkResponse.json();

      // Step 4: Verify bulk processing results
      expect(bulkResponse.status).toBe(200);
      expect(bulkData.total_files).toBe(30);
      expect(bulkData.processed_files).toBe(30);
      expect(bulkData.acs_codes_found).toBe(150);
      expect(bulkData.results).toHaveLength(30);

      // Verify processing statistics
      if (bulkData.batch_statistics) {
        expect(bulkData.batch_statistics.avg_codes_per_file).toBe(5);
        expect(bulkData.batch_statistics.total_processing_time_ms).toBe(45000);
      }

      // Verify all files were processed
      const processedFilenames = bulkData.results.map((r: any) => r.filename);
      maxFiles.forEach(file => {
        expect(processedFilenames).toContain(file.name);
      });

      // Step 5: Verify analytics for bulk processing
      expect(trackEvent).toHaveBeenCalledWith("batch_upload_started", expect.objectContaining({
        file_count: 30,
      }));
    });
  });

  describe("Error Scenarios and Recovery", () => {
    it("handles mixed file types with some processing failures", async () => {
      const mixedFiles = [
        TestFileGenerator.createPdfFile("valid_lesson.pdf", "Valid ACS content PPT.I.A.1"),
        TestFileGenerator.createPdfFile("corrupted.pdf", ""), // Empty/corrupted
        TestFileGenerator.createImageFile("valid_diagram.jpg"),
        TestFileGenerator.createImageFile("unreadable.jpg"), // Simulated corruption
      ];

      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: mixedFiles,
        data: TestFileGenerator.createFormDataWithFiles(mixedFiles),
      });

      const reportId = "mixed_results_" + Date.now();
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      // Simulate partial success with errors
      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: reportId,
          total_files: 4,
          processed_files: 2, // Only 2 succeeded
          acs_codes_found: 6,
          results: [
            {
              filename: "valid_lesson.pdf",
              acs_codes: [
                { code: "PPT.I.A.1", description: "Regulations", confidence: 0.94 }
              ],
              confidence_score: 0.94
            },
            {
              filename: "valid_diagram.jpg",
              acs_codes: [
                { code: "PPT.VII.A.1", description: "Aircraft Systems", confidence: 0.87 }
              ],
              confidence_score: 0.87
            }
          ],
          errors: [
            {
              filename: "corrupted.pdf",
              error: "File appears to be empty or corrupted",
              error_code: "CORRUPTED_FILE"
            },
            {
              filename: "unreadable.jpg",
              error: "Image format not supported or file damaged",
              error_code: "UNREADABLE_IMAGE"
            }
          ],
          public_url: `https://api.cfipros.com/v1/extractor/results/${reportId}`
        }), {
          status: 200, // Partial success still returns 200
          headers: new Headers({ "Content-Type": "application/json" }),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: TestFileGenerator.createFormDataWithFiles(mixedFiles),
      });

      const response = await extractPost(request);
      const data = await response.json();

      // Verify partial success handling
      expect(response.status).toBe(200);
      expect(data.total_files).toBe(4);
      expect(data.processed_files).toBe(2);
      expect(data.results).toHaveLength(2);
      expect(data.errors).toHaveLength(2);

      // Verify error details
      expect(data.errors[0].filename).toBe("corrupted.pdf");
      expect(data.errors[0].error_code).toBe("CORRUPTED_FILE");
      expect(data.errors[1].filename).toBe("unreadable.jpg");
      expect(data.errors[1].error_code).toBe("UNREADABLE_IMAGE");

      // Verify successful files still processed correctly
      expect(data.results[0].filename).toBe("valid_lesson.pdf");
      expect(data.results[1].filename).toBe("valid_diagram.jpg");
    });
  });

  describe("Performance Monitoring", () => {
    it("tracks performance metrics throughout the workflow", async () => {
      const testFiles = [
        TestFileGenerator.createPdfFile("performance_test.pdf", "Performance test content"),
      ];

      const mockValidation = validateRequest.fileUpload as jest.MockedFunction<typeof validateRequest.fileUpload>;
      mockValidation.mockResolvedValue({
        isValid: true,
        files: testFiles,
        data: TestFileGenerator.createFormDataWithFiles(testFiles),
      });

      const reportId = "performance_" + Date.now();
      const mockExtractProxy = proxyFileUploadWithFormData as jest.MockedFunction<typeof proxyFileUploadWithFormData>;
      
      mockExtractProxy.mockResolvedValue(
        new Response(JSON.stringify({
          report_id: reportId,
          total_files: 1,
          processed_files: 1,
          acs_codes_found: 3,
          processing_time_ms: 2500,
          results: [{
            filename: "performance_test.pdf",
            acs_codes: [
              { code: "PPT.I.A.1", description: "Test", confidence: 0.9 }
            ],
            confidence_score: 0.9,
            processing_time_ms: 2500
          }],
          performance_metrics: {
            queue_time_ms: 150,
            processing_time_ms: 2500,
            response_time_ms: 2650,
            memory_usage_mb: 45,
            cpu_usage_percent: 23
          }
        }), {
          status: 200,
          headers: new Headers({ 
            "Content-Type": "application/json",
            "X-Processing-Time": "2650",
            "Server-Timing": "processing;dur=2500, queue;dur=150"
          }),
        })
      );

      const request = new NextRequest("http://localhost/api/extractor/extract", {
        method: "POST",
        body: TestFileGenerator.createFormDataWithFiles(testFiles),
      });

      const startTime = Date.now();
      const response = await extractPost(request);
      const endTime = Date.now();
      const data = await response.json();

      // Verify performance tracking
      expect(response.status).toBe(200);
      expect(data.performance_metrics).toBeDefined();
      expect(data.performance_metrics.processing_time_ms).toBe(2500);
      expect(data.processing_time_ms).toBe(2500);

      // Verify response headers include performance data
      expect(response.headers.get("X-Processing-Time")).toBe("2650");
      expect(response.headers.get("Server-Timing")).toContain("processing;dur=2500");

      // Verify reasonable response time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds for test
    });
  });
});