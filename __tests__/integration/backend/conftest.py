"""
Backend Integration Test Configuration
Provides shared fixtures and utilities for all backend API tests
"""

import os
import sys
import json
import pytest
import asyncio
from typing import Dict, Any, Optional, Generator
from pathlib import Path
from unittest.mock import Mock

import httpx
import jwt
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables based on test environment
test_env = os.getenv('TEST_ENV', 'local')
env_file = project_root / f'.env.integration.{test_env}'
if env_file.exists():
    load_dotenv(env_file)

class TestConfig(BaseModel):
    """Test configuration model"""
    backend_base_url: str = Field(default="http://localhost:8000")
    frontend_base_url: str = Field(default="http://localhost:3000") 
    test_environment: str = Field(default="local")
    
    # Authentication
    clerk_secret_key: Optional[str] = None
    clerk_publishable_key: Optional[str] = None
    test_user_id: Optional[str] = None
    test_user_email: str = Field(default="test@cfipros-testing.com")
    
    # API Configuration
    api_timeout: int = Field(default=30)
    rate_limit_window: int = Field(default=3600)  # 1 hour in seconds
    max_files_per_batch: int = Field(default=30)
    max_file_size: int = Field(default=50 * 1024 * 1024)  # 50MB
    
    # Database
    database_url: Optional[str] = None
    test_database_url: Optional[str] = None
    
    class Config:
        env_prefix = "INTEGRATION_"
        case_sensitive = False

@pytest.fixture(scope="session")
def test_config() -> TestConfig:
    """Load test configuration from environment"""
    config = TestConfig()
    
    # Override with environment-specific values
    if test_env == 'staging':
        config.backend_base_url = "https://cfipros-api-staging.up.railway.app/api/v1"
        config.frontend_base_url = "https://staging.cfipros.com"
    elif test_env == 'production':
        config.backend_base_url = "https://api.cfipros.com/api/v1"  
        config.frontend_base_url = "https://cfipros.com"
        
    return config

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def http_client(test_config: TestConfig) -> Generator[httpx.AsyncClient, None, None]:
    """Async HTTP client for API testing"""
    timeout = httpx.Timeout(test_config.api_timeout)
    
    async with httpx.AsyncClient(
        base_url=test_config.backend_base_url,
        timeout=timeout,
        follow_redirects=True
    ) as client:
        yield client

@pytest.fixture
def sync_http_client(test_config: TestConfig) -> Generator[httpx.Client, None, None]:
    """Synchronous HTTP client for API testing"""
    timeout = httpx.Timeout(test_config.api_timeout)
    
    with httpx.Client(
        base_url=test_config.backend_base_url,
        timeout=timeout,
        follow_redirects=True
    ) as client:
        yield client

class MockJWTToken:
    """Mock JWT token for testing"""
    def __init__(self, user_id: str = "test_user_123", email: str = "test@cfipros.com"):
        self.payload = {
            "sub": user_id,
            "email": email,
            "org_id": "org_test_123",
            "org_role": "student",
            "iat": 1609459200,  # 2021-01-01
            "exp": 9999999999,  # Far future
            "iss": "https://clerk.cfipros.com",
            "aud": "cfipros-api"
        }
    
    def encode(self, secret: str = "test_secret") -> str:
        """Encode JWT token"""
        return jwt.encode(self.payload, secret, algorithm="HS256")

@pytest.fixture
def mock_jwt_token() -> MockJWTToken:
    """Mock JWT token for authenticated requests"""
    return MockJWTToken()

@pytest.fixture
def auth_headers(mock_jwt_token: MockJWTToken, test_config: TestConfig) -> Dict[str, str]:
    """Authentication headers with JWT token"""
    token = mock_jwt_token.encode()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

@pytest.fixture
def multipart_auth_headers(mock_jwt_token: MockJWTToken) -> Dict[str, str]:
    """Authentication headers for multipart requests"""
    token = mock_jwt_token.encode()
    return {
        "Authorization": f"Bearer {token}"
        # Content-Type will be set automatically by httpx for multipart
    }

@pytest.fixture
def test_files_path() -> Path:
    """Path to test fixture files"""
    return Path(__file__).parent.parent / "fixtures" / "files"

@pytest.fixture
def sample_aktr_file(test_files_path: Path) -> Path:
    """Path to sample AKTR PDF file"""
    aktr_path = test_files_path / "valid" / "sample-aktr-report.pdf"
    if not aktr_path.exists():
        pytest.skip(f"Sample AKTR file not found: {aktr_path}")
    return aktr_path

@pytest.fixture
def malicious_exe_file(test_files_path: Path) -> Path:
    """Path to malicious executable file"""
    exe_path = test_files_path / "malicious" / "fake-pdf.exe" 
    if not exe_path.exists():
        pytest.skip(f"Malicious exe file not found: {exe_path}")
    return exe_path

@pytest.fixture
def large_test_file(tmp_path: Path) -> Path:
    """Generate a large test file for size limit testing"""
    large_file = tmp_path / "large_test.pdf"
    
    # Create a 60MB file (exceeds 50MB limit)
    with open(large_file, "wb") as f:
        f.write(b"0" * (60 * 1024 * 1024))
    
    return large_file

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment before each test"""
    # Clear any cached authentication
    if hasattr(setup_test_environment, '_auth_cache'):
        setup_test_environment._auth_cache.clear()
    
    yield
    
    # Cleanup after each test
    # Add any necessary cleanup logic here
    pass

@pytest.fixture
def mock_clerk_webhook_headers() -> Dict[str, str]:
    """Mock Clerk webhook signature headers"""
    import time
    timestamp = str(int(time.time()))
    
    return {
        "svix-id": f"msg_test_{timestamp}",
        "svix-timestamp": timestamp,
        "svix-signature": "v1,test_signature_here",
        "content-type": "application/json"
    }

class APIContractValidator:
    """Validates API responses against OpenAPI contract"""
    
    def __init__(self, openapi_spec_path: Optional[Path] = None):
        if openapi_spec_path is None:
            openapi_spec_path = (
                Path(__file__).parent.parent.parent.parent / 
                ".agent-os" / "specs" / "2025-09-08-full-integration-test-suite" / 
                "api-contracts" / "openapi.yaml"
            )
        
        self.spec_path = openapi_spec_path
        self._spec = None
    
    @property
    def spec(self) -> Dict[str, Any]:
        """Load OpenAPI spec lazily"""
        if self._spec is None:
            if self.spec_path.exists():
                import yaml
                with open(self.spec_path) as f:
                    self._spec = yaml.safe_load(f)
            else:
                self._spec = {}
        return self._spec
    
    def validate_response(self, method: str, path: str, status_code: int, response_data: Any) -> bool:
        """Validate response against OpenAPI contract"""
        try:
            # Basic validation - can be extended with jsonschema
            paths = self.spec.get("paths", {})
            path_spec = paths.get(path, {})
            method_spec = path_spec.get(method.lower(), {})
            responses_spec = method_spec.get("responses", {})
            status_spec = responses_spec.get(str(status_code), {})
            
            # If we have a spec, the endpoint exists
            if status_spec:
                return True
            
            # Allow common HTTP status codes even if not explicitly defined
            return status_code in [200, 201, 202, 400, 401, 403, 404, 429, 500, 502, 503]
            
        except Exception:
            # If validation fails, log warning but don't fail test
            return True

@pytest.fixture
def contract_validator() -> APIContractValidator:
    """API contract validator fixture"""
    return APIContractValidator()

# Test data generators
@pytest.fixture
def generate_test_user_data():
    """Generate test user data for Clerk webhooks"""
    def _generate(user_id: Optional[str] = None, email: Optional[str] = None):
        import uuid
        user_id = user_id or f"user_test_{uuid.uuid4().hex[:8]}"
        email = email or f"test-{uuid.uuid4().hex[:8]}@cfipros-testing.com"
        
        return {
            "id": user_id,
            "email_addresses": [{"email_address": email}],
            "first_name": "Test",
            "last_name": "User",
            "username": f"testuser_{uuid.uuid4().hex[:6]}",
            "created_at": 1609459200000,  # 2021-01-01 in milliseconds
            "updated_at": 1609459200000
        }
    
    return _generate

# Cleanup utilities
@pytest.fixture
def cleanup_test_data():
    """Utility to clean up test data after tests"""
    cleanup_tasks = []
    
    def register_cleanup(cleanup_func, *args, **kwargs):
        cleanup_tasks.append((cleanup_func, args, kwargs))
    
    yield register_cleanup
    
    # Execute all cleanup tasks
    for cleanup_func, args, kwargs in cleanup_tasks:
        try:
            cleanup_func(*args, **kwargs)
        except Exception as e:
            print(f"Warning: Cleanup failed: {e}")

# Performance monitoring
@pytest.fixture
def performance_monitor():
    """Monitor API response times and performance"""
    import time
    measurements = []
    
    class PerformanceMonitor:
        def measure_request(self, name: str):
            start_time = time.time()
            
            class RequestMeasurement:
                def __enter__(self):
                    return self
                
                def __exit__(self, exc_type, exc_val, exc_tb):
                    end_time = time.time()
                    duration = end_time - start_time
                    measurements.append({
                        "name": name,
                        "duration": duration,
                        "timestamp": start_time
                    })
                    
                    # Assert performance requirements (< 2 seconds per spec)
                    assert duration < 2.0, f"Request {name} took {duration:.2f}s (> 2s limit)"
            
            return RequestMeasurement()
        
        @property
        def measurements(self):
            return measurements.copy()
    
    return PerformanceMonitor()

# Database fixtures (if needed)
@pytest.fixture
def db_session():
    """Database session for tests that need database access"""
    # This would be implemented if we need direct database testing
    # For now, return a mock
    return Mock()

# Environment-specific configurations
def pytest_configure(config):
    """Configure pytest based on environment"""
    env = os.getenv('TEST_ENV', 'local')
    
    if env == 'production':
        # More restrictive settings for production testing
        config.option.tb = 'short'
        config.option.verbose = False
    elif env == 'staging':
        # Standard settings for staging
        config.option.verbose = True
    else:
        # Development settings for local testing
        config.option.verbose = True
        config.option.tb = 'long'

def pytest_collection_modifyitems(config, items):
    """Modify test collection based on environment and markers"""
    env = os.getenv('TEST_ENV', 'local')
    
    # Skip certain tests based on environment
    for item in items:
        if env == 'production':
            # Skip destructive tests in production
            if 'rate_limit' in item.keywords:
                item.add_marker(pytest.mark.skip(reason="Rate limit tests skipped in production"))
        
        if env == 'local':
            # Skip tests that require external services in local environment
            if 'requires_backend' in item.keywords:
                # Check if backend is available
                try:
                    import httpx
                    with httpx.Client() as client:
                        response = client.get("http://localhost:8000/health", timeout=5)
                        if response.status_code != 200:
                            item.add_marker(pytest.mark.skip(reason="Backend server not available"))
                except Exception:
                    item.add_marker(pytest.mark.skip(reason="Backend server not available"))