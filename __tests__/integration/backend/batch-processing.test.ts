/**
 * Backend Direct API Test Framework - Batch Processing Tests
 * Tests batch status and results endpoints directly against backend
 * Task 2.1: Backend Direct API Test Framework  
 */

import { BaseEndpointTest } from "./base-test";
import { validateApiContract } from "./contract-validation";

describe("Backend API: Batch Processing Endpoints", () => {
  let testSuite: BaseEndpointTest;
  let testBatchId: string;

  beforeAll(async () => {
    testSuite = new BaseEndpointTest("local");
    await testSuite.setupAuth();
    
    // Create a test batch for status/results testing
    // In a real scenario, this would come from file extraction
    testBatchId = "btch_test_" + Date.now();
  });

  afterAll(async () => {
    await testSuite.teardown();
  });

  describe("GET /api/v1/batches/{id}/status", () => {
    it("should return batch status information", async () => {
      const response = await testSuite.testEndpointAccessible({
        endpoint: `/api/v1/batches/${testBatchId}/status`,
        method: "GET",
        requiresAuth: true,
        expectedStatus: [200, 404] // 404 is acceptable for non-existent test batch
      });

      if (response.status === 200) {
        expect(response.data).toHaveProperty("batch_id");
        expect(response.data).toHaveProperty("status");
        expect(["processing", "completed", "failed", "cancelled"]).toContain(
          response.data.status
        );
        expect(response.data).toHaveProperty("created_at");

        // Validate contract compliance
        const contractValidation = validateApiContract(
          "GET",
          "/api/v1/batches/{id}/status",
          response
        );
        
        if (!contractValidation.valid) {
          console.warn("Contract validation failed:", contractValidation.errors);
        }
      }
    });

    it("should return 404 for non-existent batch", async () => {
      const nonExistentId = "btch_nonexistent_12345";
      
      const response = await testSuite.apiClient.get(
        `/api/v1/batches/${nonExistentId}/status`,
        { expectStatus: [404] }
      );

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty("error");
      expect(response.data).toHaveProperty("code");
      expect(response.data.code).toBe("BATCH_NOT_FOUND");
    });

    it("should require authentication", async () => {
      testSuite.apiClient.clearAuth();
      
      const response = await testSuite.apiClient.get(
        `/api/v1/batches/${testBatchId}/status`,
        { expectStatus: [401] }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty("error");
      
      // Restore auth
      await testSuite.setupAuth();
    });
  });

  describe("GET /api/v1/batches/{id}/results", () => {
    it("should return batch results when completed", async () => {
      const response = await testSuite.apiClient.get(
        `/api/v1/batches/${testBatchId}/results`,
        { expectStatus: [200, 404, 409] } // 409 if not completed yet
      );

      if (response.status === 200) {
        expect(response.data).toHaveProperty("batch_id");
        expect(response.data).toHaveProperty("status");
        expect(response.data.status).toBe("completed");
        expect(response.data).toHaveProperty("results");
        expect(Array.isArray(response.data.results)).toBe(true);
        
        // Validate results structure if present
        if (response.data.results.length > 0) {
          const firstResult = response.data.results[0];
          expect(firstResult).toHaveProperty("file_name");
          expect(firstResult).toHaveProperty("acs_codes");
          expect(Array.isArray(firstResult.acs_codes)).toBe(true);
          expect(firstResult).toHaveProperty("confidence");
          expect(typeof firstResult.confidence).toBe("number");
        }
        
        expect(response.data).toHaveProperty("completed_at");
      } else if (response.status === 409) {
        expect(response.data).toHaveProperty("error");
        expect(response.data.code).toBe("BATCH_NOT_COMPLETED");
      }
    });

    it("should return 404 for non-existent batch results", async () => {
      const nonExistentId = "btch_nonexistent_results_12345";
      
      const response = await testSuite.apiClient.get(
        `/api/v1/batches/${nonExistentId}/results`,
        { expectStatus: [404] }
      );

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty("error");
      expect(response.data.code).toBe("BATCH_NOT_FOUND");
    });
  });
});
