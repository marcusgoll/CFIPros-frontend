/**
 * Tests for /api/results route handler
 * Testing public results access endpoints
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/results/[id]/route";
import { APIError } from "@/lib/api/errors";
import type { MockAPIClient } from "@/lib/types";

// Mock the API client
jest.mock("@/lib/api/client", () => {
  const get = jest.fn();
  const APIClient = jest.fn().mockImplementation(() => ({ get }));
  const apiClient = { get };
  return { APIClient, apiClient };
});

// Mock rate limiter
jest.mock("@/lib/api/rateLimiter", () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe("/api/results", () => {
  let mockApiClient: MockAPIClient;

  beforeEach(() => {
    const { APIClient } = require("@/lib/api/client");
    mockApiClient = new APIClient();
    jest.clearAllMocks();
  });

  describe("GET /api/results/[id]", () => {
    it("should successfully retrieve results for valid ID", async () => {
      // Arrange
      const resultId = "test-result-123";
      const mockResult = {
        id: resultId,
        status: "completed",
        filename: "test-report.pdf",
        uploaded_at: "2024-01-01T00:00:00Z",
        processed_at: "2024-01-01T00:01:00Z",
        analysis: {
          acs_codes: ["PA.I.A.K1", "PA.I.B.K2"],
          weak_areas: ["Pre-flight Procedures", "Weather Systems"],
          score_breakdown: {
            overall: 85,
            areas: {
              "Pre-flight Procedures": 75,
              "Weather Systems": 80,
              "Emergency Procedures": 95,
            },
          },
          recommendations: [
            "Focus more on pre-flight checklist procedures",
            "Review weather pattern recognition",
          ],
        },
      };

      mockApiClient.get.mockResolvedValue(mockResult);

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/results/${resultId}`);
    });

    it("should return 404 for non-existent results", async () => {
      // Arrange
      const resultId = "non-existent-id";
      const notFoundError = new APIError(
        "result_not_found",
        404,
        `Result ${resultId} not found`
      );
      mockApiClient.get.mockRejectedValue(notFoundError);

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.type).toBe("about:blank#result_not_found");
      expect(data.title).toBe("result_not_found");
      expect(data.detail).toBe(`Result ${resultId} not found`);
    });

    it("should validate result ID format", async () => {
      // Arrange
      const invalidId = "invalid-id-format-@#$";

      const request = new NextRequest(
        `http://localhost:3000/api/results/${invalidId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: invalidId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe("about:blank#invalid_result_id");
      expect(data.title).toBe("invalid_result_id");
      expect(data.detail).toContain("Invalid result ID format");
    });

    it("should handle processing status correctly", async () => {
      // Arrange
      const resultId = "processing-result-123";
      const processingResult = {
        id: resultId,
        status: "processing",
        filename: "test-report.pdf",
        uploaded_at: "2024-01-01T00:00:00Z",
        progress: 75,
        estimated_completion: "2024-01-01T00:02:00Z",
      };

      mockApiClient.get.mockResolvedValue(processingResult);

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.status).toBe("processing");
      expect(data.progress).toBe(75);
      expect(data).toHaveProperty("estimated_completion");
      expect(response.headers.get("Cache-Control")).toBe("no-cache");
    });

    it("should apply appropriate caching for completed results", async () => {
      // Arrange
      const resultId = "completed-result-123";
      const completedResult = {
        id: resultId,
        status: "completed",
        filename: "test-report.pdf",
        analysis: { acs_codes: ["PA.I.A.K1"] },
      };

      mockApiClient.get.mockResolvedValue(completedResult);

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe(
        "public, max-age=3600, s-maxage=86400"
      );
      expect(response.headers.get("ETag")).toBeTruthy();
    });

    it("should handle rate limiting for results endpoint", async () => {
      // Arrange
      const { rateLimiter } = require("@/lib/api/rateLimiter");
      rateLimiter.check.mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 3600000,
      });

      const resultId = "test-result-123";
      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.type).toBe("about:blank#rate_limit_exceeded");
      expect(data.title).toBe("rate_limit_exceeded");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("100");
    });

    it("should include security headers", async () => {
      // Arrange
      const resultId = "test-result-123";
      mockApiClient.get.mockResolvedValue({
        id: resultId,
        status: "completed",
      });

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });

      // Assert
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
    });

    it("should handle backend timeouts gracefully", async () => {
      // Arrange
      const resultId = "test-result-123";
      const timeoutError = new APIError(
        "request_timeout",
        504,
        "Backend request timed out"
      );
      mockApiClient.get.mockRejectedValue(timeoutError);
      const { rateLimiter } = require("@/lib/api/rateLimiter");
      rateLimiter.check.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 3600000,
      });

      const request = new NextRequest(
        `http://localhost:3000/api/results/${resultId}`,
        {
          method: "GET",
        }
      );

      // Act
      const response = await GET(request, {
        params: Promise.resolve({ id: resultId }),
      });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(504);
      expect(data.type).toBe("about:blank#request_timeout");
      expect(data.detail).toBe("Backend request timed out");
    });
  });
});
