/**
 * Test setup for integration configuration tests
 * Sets up required environment variables for testing
 */

// Set up test environment variables before running tests
process.env.INTEGRATION_TEST_ENV = 'local';
process.env.INTEGRATION_TEST_USER = 'test-user-local';
process.env.INTEGRATION_TEST_PASSWORD = 'test-password-123';

// Local environment variables
process.env.CLERK_PUBLISHABLE_KEY = 'pk_test_local_key_for_testing';
process.env.CLERK_SECRET_KEY = 'sk_test_local_secret_for_testing';

// Staging environment variables (for testing staging config)
process.env.STAGING_TEST_USER = 'staging-test-user';
process.env.STAGING_TEST_PASSWORD = 'staging-test-password';
process.env.STAGING_API_KEY = 'staging-api-key-for-testing';
process.env.STAGING_CLERK_PUBLISHABLE_KEY = 'pk_test_staging_key';
process.env.STAGING_CLERK_SECRET_KEY = 'sk_test_staging_secret';
process.env.STAGING_CLERK_WEBHOOK_SECRET = 'whsec_staging_webhook_secret';
process.env.STAGING_CLERK_TEST_USER_ID = 'user_staging_test_id';
process.env.STAGING_CLERK_TEST_ORG_ID = 'org_staging_test_id';

// Production environment variables (for testing production config)
process.env.PROD_TEST_USER = 'prod-readonly-user';
process.env.PROD_TEST_PASSWORD = 'prod-readonly-password';
process.env.PROD_API_KEY = 'prod-api-key-for-testing';
process.env.PROD_CLERK_PUBLISHABLE_KEY = 'pk_live_prod_key';
process.env.PROD_CLERK_SECRET_KEY = 'sk_live_prod_secret';
process.env.PROD_CLERK_WEBHOOK_SECRET = 'whsec_prod_webhook_secret';
process.env.PROD_CLERK_TEST_USER_ID = 'user_prod_test_id';