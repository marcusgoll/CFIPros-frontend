/**
 * Test helpers for integration tests
 * Provides proper mock setup for testing without backend
 */

import { jest } from "@jest/globals";

export function setupIntegrationMocks() {
  // Mock FileUploadRateLimiter
  const mockCheckRateLimit = jest.fn().mockReturnValue({
    allowed: true,
    remainingUploads: 15,
    resetTime: Date.now() + 3600000,
  });

  jest.mock("@/lib/security/fileUpload", () => ({
    FileUploadRateLimiter: {
      checkRateLimit: mockCheckRateLimit,
    },
  }));

  // Mock validateRequest
  const mockFileUpload = jest.fn().mockResolvedValue({
    isValid: true,
    files: [
      new File(["test content"], "test.pdf", { type: "application/pdf" }),
    ],
    data: new FormData(),
  });

  jest.mock("@/lib/api/validation", () => ({
    validateRequest: {
      fileUpload: mockFileUpload,
    },
  }));

  // Mock proxyFileUploadWithFormData
  const mockProxyFileUploadWithFormData = jest.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        success: true,
        batch_id: "btch_test123",
        status: "processing",
      }),
      {
        status: 202,
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }
    )
  );

  jest.mock("@/lib/api/proxy", () => ({
    proxyFileUploadWithFormData: mockProxyFileUploadWithFormData,
    getClientIP: jest.fn(() => "192.168.1.1"),
    addCorrelationId: jest.fn(() => "test-correlation-id"),
  }));

  return {
    mockCheckRateLimit,
    mockFileUpload,
    mockProxyFileUploadWithFormData,
  };
}

export function createMockFormData(files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });
  return formData;
}

export function createMockBatchResponse(batchId: string, fileCount: number) {
  return {
    batch_id: batchId,
    status: "processing",
    files_received: fileCount,
    created_at: new Date().toISOString(),
    estimated_completion: new Date(Date.now() + 5000).toISOString(),
  };
}

export function createMockResultsResponse(batchId: string) {
  return {
    batch_id: batchId,
    status: "completed",
    results: [
      {
        file_name: "test.pdf",
        acs_codes: ["091", "092", "093"],
        confidence: 0.95,
        topics: ["Navigation", "Weather", "Regulations"],
      },
    ],
    completed_at: new Date().toISOString(),
  };
}