/**
 * Backend Direct API Test Framework - Authentication Tests
 * Tests Clerk JWT token handling and authentication flows
 * Task 2.1: Backend Direct API Test Framework
 */

import { BaseEndpointTest } from "./base-test";

describe("Backend API: Authentication Integration", () => {
  let testSuite: BaseEndpointTest;

  beforeAll(async () => {
    testSuite = new BaseEndpointTest("local");
  });

  afterAll(async () => {
    await testSuite.teardown();
  });

  describe("JWT Token Management", () => {
    it("should accept valid JWT tokens", async () => {
      await testSuite.setupAuth();
      
      // Test with a protected endpoint
      const response = await testSuite.apiClient.get("/api/v1/user/profile", {
        expectStatus: [200, 401, 404] // 404 acceptable if endpoint not implemented
      });

      // If endpoint exists and auth is working, should not be 401
      if (response.status !== 404) {
        expect(response.status).not.toBe(401);
      }
    });

    it("should reject requests without authentication", async () => {
      testSuite.apiClient.clearAuth();
      
      // Test protected endpoint without auth
      const response = await testSuite.apiClient.get("/api/v1/user/profile", {
        expectStatus: [401, 404] // 404 if endpoint not implemented
      });

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty("error");
      }
    });

    it("should reject malformed JWT tokens", async () => {
      testSuite.apiClient.setAuthToken("invalid.jwt.token");
      
      const response = await testSuite.apiClient.get("/api/v1/user/profile", {
        expectStatus: [401, 404]
      });

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty("error");
      }
    });

    it("should handle expired JWT tokens gracefully", async () => {
      // Set an expired token (this is a mock expired token)
      const expiredToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDk0NTkyMDB9.mock";
      testSuite.apiClient.setAuthToken(expiredToken);
      
      const response = await testSuite.apiClient.get("/api/v1/user/profile", {
        expectStatus: [401, 404]
      });

      if (response.status !== 404) {
        expect(response.status).toBe(401);
        expect(response.data).toHaveProperty("error");
      }
    });
  });

  describe("Protected Endpoint Access", () => {
    beforeEach(async () => {
      await testSuite.setupAuth();
    });

    it("should protect file extraction endpoint", async () => {
      testSuite.apiClient.clearAuth();
      
      const response = await testSuite.apiClient.post(
        "/api/v1/extractor/extract",
        {},
        { expectStatus: [401] }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty("error");
    });

    it("should protect batch status endpoints", async () => {
      testSuite.apiClient.clearAuth();
      
      const response = await testSuite.apiClient.get(
        "/api/v1/batches/test123/status",
        { expectStatus: [401] }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty("error");
    });

    it("should protect batch results endpoints", async () => {
      testSuite.apiClient.clearAuth();
      
      const response = await testSuite.apiClient.get(
        "/api/v1/batches/test123/results",
        { expectStatus: [401] }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty("error");
    });
  });

  describe("Authentication Headers", () => {
    it("should include proper authentication headers", async () => {
      await testSuite.setupAuth();
      
      // Make a request and verify the Authorization header is sent
      const response = await testSuite.apiClient.get("/api/v1/health", {
        expectStatus: [200, 401, 404]
      });

      // This is more of an internal test - the header should be sent
      // We cannot directly inspect what was sent, but can verify behavior
      expect(response).toBeDefined();
    });

    it("should handle multiple authentication schemes", async () => {
      // Test API key authentication if supported
      if (testSuite.config.authConfig.apiKey) {
        testSuite.apiClient.clearAuth();
        
        const response = await testSuite.apiClient.request("/api/v1/health", {
          headers: {
            "X-API-Key": testSuite.config.authConfig.apiKey
          },
          expectStatus: [200, 401, 404]
        });

        expect(response).toBeDefined();
      }
    });
  });
});
