/**
 * Integration test configuration export module
 * Provides centralized access to environment configs, credentials, and utilities
 * Based on the Full Integration Test Suite specification
 */

import {
  type Environment,
  type TestEnvironmentConfig,
  getEnvironmentConfig,
  getCurrentEnvironment,
  EnvironmentSwitcher,
  currentConfig,
} from './environments';

import {
  type TestCredentials,
  type ClerkTestCredentials,
  CredentialManager,
  credentialManager,
  cleanupCredentials,
  getCurrentCredentials,
  getCurrentClerkCredentials,
} from './credentials';

// Re-export types and functions
export {
  type Environment,
  type TestEnvironmentConfig,
  getEnvironmentConfig,
  getCurrentEnvironment,
  EnvironmentSwitcher,
  currentConfig,
  type TestCredentials,
  type ClerkTestCredentials,
  CredentialManager,
  credentialManager,
  cleanupCredentials,
  getCurrentCredentials,
  getCurrentClerkCredentials,
};

/**
 * Combined configuration interface for easy test setup
 */
export interface IntegrationTestConfig {
  environment: string;
  config: TestEnvironmentConfig;
  credentials: TestCredentials;
  clerkCredentials: ClerkTestCredentials;
}

/**
 * Get complete integration test configuration
 */
export function getIntegrationConfig(environment?: Environment): IntegrationTestConfig {
  const env = environment || getCurrentEnvironment();
  
  return {
    environment: env,
    config: getEnvironmentConfig(env),
    credentials: credentialManager.getCredentials(env),
    clerkCredentials: credentialManager.getClerkCredentials(env),
  };
}

/**
 * Validate complete test setup for environment
 */
export function validateTestSetup(environment?: Environment): boolean {
  try {
    const config = getIntegrationConfig(environment);
    
    // Validate configuration
    if (!config.config.backendUrl || !config.config.frontendUrl) {
      throw new Error('Missing required URLs in configuration');
    }
    
    // Validate credentials
    if (!config.credentials.username || !config.credentials.password) {
      throw new Error('Missing required authentication credentials');
    }
    
    // Validate Clerk configuration
    if (!config.clerkCredentials.publishableKey) {
      throw new Error('Missing Clerk publishable key');
    }
    
    return true;
  } catch (error) {
    console.error(`Test setup validation failed: ${error}`);
    return false;
  }
}