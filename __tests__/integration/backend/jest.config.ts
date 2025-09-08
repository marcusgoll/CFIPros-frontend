/**
 * Backend Direct API Test Framework - Jest Configuration
 * Configures Jest for backend API testing with proper environment setup
 * Task 2.1: Backend Direct API Test Framework
 */

import type { Config } from "jest";

const config: Config = {
  displayName: "Backend API Tests",
  testMatch: [
    "<rootDir>/__tests__/integration/backend/**/*.test.ts",
    "<rootDir>/__tests__/integration/backend/**/*.test.js"
  ],
  testEnvironment: "node",
  setupFilesAfterEnv: [
    "<rootDir>/__tests__/integration/backend/setup.ts"
  ],
  collectCoverageFrom: [
    "__tests__/integration/backend/**/*.{ts,js}",
    "!__tests__/integration/backend/**/*.test.{ts,js}",
    "!__tests__/integration/backend/setup.ts"
  ],
  coverageDirectory: "coverage/backend-api",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  testTimeout: 30000, // 30 seconds for API calls
  maxWorkers: 1, // Run tests sequentially to avoid rate limiting
  forceExit: true,
  detectOpenHandles: true,
};

export default config;
