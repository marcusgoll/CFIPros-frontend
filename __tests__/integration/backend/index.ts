/**
 * Backend Direct API Test Framework - Main Export
 * Entry point for all backend direct API testing components
 * Task 2.1: Backend Direct API Test Framework
 */

// Core framework components
export { 
  BackendApiClient, 
  createApiClient, 
  apiClient,
  type ApiResponse,
  type RequestOptions
} from "./api-client";

export {
  BaseEndpointTest,
  FileUploadTestBase,
  type ContractValidationOptions,
  type EndpointTestConfig
} from "./base-test";

export {
  ContractValidator,
  apiContracts,
  validateApiContract,
  type SchemaProperty,
  type EndpointContract
} from "./contract-validation";

// Test utilities
export function createBackendTestSuite(environment?: string) {
  return {
    apiClient: createApiClient(environment as any),
    baseTest: new BaseEndpointTest(environment as any),
    fileUploadTest: new FileUploadTestBase(environment as any),
  };
}

// Environment validation
export async function validateBackendTestSetup(environment?: string): Promise<boolean> {
  try {
    const client = createApiClient(environment as any);
    
    // Try to make a basic health check request
    const response = await client.get("/health", {
      expectStatus: [200, 404, 500] // Accept any response that indicates connectivity
    });
    
    console.log(`[Backend Test Setup] Health check: ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.error("[Backend Test Setup] Validation failed:", error);
    return false;
  }
}
