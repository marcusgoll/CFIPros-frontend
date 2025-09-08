"""
Base Test Classes for Backend Integration Testing
Provides common patterns and utilities for API endpoint testing
"""

import json
import time
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
from unittest.mock import Mock

import httpx
import pytest
from pydantic import BaseModel, ValidationError

class APIResponse(BaseModel):
    """Structured API response model"""
    status_code: int
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    headers: Dict[str, str] = {}
    duration: float = 0.0

class BaseAPITest(ABC):
    """Base class for all API endpoint tests"""
    
    def __init__(self):
        self.base_url = ""
        self.auth_headers = {}
        self.performance_threshold = 2.0  # 2 seconds per spec
    
    async def make_request(
        self,
        client: httpx.AsyncClient,
        method: str,
        endpoint: str,
        headers: Optional[Dict[str, str]] = None,
        data: Optional[Union[Dict, str]] = None,
        files: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None
    ) -> APIResponse:
        """Make HTTP request with timing and error handling"""
        
        # Merge headers
        request_headers = {**self.auth_headers}
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                response = await client.get(
                    endpoint, 
                    headers=request_headers, 
                    params=params,
                    timeout=timeout
                )
            elif method.upper() == "POST":
                if files:
                    # Multipart form data
                    response = await client.post(
                        endpoint,
                        headers=request_headers,
                        files=files,
                        data=data,
                        timeout=timeout
                    )
                else:
                    # JSON data
                    response = await client.post(
                        endpoint,
                        headers=request_headers,
                        json=data,
                        timeout=timeout
                    )
            elif method.upper() == "PUT":
                response = await client.put(
                    endpoint,
                    headers=request_headers,
                    json=data,
                    timeout=timeout
                )
            elif method.upper() == "DELETE":
                response = await client.delete(
                    endpoint,
                    headers=request_headers,
                    timeout=timeout
                )
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            duration = time.time() - start_time
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except (json.JSONDecodeError, ValueError):
                response_data = {"raw": response.text}
            
            return APIResponse(
                status_code=response.status_code,
                data=response_data,
                headers=dict(response.headers),
                duration=duration
            )
            
        except httpx.TimeoutException:
            return APIResponse(
                status_code=408,
                error="Request timeout",
                duration=time.time() - start_time
            )
        except httpx.ConnectError:
            return APIResponse(
                status_code=503,
                error="Connection failed",
                duration=time.time() - start_time
            )
        except Exception as e:
            return APIResponse(
                status_code=500,
                error=f"Request failed: {str(e)}",
                duration=time.time() - start_time
            )

    def assert_response_time(self, response: APIResponse, max_seconds: Optional[float] = None):
        """Assert response time meets performance requirements"""
        threshold = max_seconds or self.performance_threshold
        assert response.duration < threshold, (
            f"Response took {response.duration:.2f}s (exceeds {threshold}s threshold)"
        )
    
    def assert_success_response(self, response: APIResponse, expected_status: int = 200):
        """Assert successful API response"""
        assert response.status_code == expected_status, (
            f"Expected status {expected_status}, got {response.status_code}. "
            f"Error: {response.error}, Data: {response.data}"
        )
        assert response.data is not None, "Response data should not be None"
        assert "error" not in response.data or response.data["error"] is None
    
    def assert_error_response(self, response: APIResponse, expected_status: int, expected_error_code: Optional[str] = None):
        """Assert error API response"""
        assert response.status_code == expected_status, (
            f"Expected status {expected_status}, got {response.status_code}"
        )
        
        if response.data:
            assert "error" in response.data, "Error response should contain 'error' field"
            
            if expected_error_code:
                assert response.data.get("code") == expected_error_code, (
                    f"Expected error code {expected_error_code}, got {response.data.get('code')}"
                )

class FileExtractionTestBase(BaseAPITest):
    """Base class for file extraction endpoint tests"""
    
    EXTRACT_ENDPOINT = "/api/v1/extractor/extract"
    RESULTS_ENDPOINT = "/api/v1/extractor/results"
    
    def __init__(self):
        super().__init__()
        self.valid_file_types = ["application/pdf", "image/jpeg", "image/png"]
        self.invalid_file_types = ["application/x-msdownload", "application/octet-stream"]
    
    async def upload_file(
        self,
        client: httpx.AsyncClient,
        file_path: Path,
        mime_type: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """Upload a single file for extraction"""
        
        if not file_path.exists():
            raise FileNotFoundError(f"Test file not found: {file_path}")
        
        mime_type = mime_type or "application/pdf"
        
        with open(file_path, "rb") as f:
            files = {"files": (file_path.name, f, mime_type)}
            
            return await self.make_request(
                client=client,
                method="POST",
                endpoint=self.EXTRACT_ENDPOINT,
                files=files,
                headers=headers
            )
    
    async def upload_multiple_files(
        self,
        client: httpx.AsyncClient,
        file_paths: List[Path],
        mime_type: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """Upload multiple files for batch extraction"""
        
        mime_type = mime_type or "application/pdf"
        files = []
        
        for file_path in file_paths:
            if not file_path.exists():
                raise FileNotFoundError(f"Test file not found: {file_path}")
            
            with open(file_path, "rb") as f:
                files.append(("files", (file_path.name, f.read(), mime_type)))
        
        return await self.make_request(
            client=client,
            method="POST", 
            endpoint=self.EXTRACT_ENDPOINT,
            files=dict(files),
            headers=headers
        )
    
    async def get_extraction_results(
        self,
        client: httpx.AsyncClient,
        batch_id: str,
        headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """Get extraction results for a batch"""
        
        return await self.make_request(
            client=client,
            method="GET",
            endpoint=f"{self.RESULTS_ENDPOINT}/{batch_id}",
            headers=headers
        )
    
    def assert_extraction_success(self, response: APIResponse):
        """Assert successful extraction initiation"""
        self.assert_success_response(response, 202)
        
        data = response.data
        assert "batch_id" in data, "Response should contain batch_id"
        assert "status" in data, "Response should contain status"
        assert data["status"] == "processing", "Status should be 'processing'"
        assert "estimated_completion" in data, "Response should contain estimated_completion"
    
    def assert_extraction_results(self, response: APIResponse):
        """Assert valid extraction results"""
        self.assert_success_response(response, 200)
        
        data = response.data
        assert "batch_id" in data, "Results should contain batch_id"
        assert "status" in data, "Results should contain status"
        assert "results" in data, "Results should contain results array"
        assert isinstance(data["results"], list), "Results should be a list"

class AuthenticationTestBase(BaseAPITest):
    """Base class for authentication-related tests"""
    
    AUTH_ENDPOINTS = {
        "session": "/api/v1/auth/session",
        "refresh": "/api/v1/auth/refresh", 
        "webhook": "/api/v1/auth/clerk/webhook",
        "status": "/api/v1/auth/status"
    }
    
    def __init__(self):
        super().__init__()
        self.test_user_id = "user_test_123"
        self.test_org_id = "org_test_123"
    
    async def test_authenticated_endpoint(
        self,
        client: httpx.AsyncClient,
        endpoint: str,
        method: str = "GET",
        headers: Optional[Dict[str, str]] = None,
        expect_auth_required: bool = True
    ) -> tuple[APIResponse, APIResponse]:
        """Test endpoint with and without authentication"""
        
        # Test without auth
        no_auth_response = await self.make_request(
            client=client,
            method=method,
            endpoint=endpoint,
            headers=headers
        )
        
        # Test with auth
        auth_headers = {**self.auth_headers}
        if headers:
            auth_headers.update(headers)
            
        auth_response = await self.make_request(
            client=client,
            method=method,
            endpoint=endpoint,
            headers=auth_headers
        )
        
        if expect_auth_required:
            self.assert_error_response(no_auth_response, 401)
        
        return no_auth_response, auth_response
    
    def create_webhook_payload(self, event_type: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create Clerk webhook payload"""
        return {
            "type": event_type,
            "data": user_data,
            "object": "event",
            "event_attributes": {
                "http_request": {
                    "client_ip": "127.0.0.1"
                }
            }
        }

class RateLimitTestBase(BaseAPITest):
    """Base class for rate limiting tests"""
    
    def __init__(self):
        super().__init__()
        self.rate_limit_threshold = 10  # 10 requests per hour per spec
        self.rate_limit_window = 3600   # 1 hour in seconds
    
    async def test_rate_limit_enforcement(
        self,
        client: httpx.AsyncClient,
        endpoint: str,
        method: str = "POST",
        request_data: Optional[Dict] = None,
        files: Optional[Dict] = None,
        expected_limit: Optional[int] = None
    ) -> List[APIResponse]:
        """Test rate limiting by making multiple requests"""
        
        limit = expected_limit or self.rate_limit_threshold
        responses = []
        
        # Make requests up to and beyond the limit
        for i in range(limit + 2):
            response = await self.make_request(
                client=client,
                method=method,
                endpoint=endpoint,
                data=request_data,
                files=files,
                headers=self.auth_headers
            )
            responses.append(response)
            
            # Small delay between requests
            time.sleep(0.1)
        
        return responses
    
    def assert_rate_limit_exceeded(self, responses: List[APIResponse], limit: Optional[int] = None):
        """Assert that rate limiting is properly enforced"""
        limit = limit or self.rate_limit_threshold
        
        # First N requests should succeed
        for i in range(min(len(responses), limit)):
            assert responses[i].status_code != 429, (
                f"Request {i+1} was rate limited unexpectedly"
            )
        
        # Subsequent requests should be rate limited
        for i in range(limit, len(responses)):
            self.assert_error_response(responses[i], 429, "RATE_LIMIT_EXCEEDED")

class SecurityTestBase(BaseAPITest):
    """Base class for security and malicious content tests"""
    
    MALICIOUS_EXTENSIONS = [".exe", ".bat", ".sh", ".scr", ".cmd", ".com"]
    SAFE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"]
    
    def __init__(self):
        super().__init__()
        self.max_file_size = 50 * 1024 * 1024  # 50MB per spec
    
    async def test_malicious_file_rejection(
        self,
        client: httpx.AsyncClient,
        malicious_file_path: Path,
        endpoint: str = "/api/v1/extractor/extract"
    ) -> APIResponse:
        """Test that malicious files are properly rejected"""
        
        return await self.make_request(
            client=client,
            method="POST",
            endpoint=endpoint,
            files={"files": open(malicious_file_path, "rb")},
            headers=self.auth_headers
        )
    
    def assert_malicious_file_rejected(self, response: APIResponse):
        """Assert malicious file is properly rejected"""
        self.assert_error_response(response, 400, "INVALID_FILE_TYPE")
        
        assert response.data, "Error response should contain data"
        error_msg = response.data.get("error", "").lower()
        assert any(word in error_msg for word in ["invalid", "file", "type", "not allowed"]), (
            f"Error message should indicate file type rejection: {response.data}"
        )

class ContractComplianceTestBase(BaseAPITest):
    """Base class for API contract compliance tests"""
    
    def __init__(self, contract_validator):
        super().__init__()
        self.validator = contract_validator
    
    def assert_contract_compliance(
        self,
        response: APIResponse,
        method: str,
        endpoint: str
    ):
        """Assert response complies with OpenAPI contract"""
        
        is_compliant = self.validator.validate_response(
            method=method,
            path=endpoint,
            status_code=response.status_code,
            response_data=response.data
        )
        
        assert is_compliant, (
            f"Response does not comply with API contract. "
            f"Method: {method}, Endpoint: {endpoint}, "
            f"Status: {response.status_code}, Data: {response.data}"
        )
    
    async def test_endpoint_contract_compliance(
        self,
        client: httpx.AsyncClient,
        method: str,
        endpoint: str,
        test_cases: List[Dict[str, Any]]
    ) -> List[APIResponse]:
        """Test multiple scenarios for contract compliance"""
        
        responses = []
        
        for case in test_cases:
            response = await self.make_request(
                client=client,
                method=method,
                endpoint=endpoint,
                headers=case.get("headers", self.auth_headers),
                data=case.get("data"),
                files=case.get("files"),
                params=case.get("params")
            )
            
            responses.append(response)
            
            # Assert contract compliance for each response
            self.assert_contract_compliance(response, method, endpoint)
        
        return responses

class PerformanceTestBase(BaseAPITest):
    """Base class for performance testing"""
    
    def __init__(self):
        super().__init__()
        self.performance_benchmarks = {
            "fast": 0.5,      # Fast operations < 500ms
            "normal": 2.0,    # Normal operations < 2s (spec requirement)
            "slow": 10.0      # Slow operations < 10s (file processing)
        }
    
    async def benchmark_endpoint(
        self,
        client: httpx.AsyncClient,
        endpoint: str,
        method: str = "GET",
        iterations: int = 5,
        expected_performance: str = "normal"
    ) -> List[APIResponse]:
        """Benchmark endpoint performance over multiple iterations"""
        
        responses = []
        threshold = self.performance_benchmarks[expected_performance]
        
        for i in range(iterations):
            response = await self.make_request(
                client=client,
                method=method,
                endpoint=endpoint,
                headers=self.auth_headers
            )
            responses.append(response)
            
            # Assert performance for each request
            self.assert_response_time(response, threshold)
        
        return responses
    
    def calculate_performance_stats(self, responses: List[APIResponse]) -> Dict[str, float]:
        """Calculate performance statistics"""
        durations = [r.duration for r in responses]
        
        return {
            "min": min(durations),
            "max": max(durations),
            "avg": sum(durations) / len(durations),
            "median": sorted(durations)[len(durations) // 2]
        }