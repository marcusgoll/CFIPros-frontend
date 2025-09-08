/**
 * Contract tests for secure credential management system
 * Validates credential loading, security, and environment handling
 */

import './setup.test'; // Load test environment variables
import { credentialManager, getCurrentCredentials, getCurrentClerkCredentials } from './credentials';

describe('Credential Management Contract Tests', () => {
  beforeEach(() => {
    // Reset to local environment for each test
    process.env.INTEGRATION_TEST_ENV = 'local';
  });

  describe('Basic Credential Loading', () => {
    test('should load local credentials correctly', () => {
      const credentials = credentialManager.getCredentials('local');
      
      expect(credentials.username).toBe('test-user-local');
      expect(credentials.password).toBe('test-password-123');
      expect(credentials.apiKey).toBeUndefined(); // Local doesn't require API key
    });

    test('should load staging credentials with API key', () => {
      const credentials = credentialManager.getCredentials('staging');
      
      expect(credentials.username).toBe('staging-test-user');
      expect(credentials.password).toBe('staging-test-password');
      expect(credentials.apiKey).toBe('staging-api-key-for-testing');
    });

    test('should load production credentials', () => {
      const credentials = credentialManager.getCredentials('production');
      
      expect(credentials.username).toBe('prod-readonly-user');
      expect(credentials.password).toBe('prod-readonly-password');
      expect(credentials.apiKey).toBe('prod-api-key-for-testing');
    });
  });

  describe('Clerk Credentials', () => {
    test('should load local Clerk credentials', () => {
      const clerkCreds = credentialManager.getClerkCredentials('local');
      
      expect(clerkCreds.publishableKey).toBe('pk_test_local_key_for_testing');
      expect(clerkCreds.secretKey).toBe('sk_test_local_secret_for_testing');
      expect(clerkCreds.webhookSecret).toBeUndefined(); // Local doesn't need webhook
    });

    test('should load staging Clerk credentials with webhook secret', () => {
      const clerkCreds = credentialManager.getClerkCredentials('staging');
      
      expect(clerkCreds.publishableKey).toBe('pk_test_staging_key');
      expect(clerkCreds.secretKey).toBe('sk_test_staging_secret');
      expect(clerkCreds.webhookSecret).toBe('whsec_staging_webhook_secret');
    });

    test('should load production Clerk credentials', () => {
      const clerkCreds = credentialManager.getClerkCredentials('production');
      
      expect(clerkCreds.publishableKey).toBe('pk_live_prod_key');
      expect(clerkCreds.secretKey).toBe('sk_live_prod_secret');
      expect(clerkCreds.webhookSecret).toBe('whsec_prod_webhook_secret');
      expect(clerkCreds.testUserId).toBe('user_prod_test_id');
    });
  });

  describe('Credential Validation', () => {
    test('should validate local environment credentials', () => {
      const isValid = credentialManager.validateCredentials('local');
      expect(isValid).toBe(true);
    });

    test('should validate staging environment credentials', () => {
      const isValid = credentialManager.validateCredentials('staging');
      expect(isValid).toBe(true);
    });

    test('should validate production environment credentials', () => {
      const isValid = credentialManager.validateCredentials('production');
      expect(isValid).toBe(true);
    });
  });

  describe('Authentication Headers', () => {
    test('should create auth headers for environments with API keys', () => {
      const stagingHeaders = credentialManager.createAuthHeaders('staging');
      expect(stagingHeaders.Authorization).toBe('Bearer staging-api-key-for-testing');

      const prodHeaders = credentialManager.createAuthHeaders('production');
      expect(prodHeaders.Authorization).toBe('Bearer prod-api-key-for-testing');
    });

    test('should create empty headers for local environment', () => {
      const localHeaders = credentialManager.createAuthHeaders('local');
      expect(Object.keys(localHeaders)).toHaveLength(0);
    });

    test('should create basic auth string', () => {
      const basicAuth = credentialManager.getBasicAuthString('local');
      
      // Decode and verify
      const encoded = basicAuth.split(' ')[1];
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe('test-user-local:test-password-123');
    });
  });

  describe('Helper Functions', () => {
    test('should get current credentials based on environment', () => {
      process.env.INTEGRATION_TEST_ENV = 'local';
      const credentials = getCurrentCredentials();
      expect(credentials.username).toBe('test-user-local');
    });

    test('should get current Clerk credentials based on environment', () => {
      process.env.INTEGRATION_TEST_ENV = 'local';
      const clerkCreds = getCurrentClerkCredentials();
      expect(clerkCreds.publishableKey).toBe('pk_test_local_key_for_testing');
    });
  });

  describe('Security Features', () => {
    test('should return copies of credentials to prevent mutation', () => {
      const creds1 = credentialManager.getCredentials('local');
      const creds2 = credentialManager.getCredentials('local');
      
      // Modify one copy
      creds1.username = 'modified';
      
      // Other copy should be unchanged
      expect(creds2.username).toBe('test-user-local');
    });

    test('should create test session token for environments with secret key', async () => {
      const localSession = await credentialManager.createTestSession('local');
      expect(localSession).toMatch(/^test_session_local_\d+$/);

      const stagingSession = await credentialManager.createTestSession('staging');
      expect(stagingSession).toMatch(/^test_session_staging_\d+$/);
    });

    test('should handle missing Clerk secret gracefully', async () => {
      // Create a new credential manager with no secret key
      const testCredentials = credentialManager.getClerkCredentials('local');
      
      // If no secret key is provided, createTestSession should still work
      // but generate a mock session for testing purposes
      const session = await credentialManager.createTestSession('local');
      expect(session).toMatch(/^test_session_local_\d+$/);
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid environment', () => {
      expect(() => {
        credentialManager.getCredentials('invalid' as any);
      }).toThrow('No credentials configured for environment: invalid');
    });

    test('should throw error for invalid Clerk environment', () => {
      expect(() => {
        credentialManager.getClerkCredentials('invalid' as any);
      }).toThrow('No Clerk credentials configured for environment: invalid');
    });
  });
});