# Backend Integration Tests

This directory contains comprehensive integration tests for the CFIPros backend API, implementing contract-driven testing with multi-environment support.

## Overview

The backend integration test suite validates:

- **API Contract Compliance** - All endpoints match OpenAPI specifications
- **Authentication & Authorization** - Clerk JWT token handling and user management
- **File Processing Workflows** - Upload, extraction, and results retrieval
- **Security Validation** - Malicious file rejection and rate limiting
- **Performance Requirements** - Response times under 2 seconds
- **Error Handling** - Consistent error formats and proper status codes

## Quick Start

### 1. Install Dependencies

```bash
# Install Python test dependencies
python __tests__/integration/backend/run_tests.py --install-deps

# Or manually with pip
pip install -r __tests__/integration/backend/requirements.txt
```

### 2. Configure Environment

Create environment-specific configuration files:

```bash
# Local development (optional)
.env.integration.local

# Staging environment
.env.integration.staging

# Production environment (read-only tests)
.env.integration.production
```

### 3. Run Tests

```bash
# Quick health check
python __tests__/integration/backend/run_tests.py --env local --health-check

# Contract tests against staging
python __tests__/integration/backend/run_tests.py --env staging --contract-tests

# All tests (excluding slow ones)
python __tests__/integration/backend/run_tests.py --env local --all
```

## Test Structure

```
backend/
├── conftest.py              # Pytest configuration and shared fixtures
├── base_test.py             # Base classes for different test patterns
├── database.py              # Database testing utilities and mocks
├── requirements.txt         # Python dependencies
├── pytest.ini              # Pytest configuration
├── pyproject.toml          # Project metadata and tool configuration
├── run_tests.py            # Test execution orchestrator
└── tests/
    ├── test_file_extraction.py    # File upload/processing tests
    ├── test_authentication.py     # Auth and JWT token tests
    └── test_backend_health.py     # Health checks and accessibility
```

## Test Categories

### Contract Tests (`-m contract`)
Validate API responses match OpenAPI contract specifications:
- Request/response schema validation
- HTTP status code compliance
- Error response format consistency

```bash
python run_tests.py --env staging --contract-tests
```

### Authentication Tests (`-m auth`)
Test Clerk authentication integration:
- JWT token validation and refresh
- User lifecycle webhooks
- Organization-based access control
- Session management

```bash
python run_tests.py --env local --auth-tests
```

### Security Tests (`-m security`)
Validate security controls and edge cases:
- Malicious file upload prevention
- Path traversal attack prevention
- Rate limiting enforcement
- Concurrent request handling

```bash
python run_tests.py --env staging --security-tests
```

### Performance Tests (`-m performance`)
Ensure response time requirements are met:
- < 2 second API response times
- Health check under 1 second
- Performance regression detection

```bash
pytest -m performance --env local
```

## Environment Configuration

### Local Development
- **Backend URL**: `http://localhost:8000`
- **Test Database**: Optional SQLite/PostgreSQL
- **Authentication**: Mock JWT tokens
- **Rate Limiting**: Disabled for development

### Staging Environment
- **Backend URL**: `https://cfipros-api-staging.up.railway.app/api/v1`
- **Test Database**: Staging database with transaction rollbacks
- **Authentication**: Real Clerk integration
- **Rate Limiting**: Enabled (reduced limits)

### Production Environment
- **Backend URL**: `https://api.cfipros.com/api/v1`
- **Test Database**: Read-only operations only
- **Authentication**: Production Clerk (read-only tokens)
- **Rate Limiting**: Full enforcement (tests may skip)

## Key Features

### Multi-Environment Support
```bash
# Local development
python run_tests.py --env local

# Staging validation
python run_tests.py --env staging

# Production health checks
python run_tests.py --env production --health-check
```

### Flexible Test Execution
```bash
# Specific test file
pytest test_file_extraction.py -v

# Specific test markers
pytest -m "contract and not slow" -v

# Custom pytest options
python run_tests.py --env staging -v --tb=short --maxfail=5
```

### Performance Monitoring
All tests include performance tracking with automatic assertions:
- Response time validation
- Performance regression alerts
- Detailed timing reports

### Database Testing
- Transaction-based isolation
- Mock database fallback
- Test data cleanup automation
- Multi-database support (PostgreSQL, MySQL, SQLite)

## Base Test Classes

### `BaseAPITest`
Core functionality for all API tests:
- HTTP request/response handling
- Performance timing and validation
- Error response assertion helpers

### `FileExtractionTestBase`
File upload and processing workflows:
- Single and batch file uploads
- Results polling and validation
- File type and size validation

### `AuthenticationTestBase`
Authentication and authorization testing:
- JWT token lifecycle management
- Clerk webhook processing
- Organization access control

### `SecurityTestBase`
Security validation patterns:
- Malicious file detection
- Path traversal prevention
- Rate limiting enforcement

## Common Usage Patterns

### Full Test Suite
```bash
# Complete validation (recommended for CI/CD)
python run_tests.py --env staging --all --slow
```

### Development Workflow
```bash
# Quick feedback during development
python run_tests.py --env local --health-check
python run_tests.py --env local --contract-tests
```

### Pre-deployment Validation
```bash
# Staging environment validation
python run_tests.py --env staging --all
python run_tests.py --env staging --security-tests
```

### Production Monitoring
```bash
# Production health monitoring (read-only)
python run_tests.py --env production --health-check
python run_tests.py --env production --contract-tests
```

## Test Configuration

### Pytest Markers
- `unit` - Unit tests
- `integration` - Integration tests
- `contract` - API contract tests
- `auth` - Authentication tests
- `security` - Security tests
- `rate_limit` - Rate limiting tests
- `slow` - Long-running tests (>5s)
- `requires_backend` - Needs backend server
- `requires_database` - Needs database connection
- `clerk_integration` - Clerk auth integration
- `performance` - Performance tests

### Environment Variables
```bash
# Test environment selection
TEST_ENV=local|staging|production

# Backend configuration
INTEGRATION_BACKEND_BASE_URL=https://api.cfipros.com/api/v1

# Authentication (staging/production)
STAGING_CLERK_SECRET_KEY=sk_staging_...
PROD_CLERK_SECRET_KEY=sk_prod_...

# Database (optional)
INTEGRATION_DATABASE_URL=postgresql://...
INTEGRATION_TEST_DATABASE_URL=postgresql://test_db
```

### Coverage Requirements
- **Minimum Coverage**: 80% (enforced by pytest-cov)
- **Contract Compliance**: 100% of defined endpoints
- **Critical Paths**: Authentication, file processing, error handling

## Troubleshooting

### Backend Connection Issues
```bash
# Check backend availability
python run_tests.py --env local --health-check

# Verify environment configuration
echo $INTEGRATION_BACKEND_BASE_URL
```

### Authentication Failures
```bash
# Test auth endpoints specifically
python run_tests.py --env staging --auth-tests -v

# Check JWT token configuration
pytest test_authentication.py::TestJWTTokenManagement -v
```

### Performance Issues
```bash
# Run performance tests with detailed output
pytest -m performance --env staging -v -s

# Monitor response times
pytest test_backend_health.py::TestBackendPerformance -v
```

### Database Issues
```bash
# Test with mock database
TEST_ENV=local pytest test_*.py -v

# Verify database connection
pytest --collect-only -q  # Should not fail on database connection
```

## Contributing

### Adding New Tests
1. Inherit from appropriate base class (`BaseAPITest`, `FileExtractionTestBase`, etc.)
2. Add proper pytest markers
3. Include performance assertions
4. Add contract compliance validation
5. Update this README with new test categories

### Test Data Management
- Use fixtures from `conftest.py` for shared test data
- Create test data in `setUp` methods, clean up in `tearDown`
- Use database transactions for isolation
- Mock external services (Clerk webhooks, file storage)

### Environment Support
- Test against multiple environments during development
- Use environment-specific configurations appropriately
- Document any environment-specific test behaviors
- Ensure tests are safe for production environments

## Integration with CI/CD

### GitHub Actions Integration
```yaml
- name: Run Backend Integration Tests
  run: |
    python __tests__/integration/backend/run_tests.py --install-deps
    python __tests__/integration/backend/run_tests.py --env staging --all
```

### Quality Gates
- All contract tests must pass
- Performance requirements must be met
- Security tests must pass (non-production)
- Minimum 80% code coverage

The backend integration test suite provides comprehensive validation of the CFIPros API, ensuring reliability, security, and performance across all deployment environments.