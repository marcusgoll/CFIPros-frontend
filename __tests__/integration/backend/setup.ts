/**
 * Backend Direct API Test Framework - Test Setup
 * Global setup for backend API tests
 * Task 2.1: Backend Direct API Test Framework
 */

import { validateTestSetup } from "../config";

// Global test setup
beforeAll(async () => {
  console.log("[Backend Tests] Setting up global test environment");
  
  // Validate test environment configuration
  const environment = process.env.INTEGRATION_TEST_ENV || "local";
  const isValid = validateTestSetup(environment as any);
  
  if (\!isValid) {
    console.error(`[Backend Tests] Test setup validation failed for environment: ${environment}`);
    process.exit(1);
  }
  
  console.log(`[Backend Tests] Environment validated: ${environment}`);
});

// Global test teardown
afterAll(async () => {
  console.log("[Backend Tests] Cleaning up global test environment");
  
  // Add any global cleanup here
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for connections to close
  
  console.log("[Backend Tests] Cleanup completed");
});

// Extend Jest matchers
expect.extend({
  toHaveValidApiResponse(received) {
    const pass = received && 
      typeof received.status === "number" &&
      received.status >= 100 && received.status < 600 &&
      received.headers &&
      typeof received.headers === "object";
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with status, headers, and data`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidApiResponse(): R;
    }
  }
}
