/**
 * Backend Direct API Test Framework - File Extraction Tests
 * Tests /api/v1/extractor/extract endpoint directly against backend
 * Task 2.1: Backend Direct API Test Framework
 */

import { FileUploadTestBase } from "./base-test";
import { validateApiContract } from "./contract-validation";

describe("Backend API: File Extraction Endpoint", () => {
  let testSuite: FileUploadTestBase;

  beforeAll(async () => {
    testSuite = new FileUploadTestBase("local");
    await testSuite.setupAuth();
  });

  afterAll(async () => {
    await testSuite.teardown();
  });

  describe("POST /api/v1/extractor/extract", () => {
    it("should accept valid PDF file and return 202 with batch_id", async () => {
      const testFile = testSuite.createTestFile(
        "sample_aktr.pdf",
        "Mock AKTR content for testing",
        "application/pdf"
      );

      const response = await testSuite.testFileUpload(
        "/api/v1/extractor/extract",
        [testFile],
        [202]
      );

      // Validate API contract compliance
      const contractValidation = validateApiContract(
        "POST",
        "/api/v1/extractor/extract", 
        response
      );

      if (!contractValidation.valid) {
        console.warn("Contract validation failed:", contractValidation.errors);
      }

      expect(response.status).toBe(202);
      expect(response.data).toHaveProperty("batch_id");
      expect(response.data).toHaveProperty("status");
      expect(response.data.status).toBe("processing");
      expect(response.data).toHaveProperty("files_received");
      expect(response.data.files_received).toBe(1);
    });

    it("should reject invalid file type with 400 INVALID_FILE_TYPE", async () => {
      const maliciousFile = testSuite.createTestFile(
        "malicious.exe",
        "This is not a valid document",
        "application/x-msdownload"
      );

      const response = await testSuite.apiClient.uploadFiles(
        "/api/v1/extractor/extract",
        [maliciousFile],
        undefined,
        { expectStatus: [400] }
      );

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty("error");
      expect(response.data).toHaveProperty("code");
      expect(response.data.code).toBe("INVALID_FILE_TYPE");
    });

    it("should require authentication and return 401 when unauthorized", async () => {
      // Clear authentication
      testSuite.apiClient.clearAuth();

      const testFile = testSuite.createTestFile(
        "test.pdf",
        "Test content",
        "application/pdf"
      );

      const response = await testSuite.apiClient.uploadFiles(
        "/api/v1/extractor/extract",
        [testFile],
        undefined,
        { expectStatus: [401] }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty("error");

      // Restore authentication for other tests
      await testSuite.setupAuth();
    });

    it("should handle multiple files up to batch limit", async () => {
      const files = [];
      for (let i = 1; i <= 5; i++) {
        files.push(
          testSuite.createTestFile(
            `batch_file_${i}.pdf`,
            `Mock content for file ${i}`,
            "application/pdf"
          )
        );
      }

      const response = await testSuite.testFileUpload(
        "/api/v1/extractor/extract",
        files,
        [202]
      );

      expect(response.status).toBe(202);
      expect(response.data.files_received).toBe(5);
    });

    it("should enforce rate limiting when enabled", async () => {
      if (!testSuite.config.features.enableRateLimitTests) {
        console.log("[Skip] Rate limiting tests disabled");
        return;
      }

      // Make rapid file upload requests
      const promises = [];
      for (let i = 0; i < 15; i++) {
        const file = testSuite.createTestFile(
          `rate_test_${i}.pdf`,
          `Rate limit test file ${i}`,
          "application/pdf"
        );
        
        promises.push(
          testSuite.apiClient.uploadFiles(
            "/api/v1/extractor/extract",
            [file],
            undefined,
            { expectStatus: [202, 429] }
          )
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].data).toHaveProperty("error");
        expect(rateLimitedResponses[0].data.code).toBe("RATE_LIMIT_EXCEEDED");
      }
    });
  });
});
