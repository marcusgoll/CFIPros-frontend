/**
 * Test setup for test data fixtures
 * Sets minimal environment variables needed for testing
 */

// Set minimal environment variables for local testing
process.env.INTEGRATION_TEST_USER = 'test-user-local';
process.env.INTEGRATION_TEST_PASSWORD = 'test-password-123';
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_testing';
process.env.CLERK_SECRET_KEY = 'sk_test_testing';

// Staging environment variables with defaults for testing
process.env.STAGING_TEST_USER = 'staging-test-user';
process.env.STAGING_TEST_PASSWORD = 'staging-test-password';
process.env.STAGING_API_KEY = 'staging-api-key';
process.env.STAGING_CLERK_PUBLISHABLE_KEY = 'pk_staging_testing';
process.env.STAGING_CLERK_SECRET_KEY = 'sk_staging_testing';
process.env.STAGING_CLERK_WEBHOOK_SECRET = 'whsec_staging_testing';

// Production environment variables with defaults for testing
process.env.PROD_TEST_USER = 'prod-test-user';
process.env.PROD_TEST_PASSWORD = 'prod-test-password';
process.env.PROD_API_KEY = 'prod-api-key';
process.env.PROD_CLERK_PUBLISHABLE_KEY = 'pk_prod_testing';
process.env.PROD_CLERK_SECRET_KEY = 'sk_prod_testing';
process.env.PROD_CLERK_WEBHOOK_SECRET = 'whsec_prod_testing';