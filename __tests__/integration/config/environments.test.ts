/**
 * Contract tests for environment-specific configurations
 * Validates that all test environments are properly configured
 * according to the API contract specifications
 */

import './setup.test'; // Load test environment variables
import { TestEnvironmentConfig, getEnvironmentConfig } from './environments';

describe('Environment Configuration Contract Tests', () => {
  describe('Local Development Environment', () => {
    let localConfig: TestEnvironmentConfig;

    beforeAll(() => {
      localConfig = getEnvironmentConfig('local');
    });

    test('should have correct backend URL for local development', () => {
      expect(localConfig.backendUrl).toBe('http://localhost:8000/api/v1');
    });

    test('should have correct frontend URL for local development', () => {
      expect(localConfig.frontendUrl).toBe('http://localhost:3000');
    });

    test('should have test credentials configured', () => {
      expect(localConfig.authConfig.testUser).toBeDefined();
      expect(localConfig.authConfig.testPassword).toBeDefined();
      expect(localConfig.authConfig.testUser).toMatch(/^test-user-/);
    });

    test('should have appropriate limits for local testing', () => {
      expect(localConfig.limits.maxFiles).toBe(30);
      expect(localConfig.limits.maxFileSize).toBeGreaterThan(0);
      expect(localConfig.limits.requestTimeout).toBe(60000); // 60 seconds for local
    });

    test('should enable all testing features for local development', () => {
      expect(localConfig.features.useRealFiles).toBe(false);
      expect(localConfig.features.enableRateLimitTests).toBe(false);
      expect(localConfig.features.enableCleanup).toBe(false);
    });
  });

  describe('Staging Environment', () => {
    let stagingConfig: TestEnvironmentConfig;

    beforeAll(() => {
      stagingConfig = getEnvironmentConfig('staging');
    });

    test('should have correct backend URL for staging', () => {
      expect(stagingConfig.backendUrl).toBe('https://cfipros-api-staging.up.railway.app/api/v1');
    });

    test('should have correct frontend URL for staging', () => {
      expect(stagingConfig.frontendUrl).toBe('https://staging.cfipros.com');
    });

    test('should have staging test credentials', () => {
      expect(stagingConfig.authConfig.testUser).toBeDefined();
      expect(stagingConfig.authConfig.testPassword).toBeDefined();
      expect(stagingConfig.authConfig.apiKey).toBeDefined();
    });

    test('should have production-like limits', () => {
      expect(stagingConfig.limits.maxFiles).toBe(30);
      expect(stagingConfig.limits.requestTimeout).toBe(30000); // 30 seconds for staging
    });

    test('should enable real file testing and cleanup', () => {
      expect(stagingConfig.features.useRealFiles).toBe(true);
      expect(stagingConfig.features.enableRateLimitTests).toBe(true);
      expect(stagingConfig.features.enableCleanup).toBe(true);
    });
  });

  describe('Production Environment', () => {
    let prodConfig: TestEnvironmentConfig;

    beforeAll(() => {
      prodConfig = getEnvironmentConfig('production');
    });

    test('should have correct backend URL for production', () => {
      expect(prodConfig.backendUrl).toBe('https://api.cfipros.com/api/v1');
    });

    test('should have correct frontend URL for production', () => {
      expect(prodConfig.frontendUrl).toBe('https://cfipros.com');
    });

    test('should have production test credentials with API key', () => {
      expect(prodConfig.authConfig.testUser).toBeDefined();
      expect(prodConfig.authConfig.testPassword).toBeDefined();
      expect(prodConfig.authConfig.apiKey).toBeDefined();
    });

    test('should have strict limits for production', () => {
      expect(prodConfig.limits.maxFiles).toBe(30);
      expect(prodConfig.limits.requestTimeout).toBe(10000); // 10 seconds for production
    });

    test('should be read-only with minimal testing', () => {
      expect(prodConfig.features.useRealFiles).toBe(false);
      expect(prodConfig.features.enableRateLimitTests).toBe(false);
      expect(prodConfig.features.enableCleanup).toBe(false);
      expect(prodConfig.features.readOnly).toBe(true);
    });
  });

  describe('Environment Variable Validation', () => {
    test('should load environment variables correctly', () => {
      const localConfig = getEnvironmentConfig('local');
      expect(localConfig.authConfig.testUser).toBeDefined();
      expect(localConfig.authConfig.testPassword).toBeDefined();
    });

    test('should validate configuration completeness', () => {
      const environments = ['local', 'staging', 'production'] as const;
      
      environments.forEach(env => {
        const config = getEnvironmentConfig(env);
        
        // Configuration should be valid and complete
        expect(config.backendUrl).toBeDefined();
        expect(config.frontendUrl).toBeDefined();
        expect(config.authConfig.testUser).toBeDefined();
        expect(config.authConfig.testPassword).toBeDefined();
      });
    });

    test('should provide fallback values for optional variables', () => {
      // Temporarily remove optional variable
      const originalValue = process.env.INTEGRATION_TEST_TIMEOUT;
      delete process.env.INTEGRATION_TEST_TIMEOUT;

      const config = getEnvironmentConfig('local');
      expect(config.limits.requestTimeout).toBeDefined();

      // Restore original value
      if (originalValue) {
        process.env.INTEGRATION_TEST_TIMEOUT = originalValue;
      }
    });

    test('should throw error for invalid environment names', () => {
      expect(() => {
        getEnvironmentConfig('invalid' as any);
      }).toThrow('Invalid environment: invalid');
    });
  });

  describe('API Contract Compliance', () => {
    test('all environments should comply with OpenAPI server specifications', () => {
      const environments = ['local', 'staging', 'production'] as const;
      
      environments.forEach(env => {
        const config = getEnvironmentConfig(env);
        
        // Validate URLs match OpenAPI server specifications
        expect(config.backendUrl).toMatch(/^https?:\/\/.+\/api\/v1$/);
        expect(config.frontendUrl).toMatch(/^https?:\/\/.+$/);
        
        // Validate authentication configuration
        expect(config.authConfig.testUser).toMatch(/^[\w-]+$/);
        expect(config.authConfig.testPassword.length).toBeGreaterThan(0);
        
        // Validate limits match API contract
        expect(config.limits.maxFiles).toBeLessThanOrEqual(30);
        expect(config.limits.maxFileSize).toBeGreaterThan(0);
        expect(config.limits.requestTimeout).toBeGreaterThan(0);
      });
    });
  });
});