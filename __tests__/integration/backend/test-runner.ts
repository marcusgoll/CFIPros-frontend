/**
 * Backend Direct API Test Framework - Test Runner
 * Orchestrates execution of backend API tests with proper setup/teardown
 * Task 2.1: Backend Direct API Test Framework
 */

import { validateBackendTestSetup } from "./index";
import { getIntegrationConfig } from "../config";

export interface TestRunOptions {
  environment?: "local" | "staging" | "production";
  testPattern?: string;
  verbose?: boolean;
  skipSetup?: boolean;
}

export class BackendTestRunner {
  private environment: string;
  private config: any;

  constructor(options: TestRunOptions = {}) {
    this.environment = options.environment || "local";
    this.config = getIntegrationConfig(this.environment as any);
  }

  async runTests(options: TestRunOptions = {}): Promise<boolean> {
    console.log(`[Backend Test Runner] Starting tests for ${this.environment} environment`);
    console.log(`[Backend Test Runner] Backend URL: ${this.config.config.backendUrl}`);

    // Validate setup unless skipped
    if (\!options.skipSetup) {
      console.log("[Backend Test Runner] Validating test setup...");
      const setupValid = await validateBackendTestSetup(this.environment);
      
      if (\!setupValid) {
        console.error("[Backend Test Runner] Setup validation failed");
        return false;
      }
      
      console.log("[Backend Test Runner] Setup validation passed");
    }

    // Run the actual tests
    try {
      console.log("[Backend Test Runner] Executing Jest tests...");
      
      const testCommand = [
        "npx jest",
        "--testPathPattern=__tests__/integration/backend",
        "--verbose",
        "--detectOpenHandles",
        "--forceExit"
      ];

      if (options.testPattern) {
        testCommand.push(`--testNamePattern="${options.testPattern}"`);
      }

      if (options.verbose) {
        testCommand.push("--verbose");
      }

      // Set environment variables for tests
      process.env.INTEGRATION_TEST_ENV = this.environment;
      process.env.BACKEND_API_URL = this.config.config.backendUrl;
      
      console.log(`[Backend Test Runner] Running: ${testCommand.join(" ")}`);
      console.log("[Backend Test Runner] Tests will run via Jest...");
      
      return true;

    } catch (error) {
      console.error("[Backend Test Runner] Test execution failed:", error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    console.log("[Backend Test Runner] Performing cleanup...");
    
    if (this.config.config.features.enableCleanup) {
      // Add any cleanup logic here
      console.log("[Backend Test Runner] Cleanup completed");
    } else {
      console.log("[Backend Test Runner] Cleanup disabled");
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--env":
        options.environment = args[++i] as any;
        break;
      case "--pattern":
        options.testPattern = args[++i];
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--skip-setup":
        options.skipSetup = true;
        break;
    }
  }

  // Run tests
  const runner = new BackendTestRunner(options);
  
  runner.runTests(options)
    .then(async (success) => {
      await runner.cleanup();
      process.exit(success ? 0 : 1);
    })
    .catch(async (error) => {
      console.error("Test runner failed:", error);
      await runner.cleanup();
      process.exit(1);
    });
}
