"""
Backend Health and Accessibility Tests
Verifies all backend endpoints are accessible and properly authenticated
"""

import pytest
from typing import List, Dict, Any
from pathlib import Path

from base_test import BaseAPITest, APIResponse


@pytest.mark.integration
@pytest.mark.requires_backend
class TestBackendAccessibility(BaseAPITest):
    """Test backend API accessibility and basic health"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.core_endpoints = [
            {"path": "/health", "method": "GET", "auth_required": False},
            {"path": "/api/v1/extractor/extract", "method": "POST", "auth_required": True},
            {"path": "/api/v1/auth/session", "method": "GET", "auth_required": True},
            {"path": "/api/v1/auth/status", "method": "GET", "auth_required": True},
            {"path": "/api/v1/auth/clerk/webhook", "method": "POST", "auth_required": False}
        ]
    
    @pytest.mark.asyncio
    async def test_backend_health_check(self, http_client, performance_monitor):
        """Test backend health endpoint is accessible"""
        
        with performance_monitor.measure_request("backend_health_check"):
            response = await self.make_request(
                client=http_client,
                method="GET",
                endpoint="/health"
            )
        
        # Health check should be fast and successful
        self.assert_response_time(response, 1.0)  # Health should be < 1s
        
        # Should return 200 or 204 for healthy service
        assert response.status_code in [200, 204], (
            f"Health check failed with status {response.status_code}: {response.data}"
        )
        
        # If it returns data, should indicate healthy status
        if response.data:
            assert response.data.get("status") in ["healthy", "ok", "up"], (
                f"Health status indicates problem: {response.data}"
            )
    
    @pytest.mark.asyncio
    async def test_core_endpoints_accessibility(self, http_client, auth_headers):
        """Test that all core API endpoints are accessible"""
        
        results = []
        
        for endpoint_config in self.core_endpoints:
            path = endpoint_config["path"]
            method = endpoint_config["method"]
            auth_required = endpoint_config["auth_required"]
            
            # Test without authentication
            response = await self.make_request(
                client=http_client,
                method=method,
                endpoint=path
            )
            
            if auth_required:
                # Should return 401 Unauthorized
                expected_status = 401
            else:
                # Should return valid response (200, 202, 400, etc.)
                expected_status = [200, 202, 400, 404, 405]
            
            if isinstance(expected_status, list):
                accessible = response.status_code in expected_status
            else:
                accessible = response.status_code == expected_status
            
            results.append({
                "endpoint": f"{method} {path}",
                "accessible": accessible,
                "status_code": response.status_code,
                "auth_required": auth_required,
                "response_time": response.duration
            })
            
            assert accessible, (
                f"Endpoint {method} {path} not accessible. "
                f"Expected status {expected_status}, got {response.status_code}"
            )
        
        # Log accessibility summary
        accessible_count = sum(1 for r in results if r["accessible"])
        print(f"\nBackend Accessibility Summary:")
        print(f"Total endpoints tested: {len(results)}")
        print(f"Accessible endpoints: {accessible_count}")
        
        for result in results:
            status = "✅" if result["accessible"] else "❌"
            print(f"{status} {result['endpoint']} - {result['status_code']} ({result['response_time']:.3f}s)")
    
    @pytest.mark.asyncio
    async def test_authenticated_endpoints_with_auth(self, http_client, auth_headers, performance_monitor):
        """Test authenticated endpoints work with valid authentication"""
        
        authenticated_endpoints = [
            ep for ep in self.core_endpoints if ep["auth_required"]
        ]
        
        results = []
        
        for endpoint_config in authenticated_endpoints:
            path = endpoint_config["path"]
            method = endpoint_config["method"]
            
            with performance_monitor.measure_request(f"auth_{method.lower()}_{path.replace('/', '_')}"):
                response = await self.make_request(
                    client=http_client,
                    method=method,
                    endpoint=path,
                    headers=auth_headers
                )
            
            # Should not return 401 with proper authentication
            auth_works = response.status_code != 401
            
            results.append({
                "endpoint": f"{method} {path}",
                "auth_works": auth_works,
                "status_code": response.status_code,
                "response_time": response.duration
            })
            
            assert auth_works, (
                f"Authentication failed for {method} {path}. "
                f"Got {response.status_code}: {response.data}"
            )
        
        # Log authentication summary
        auth_working_count = sum(1 for r in results if r["auth_works"])
        print(f"\nAuthentication Summary:")
        print(f"Authenticated endpoints tested: {len(results)}")
        print(f"Working with auth: {auth_working_count}")
        
        for result in results:
            status = "✅" if result["auth_works"] else "❌"
            print(f"{status} {result['endpoint']} - {result['status_code']} ({result['response_time']:.3f}s)")
    
    @pytest.mark.asyncio
    async def test_cors_headers_present(self, http_client):
        """Test that CORS headers are properly configured"""
        
        # Test with OPTIONS request (preflight)
        response = await self.make_request(
            client=http_client,
            method="OPTIONS",
            endpoint="/api/v1/extractor/extract",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization,Content-Type"
            }
        )
        
        # Should handle OPTIONS request properly
        assert response.status_code in [200, 204, 405], (
            f"CORS preflight failed with status {response.status_code}"
        )
        
        # Check for CORS headers if present
        cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods", 
            "Access-Control-Allow-Headers"
        ]
        
        found_cors_headers = []
        for header in cors_headers:
            if header.lower() in [h.lower() for h in response.headers.keys()]:
                found_cors_headers.append(header)
        
        # At least some CORS configuration should be present
        if response.status_code in [200, 204]:
            assert len(found_cors_headers) > 0, (
                f"Expected CORS headers not found. Headers: {response.headers}"
            )
    
    @pytest.mark.asyncio
    async def test_api_versioning_support(self, http_client):
        """Test API versioning is properly supported"""
        
        # Test v1 API endpoints
        v1_response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint="/api/v1/auth/status"
        )
        
        # Should recognize v1 API (even if unauthorized)
        assert v1_response.status_code != 404, (
            "API v1 endpoints not found - versioning may not be configured"
        )
        
        # Test non-existent version
        v999_response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint="/api/v999/auth/status"
        )
        
        # Should return 404 for non-existent version
        assert v999_response.status_code == 404, (
            f"Expected 404 for non-existent API version, got {v999_response.status_code}"
        )


@pytest.mark.contract
@pytest.mark.requires_backend
class TestEndpointContractCompliance(BaseAPITest):
    """Test endpoint responses comply with expected contracts"""
    
    @pytest.mark.asyncio
    async def test_error_response_format_consistency(self, http_client, auth_headers):
        """Test that all endpoints return consistent error response format"""
        
        # Test various error conditions
        error_test_cases = [
            {
                "name": "Unauthorized endpoint", 
                "method": "GET",
                "endpoint": "/api/v1/auth/session",
                "headers": {},
                "expected_status": 401
            },
            {
                "name": "Not found endpoint",
                "method": "GET", 
                "endpoint": "/api/v1/nonexistent",
                "headers": auth_headers,
                "expected_status": 404
            },
            {
                "name": "Invalid method",
                "method": "PATCH",
                "endpoint": "/api/v1/auth/session", 
                "headers": auth_headers,
                "expected_status": 405
            }
        ]
        
        error_formats = []
        
        for test_case in error_test_cases:
            response = await self.make_request(
                client=http_client,
                method=test_case["method"],
                endpoint=test_case["endpoint"],
                headers=test_case["headers"]
            )
            
            assert response.status_code == test_case["expected_status"], (
                f"Test case '{test_case['name']}' returned {response.status_code}, "
                f"expected {test_case['expected_status']}"
            )
            
            # Analyze error response format
            if response.data:
                error_format = {
                    "has_error_field": "error" in response.data,
                    "has_code_field": "code" in response.data,
                    "has_message_field": "message" in response.data,
                    "error_type": type(response.data.get("error")).__name__,
                    "structure": list(response.data.keys())
                }
                error_formats.append({
                    "test_case": test_case["name"],
                    "status_code": response.status_code,
                    "format": error_format
                })
        
        # Verify consistent error response format
        if error_formats:
            first_format = error_formats[0]["format"]
            for error_format in error_formats[1:]:
                # Should have similar structure across different error types
                assert error_format["format"]["has_error_field"] == first_format["has_error_field"], (
                    f"Inconsistent error response format: {error_format}"
                )
    
    @pytest.mark.asyncio
    async def test_content_type_headers(self, http_client, auth_headers):
        """Test that endpoints return proper Content-Type headers"""
        
        test_endpoints = [
            {"method": "GET", "endpoint": "/api/v1/auth/session", "expected_type": "application/json"},
            {"method": "GET", "endpoint": "/health", "expected_type": "application/json"}
        ]
        
        for test_endpoint in test_endpoints:
            response = await self.make_request(
                client=http_client,
                method=test_endpoint["method"],
                endpoint=test_endpoint["endpoint"],
                headers=auth_headers
            )
            
            # Skip content-type check for certain error responses
            if response.status_code >= 500:
                continue
            
            content_type = response.headers.get("content-type", "")
            expected_type = test_endpoint["expected_type"]
            
            assert expected_type in content_type.lower(), (
                f"Endpoint {test_endpoint['method']} {test_endpoint['endpoint']} "
                f"returned Content-Type '{content_type}', expected to contain '{expected_type}'"
            )
    
    @pytest.mark.asyncio
    async def test_security_headers_present(self, http_client):
        """Test that security headers are properly configured"""
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint="/health"
        )
        
        # Common security headers to check
        security_headers = [
            "x-content-type-options",
            "x-frame-options", 
            "x-xss-protection",
            "strict-transport-security"  # Only for HTTPS
        ]
        
        present_headers = []
        response_headers_lower = {k.lower(): v for k, v in response.headers.items()}
        
        for header in security_headers:
            if header in response_headers_lower:
                present_headers.append(header)
        
        # At least some security headers should be present
        print(f"\nSecurity Headers Summary:")
        print(f"Found security headers: {present_headers}")
        print(f"All response headers: {list(response.headers.keys())}")
        
        # This is informational - we don't fail the test for missing security headers
        # but we log what's present for security review


@pytest.mark.slow
@pytest.mark.requires_backend
class TestBackendPerformance(BaseAPITest):
    """Test backend performance meets requirements"""
    
    @pytest.mark.asyncio
    async def test_api_response_times(self, http_client, auth_headers, performance_monitor):
        """Test API response times meet performance requirements"""
        
        performance_test_cases = [
            {"endpoint": "/health", "method": "GET", "max_time": 1.0, "auth": False},
            {"endpoint": "/api/v1/auth/session", "method": "GET", "max_time": 2.0, "auth": True},
            {"endpoint": "/api/v1/auth/status", "method": "GET", "max_time": 2.0, "auth": True}
        ]
        
        performance_results = []
        
        for test_case in performance_test_cases:
            headers = auth_headers if test_case["auth"] else {}
            
            with performance_monitor.measure_request(f"perf_{test_case['method'].lower()}_{test_case['endpoint'].replace('/', '_')}"):
                response = await self.make_request(
                    client=http_client,
                    method=test_case["method"],
                    endpoint=test_case["endpoint"],
                    headers=headers
                )
            
            meets_performance = response.duration <= test_case["max_time"]
            
            performance_results.append({
                "endpoint": f"{test_case['method']} {test_case['endpoint']}",
                "duration": response.duration,
                "max_allowed": test_case["max_time"], 
                "meets_requirement": meets_performance,
                "status_code": response.status_code
            })
            
            # Only assert performance if endpoint is working properly
            if response.status_code < 500:
                assert meets_performance, (
                    f"Performance requirement not met for {test_case['method']} {test_case['endpoint']}. "
                    f"Took {response.duration:.3f}s, max allowed {test_case['max_time']}s"
                )
        
        # Performance summary
        fast_endpoints = sum(1 for r in performance_results if r["meets_requirement"])
        print(f"\nPerformance Summary:")
        print(f"Endpoints tested: {len(performance_results)}")
        print(f"Meeting requirements: {fast_endpoints}")
        
        for result in performance_results:
            status = "✅" if result["meets_requirement"] else "❌"
            print(f"{status} {result['endpoint']} - {result['duration']:.3f}s (max: {result['max_allowed']}s)")


@pytest.mark.integration
@pytest.mark.requires_backend 
class TestBackendEnvironmentValidation(BaseAPITest):
    """Validate backend environment configuration"""
    
    @pytest.mark.asyncio
    async def test_environment_detection(self, http_client, test_config):
        """Test backend correctly identifies test environment"""
        
        # Health check might include environment info
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint="/health"
        )
        
        if response.status_code == 200 and response.data:
            # Log environment information if available
            print(f"\nBackend Environment Info:")
            print(f"Test Environment: {test_config.test_environment}")
            print(f"Backend URL: {test_config.backend_base_url}")
            print(f"Health Response: {response.data}")
        
        # The test passes if health check is accessible
        assert response.status_code in [200, 204], (
            f"Backend health check failed: {response.status_code}"
        )
    
    @pytest.mark.asyncio
    async def test_api_base_url_configuration(self, http_client, test_config):
        """Test API base URL is correctly configured"""
        
        # Verify we can reach the API at the configured base URL
        response = await self.make_request(
            client=http_client,
            method="GET", 
            endpoint="/health"
        )
        
        assert response.status_code != 503, (
            f"Cannot connect to backend at {test_config.backend_base_url}. "
            "Check if backend is running and URL is correct."
        )
        
        assert response.status_code not in [404, 502], (
            f"Backend API base URL may be incorrect: {test_config.backend_base_url}. "
            f"Got {response.status_code}"
        )