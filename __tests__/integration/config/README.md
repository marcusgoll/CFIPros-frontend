# Integration Test Configuration

This module provides comprehensive multi-environment test configuration for the CFIPros Integration Test Suite, supporting local development, staging, and production testing environments.

## Environment Setup

### Local Development
```bash
cp .env.integration.local .env.integration.local
# Edit .env.integration.local with your local configuration
```

### Staging
```bash
cp .env.integration.staging .env.integration.staging
# Edit .env.integration.staging with your staging credentials
```

### Production (Read-Only)
```bash
cp .env.integration.production .env.integration.production
# Edit .env.integration.production with your production read-only credentials
```

## Usage

### Basic Configuration
```typescript
import { getEnvironmentConfig, getCurrentEnvironment } from '@/integration/config';

// Get configuration for current environment
const config = getEnvironmentConfig(getCurrentEnvironment());

// Get configuration for specific environment
const stagingConfig = getEnvironmentConfig('staging');
```

### Credential Management
```typescript
import { credentialManager } from '@/integration/config';

// Get credentials for current environment
const credentials = credentialManager.getCredentials();

// Get Clerk credentials
const clerkCreds = credentialManager.getClerkCredentials();

// Create authentication headers
const headers = credentialManager.createAuthHeaders('staging');
```

### Complete Integration Setup
```typescript
import { getIntegrationConfig, validateTestSetup } from '@/integration/config';

// Get complete configuration
const testConfig = getIntegrationConfig('local');

// Validate setup before running tests
if (!validateTestSetup('staging')) {
  throw new Error('Staging test setup is invalid');
}
```

## Environment Variables

### Required for All Environments
- `INTEGRATION_TEST_ENV` - Environment designation (local, staging, production)

### Local Development
- `INTEGRATION_TEST_USER` - Test user for local development
- `INTEGRATION_TEST_PASSWORD` - Test password for local development
- `CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key

### Staging Environment
- `STAGING_TEST_USER` - Staging test user
- `STAGING_TEST_PASSWORD` - Staging test password
- `STAGING_API_KEY` - Staging API key
- `STAGING_CLERK_PUBLISHABLE_KEY` - Staging Clerk publishable key
- `STAGING_CLERK_SECRET_KEY` - Staging Clerk secret key
- `STAGING_CLERK_WEBHOOK_SECRET` - Staging Clerk webhook secret

### Production Environment (Read-Only)
- `PROD_TEST_USER` - Production read-only test user
- `PROD_TEST_PASSWORD` - Production read-only test password
- `PROD_API_KEY` - Production API key
- `PROD_CLERK_PUBLISHABLE_KEY` - Production Clerk publishable key
- `PROD_CLERK_SECRET_KEY` - Production Clerk secret key
- `PROD_CLERK_WEBHOOK_SECRET` - Production Clerk webhook secret

## API Contract Compliance

This configuration module ensures compliance with the OpenAPI contract specifications:

- **Backend URLs**: Match OpenAPI server specifications
- **File Limits**: Enforce 30 files per batch maximum
- **Authentication**: Support Bearer token authentication
- **Error Handling**: Consistent error response formats
- **Rate Limiting**: Respect API rate limiting configurations

## Security Features

- **Credential Isolation**: Environment-specific credential management
- **Secure Storage**: Credentials are not exposed in logs or error messages
- **Access Control**: Production environment enforces read-only operations
- **Token Management**: Automatic JWT token handling and refresh

## Testing

Run the configuration tests:
```bash
npm test -- __tests__/integration/config/environments.test.ts
npm test -- __tests__/integration/config/credentials.test.ts
```

## File Structure

```
__tests__/integration/config/
├── README.md                 # This documentation
├── index.ts                  # Main exports and utilities
├── environments.ts           # Environment configuration management
├── credentials.ts            # Secure credential management
├── environments.test.ts      # Environment configuration tests
├── credentials.test.ts       # Credential management tests
└── setup.test.ts            # Test environment variable setup
```

## Environment-Specific Features

### Local Development
- Mock file testing for faster execution
- Relaxed timeout values (60 seconds)
- No cleanup required
- Rate limiting tests disabled

### Staging Environment
- Real file testing for validation
- Production-like timeout values (30 seconds)
- Automatic test data cleanup
- Rate limiting tests enabled
- Webhook validation included

### Production Environment (Read-Only)
- Mock files only for safety
- Strict timeout values (10 seconds)
- No test data cleanup
- Rate limiting tests disabled
- Read-only operations only