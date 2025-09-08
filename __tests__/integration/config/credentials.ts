/**
 * Secure test credential management system for integration tests
 * Handles authentication tokens, API keys, and Clerk configuration
 * Based on environment-specific security requirements
 */

import { Environment, getCurrentEnvironment } from './environments';

export interface TestCredentials {
  username: string;
  password: string;
  apiKey?: string;
  clerkToken?: string;
  organizationId?: string;
}

export interface ClerkTestCredentials {
  publishableKey: string;
  secretKey?: string;
  webhookSecret?: string;
  testUserId?: string;
  testOrgId?: string;
}

/**
 * Secure credential manager with environment-specific access
 */
export class CredentialManager {
  private static instance: CredentialManager;
  private credentials: Map<Environment, TestCredentials> = new Map();
  private clerkCredentials: Map<Environment, ClerkTestCredentials> = new Map();

  private constructor() {
    this.loadCredentials();
  }

  public static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Load credentials from environment variables
   */
  private loadCredentials(): void {
    // Local development credentials
    this.credentials.set('local', {
      username: this.getSecureEnvVar('LOCAL_TEST_USER', 'test-user-local'),
      password: this.getSecureEnvVar('LOCAL_TEST_PASSWORD', 'test-password-123'),
    });

    this.clerkCredentials.set('local', {
      publishableKey: this.getSecureEnvVar('CLERK_PUBLISHABLE_KEY', ''),
      secretKey: this.getSecureEnvVar('CLERK_SECRET_KEY', ''),
    });

    // Staging credentials
    this.credentials.set('staging', {
      username: this.getSecureEnvVar('STAGING_TEST_USER'),
      password: this.getSecureEnvVar('STAGING_TEST_PASSWORD'),
      apiKey: this.getSecureEnvVar('STAGING_API_KEY'),
    });

    this.clerkCredentials.set('staging', {
      publishableKey: this.getSecureEnvVar('STAGING_CLERK_PUBLISHABLE_KEY'),
      secretKey: this.getSecureEnvVar('STAGING_CLERK_SECRET_KEY'),
      webhookSecret: this.getSecureEnvVar('STAGING_CLERK_WEBHOOK_SECRET'),
      testUserId: this.getSecureEnvVar('STAGING_CLERK_TEST_USER_ID', ''),
      testOrgId: this.getSecureEnvVar('STAGING_CLERK_TEST_ORG_ID', ''),
    });

    // Production credentials (read-only)
    this.credentials.set('production', {
      username: this.getSecureEnvVar('PROD_TEST_USER'),
      password: this.getSecureEnvVar('PROD_TEST_PASSWORD'),
      apiKey: this.getSecureEnvVar('PROD_API_KEY'),
    });

    this.clerkCredentials.set('production', {
      publishableKey: this.getSecureEnvVar('PROD_CLERK_PUBLISHABLE_KEY'),
      secretKey: this.getSecureEnvVar('PROD_CLERK_SECRET_KEY'),
      webhookSecret: this.getSecureEnvVar('PROD_CLERK_WEBHOOK_SECRET'),
      testUserId: this.getSecureEnvVar('PROD_CLERK_TEST_USER_ID'),
    });
  }

  /**
   * Get secure environment variable with validation
   */
  private getSecureEnvVar(name: string, defaultValue?: string): string {
    const value = process.env[name];
    
    if (!value && !defaultValue) {
      throw new Error(`Missing required secure environment variable: ${name}`);
    }
    
    return value || defaultValue!;
  }

  /**
   * Get test credentials for specified environment
   */
  public getCredentials(environment?: Environment): TestCredentials {
    const env = environment || getCurrentEnvironment();
    const creds = this.credentials.get(env);
    
    if (!creds) {
      throw new Error(`No credentials configured for environment: ${env}`);
    }
    
    return { ...creds }; // Return a copy to prevent mutation
  }

  /**
   * Get Clerk credentials for specified environment
   */
  public getClerkCredentials(environment?: Environment): ClerkTestCredentials {
    const env = environment || getCurrentEnvironment();
    const creds = this.clerkCredentials.get(env);
    
    if (!creds) {
      throw new Error(`No Clerk credentials configured for environment: ${env}`);
    }
    
    return { ...creds }; // Return a copy to prevent mutation
  }

  /**
   * Validate that all required credentials are available
   */
  public validateCredentials(environment?: Environment): boolean {
    try {
      const env = environment || getCurrentEnvironment();
      const creds = this.getCredentials(env);
      const clerkCreds = this.getClerkCredentials(env);

      // Basic validation
      if (!creds.username || !creds.password) {
        throw new Error(`Missing username or password for ${env}`);
      }

      if (!clerkCreds.publishableKey) {
        throw new Error(`Missing Clerk publishable key for ${env}`);
      }

      // Environment-specific validation
      if (env !== 'local' && !creds.apiKey) {
        throw new Error(`Missing API key for ${env}`);
      }

      if (env !== 'local' && !clerkCreds.secretKey) {
        throw new Error(`Missing Clerk secret key for ${env}`);
      }

      return true;
    } catch (error) {
      console.error(`Credential validation failed: ${error}`);
      return false;
    }
  }

  /**
   * Create authentication headers for API requests
   */
  public createAuthHeaders(environment?: Environment): Record<string, string> {
    const creds = this.getCredentials(environment);
    const headers: Record<string, string> = {};

    if (creds.apiKey) {
      headers['Authorization'] = `Bearer ${creds.apiKey}`;
    }

    if (creds.clerkToken) {
      headers['Authorization'] = `Bearer ${creds.clerkToken}`;
    }

    return headers;
  }

  /**
   * Get basic auth credentials for testing
   */
  public getBasicAuthString(environment?: Environment): string {
    const creds = this.getCredentials(environment);
    const encoded = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Securely clear all credentials from memory
   */
  public clearCredentials(): void {
    // Clear credential maps
    this.credentials.forEach((creds, env) => {
      if (creds.password) {
        // Overwrite password with zeros (basic security measure)
        (creds as any).password = '0'.repeat(creds.password.length);
      }
      if (creds.apiKey) {
        (creds as any).apiKey = '0'.repeat(creds.apiKey.length);
      }
    });
    
    this.credentials.clear();
    this.clerkCredentials.clear();
  }

  /**
   * Create test user session for Clerk authentication
   */
  public async createTestSession(environment?: Environment): Promise<string | null> {
    const env = environment || getCurrentEnvironment();
    const clerkCreds = this.getClerkCredentials(env);

    if (!clerkCreds.secretKey) {
      console.warn(`No Clerk secret key available for ${env}, skipping session creation`);
      return null;
    }

    try {
      // This would integrate with Clerk's API to create a test session
      // For now, return a mock token format
      const testToken = `test_session_${env}_${Date.now()}`;
      console.log(`Created test session for ${env}: ${testToken.substring(0, 20)}...`);
      return testToken;
    } catch (error) {
      console.error(`Failed to create test session for ${env}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const credentialManager = CredentialManager.getInstance();

/**
 * Cleanup utility for test teardown
 */
export function cleanupCredentials(): void {
  credentialManager.clearCredentials();
}

/**
 * Helper function to get current environment credentials
 */
export function getCurrentCredentials(): TestCredentials {
  return credentialManager.getCredentials();
}

/**
 * Helper function to get current Clerk credentials
 */
export function getCurrentClerkCredentials(): ClerkTestCredentials {
  return credentialManager.getClerkCredentials();
}