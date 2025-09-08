/**
 * Multi-environment test configuration for CFIPros Integration Tests
 * Supports local, staging, and production test execution
 * Based on OpenAPI contract specifications
 */

export type Environment = 'local' | 'staging' | 'production';

export interface TestEnvironmentConfig {
  backendUrl: string;
  frontendUrl: string;
  authConfig: {
    testUser: string;
    testPassword: string;
    apiKey?: string;
  };
  limits: {
    maxFiles: number;
    maxFileSize: number; // in bytes
    requestTimeout: number; // in milliseconds
  };
  features: {
    useRealFiles: boolean;
    enableRateLimitTests: boolean;
    enableCleanup: boolean;
    readOnly?: boolean;
  };
  clerkConfig?: {
    publishableKey: string;
    secretKey?: string;
    webhookSecret?: string;
  };
}

/**
 * Environment-specific configurations based on OpenAPI contract servers
 */
const environments: Record<Environment, TestEnvironmentConfig> = {
  local: {
    backendUrl: 'http://localhost:8000/api/v1',
    frontendUrl: 'http://localhost:3000',
    authConfig: {
      testUser: getEnvVar('INTEGRATION_TEST_USER', 'test-user-local'),
      testPassword: getEnvVar('INTEGRATION_TEST_PASSWORD', 'test-password-123'),
    },
    limits: {
      maxFiles: 30, // API contract max files per batch
      maxFileSize: 50 * 1024 * 1024, // 50MB
      requestTimeout: 60000, // 60 seconds for local development
    },
    features: {
      useRealFiles: false, // Use mock files for faster local testing
      enableRateLimitTests: false, // Disabled for local development
      enableCleanup: false, // No cleanup needed for mock data
    },
    clerkConfig: {
      publishableKey: getEnvVar('CLERK_PUBLISHABLE_KEY', ''),
      secretKey: getEnvVar('CLERK_SECRET_KEY', ''),
    },
  },

  staging: {
    backendUrl: 'https://cfipros-api-staging.up.railway.app/api/v1',
    frontendUrl: 'https://staging.cfipros.com',
    authConfig: {
      testUser: getEnvVar('STAGING_TEST_USER'),
      testPassword: getEnvVar('STAGING_TEST_PASSWORD'),
      apiKey: getEnvVar('STAGING_API_KEY'),
    },
    limits: {
      maxFiles: 30,
      maxFileSize: 50 * 1024 * 1024,
      requestTimeout: 30000, // 30 seconds for staging
    },
    features: {
      useRealFiles: true, // Use real files to test actual processing
      enableRateLimitTests: true, // Test rate limiting in staging
      enableCleanup: true, // Clean up test data
    },
    clerkConfig: {
      publishableKey: getEnvVar('STAGING_CLERK_PUBLISHABLE_KEY'),
      secretKey: getEnvVar('STAGING_CLERK_SECRET_KEY'),
      webhookSecret: getEnvVar('STAGING_CLERK_WEBHOOK_SECRET'),
    },
  },

  production: {
    backendUrl: 'https://api.cfipros.com/api/v1',
    frontendUrl: 'https://cfipros.com',
    authConfig: {
      testUser: getEnvVar('PROD_TEST_USER'),
      testPassword: getEnvVar('PROD_TEST_PASSWORD'),
      apiKey: getEnvVar('PROD_API_KEY'),
    },
    limits: {
      maxFiles: 30,
      maxFileSize: 50 * 1024 * 1024,
      requestTimeout: 10000, // 10 seconds for production
    },
    features: {
      useRealFiles: false, // Safer with mock files in production
      enableRateLimitTests: false, // Avoid triggering rate limits
      enableCleanup: false, // Read-only testing
      readOnly: true, // Only safe read operations
    },
    clerkConfig: {
      publishableKey: getEnvVar('PROD_CLERK_PUBLISHABLE_KEY'),
      secretKey: getEnvVar('PROD_CLERK_SECRET_KEY'),
      webhookSecret: getEnvVar('PROD_CLERK_WEBHOOK_SECRET'),
    },
  },
};

/**
 * Get environment variable with optional default value
 * Throws error if required variable is missing
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || defaultValue!;
}

/**
 * Get test configuration for specified environment
 * @param environment - Target environment (local, staging, production)
 * @returns Environment-specific test configuration
 */
export function getEnvironmentConfig(environment: Environment): TestEnvironmentConfig {
  if (!environments[environment]) {
    throw new Error(`Invalid environment: ${environment}`);
  }

  const config = { ...environments[environment] };

  // Validate required configuration
  validateEnvironmentConfig(config, environment);

  return config;
}

/**
 * Validate environment configuration completeness
 */
function validateEnvironmentConfig(config: TestEnvironmentConfig, env: Environment): void {
  const errors: string[] = [];

  // Validate URLs
  if (!config.backendUrl || !isValidUrl(config.backendUrl)) {
    errors.push(`Invalid backend URL for ${env}: ${config.backendUrl}`);
  }

  if (!config.frontendUrl || !isValidUrl(config.frontendUrl)) {
    errors.push(`Invalid frontend URL for ${env}: ${config.frontendUrl}`);
  }

  // Validate authentication
  if (!config.authConfig.testUser) {
    errors.push(`Missing test user for ${env}`);
  }

  if (!config.authConfig.testPassword) {
    errors.push(`Missing test password for ${env}`);
  }

  // Validate limits
  if (config.limits.maxFiles <= 0 || config.limits.maxFiles > 30) {
    errors.push(`Invalid max files for ${env}: ${config.limits.maxFiles}`);
  }

  if (config.limits.maxFileSize <= 0) {
    errors.push(`Invalid max file size for ${env}: ${config.limits.maxFileSize}`);
  }

  if (config.limits.requestTimeout <= 0) {
    errors.push(`Invalid request timeout for ${env}: ${config.limits.requestTimeout}`);
  }

  if (errors.length > 0) {
    throw new Error(`Environment configuration errors for ${env}:\n${errors.join('\n')}`);
  }
}

/**
 * Simple URL validation
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Get current environment from environment variable
 * Defaults to 'local' if not specified
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.INTEGRATION_TEST_ENV as Environment || 'local';
  
  if (!['local', 'staging', 'production'].includes(env)) {
    throw new Error(`Invalid INTEGRATION_TEST_ENV: ${env}. Must be: local, staging, or production`);
  }
  
  return env;
}

/**
 * Environment switcher utility for test execution
 */
export class EnvironmentSwitcher {
  private originalEnv: string | undefined;

  /**
   * Temporarily switch to specified environment
   */
  switchTo(environment: Environment): void {
    this.originalEnv = process.env.INTEGRATION_TEST_ENV;
    process.env.INTEGRATION_TEST_ENV = environment;
  }

  /**
   * Restore original environment
   */
  restore(): void {
    if (this.originalEnv) {
      process.env.INTEGRATION_TEST_ENV = this.originalEnv;
    } else {
      delete process.env.INTEGRATION_TEST_ENV;
    }
    this.originalEnv = undefined;
  }
}

/**
 * Export current configuration based on environment variable
 */
export const currentConfig = (() => {
  try {
    return getEnvironmentConfig(getCurrentEnvironment());
  } catch (error) {
    console.warn(`Failed to load environment config: ${error}`);
    // Fallback to local configuration
    return environments.local;
  }
})();