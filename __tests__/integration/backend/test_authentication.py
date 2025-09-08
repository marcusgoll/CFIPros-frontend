"""
Authentication Endpoint Contract Tests
Tests Clerk authentication integration and JWT token handling
"""

import pytest
import json
import time
from typing import Dict, Any

from base_test import AuthenticationTestBase, APIResponse


@pytest.mark.contract
@pytest.mark.clerk_integration
@pytest.mark.requires_backend
class TestAuthenticationContract(AuthenticationTestBase):
    """Contract tests for authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_session_endpoint_success(self, http_client, auth_headers, contract_validator):
        """Test successful session validation"""
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=auth_headers
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
        
        # Validate session response structure
        data = response.data
        assert "user" in data, "Session response should contain user"
        assert "session" in data, "Session response should contain session info"
        
        user = data["user"]
        assert "id" in user, "User should have id"
        assert "email" in user, "User should have email"
    
    @pytest.mark.asyncio
    async def test_session_endpoint_unauthorized(self, http_client, contract_validator):
        """Test session endpoint without authentication"""
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"]
        )
        
        self.assert_error_response(response, 401)
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_session_endpoint_invalid_token(self, http_client, contract_validator):
        """Test session endpoint with invalid JWT token"""
        
        invalid_headers = {"Authorization": "Bearer invalid_token_123"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=invalid_headers
        )
        
        self.assert_error_response(response, 401)
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_token_refresh_success(self, http_client, auth_headers, contract_validator):
        """Test successful token refresh"""
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["refresh"],
            headers=auth_headers
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("POST", "/api/v1/auth/refresh", response.status_code, response.data)
        
        # Validate refresh response structure
        data = response.data
        assert "token" in data, "Refresh response should contain new token"
        assert "expires_at" in data, "Refresh response should contain expiration"
    
    @pytest.mark.asyncio
    async def test_auth_status_endpoint(self, http_client, auth_headers, contract_validator):
        """Test authentication status endpoint"""
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["status"],
            headers=auth_headers
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("GET", "/api/v1/auth/status", response.status_code, response.data)
        
        # Validate status response
        data = response.data
        assert "authenticated" in data, "Status should indicate authentication state"
        assert data["authenticated"] is True, "Should be authenticated with valid token"


@pytest.mark.clerk_integration
@pytest.mark.requires_backend
class TestClerkWebhookContract(AuthenticationTestBase):
    """Contract tests for Clerk webhook integration"""
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_user_created(self, http_client, mock_clerk_webhook_headers, generate_test_user_data, contract_validator):
        """Test Clerk webhook processes user.created events"""
        
        user_data = generate_test_user_data()
        webhook_payload = self.create_webhook_payload("user.created", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            headers=mock_clerk_webhook_headers,
            data=webhook_payload
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)
        
        # Validate webhook response
        data = response.data
        assert "success" in data, "Webhook response should indicate success"
        assert data["success"] is True, "Webhook processing should succeed"
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_user_updated(self, http_client, mock_clerk_webhook_headers, generate_test_user_data, contract_validator):
        """Test Clerk webhook processes user.updated events"""
        
        user_data = generate_test_user_data()
        user_data["updated_at"] = int(time.time() * 1000)  # Current timestamp in ms
        webhook_payload = self.create_webhook_payload("user.updated", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            headers=mock_clerk_webhook_headers,
            data=webhook_payload
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_user_deleted(self, http_client, mock_clerk_webhook_headers, generate_test_user_data, contract_validator):
        """Test Clerk webhook processes user.deleted events"""
        
        user_data = generate_test_user_data()
        webhook_payload = self.create_webhook_payload("user.deleted", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            headers=mock_clerk_webhook_headers,
            data=webhook_payload
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_invalid_signature(self, http_client, generate_test_user_data, contract_validator):
        """Test Clerk webhook rejects invalid signatures"""
        
        invalid_headers = {
            "svix-id": "msg_invalid",
            "svix-timestamp": str(int(time.time())),
            "svix-signature": "v1,invalid_signature",
            "content-type": "application/json"
        }
        
        user_data = generate_test_user_data()
        webhook_payload = self.create_webhook_payload("user.created", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            headers=invalid_headers,
            data=webhook_payload
        )
        
        self.assert_error_response(response, 400, "INVALID_WEBHOOK_SIGNATURE")
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_missing_headers(self, http_client, generate_test_user_data, contract_validator):
        """Test Clerk webhook rejects requests without required headers"""
        
        user_data = generate_test_user_data()
        webhook_payload = self.create_webhook_payload("user.created", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            data=webhook_payload
        )
        
        self.assert_error_response(response, 400, "MISSING_WEBHOOK_HEADERS")
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_clerk_webhook_unknown_event_type(self, http_client, mock_clerk_webhook_headers, generate_test_user_data, contract_validator):
        """Test Clerk webhook handles unknown event types gracefully"""
        
        user_data = generate_test_user_data()
        webhook_payload = self.create_webhook_payload("unknown.event", user_data)
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.AUTH_ENDPOINTS["webhook"],
            headers=mock_clerk_webhook_headers,
            data=webhook_payload
        )
        
        # Should either succeed (ignore) or return specific error
        assert response.status_code in [200, 400], "Should handle unknown events gracefully"
        contract_validator.validate_response("POST", "/api/v1/auth/clerk/webhook", response.status_code, response.data)


@pytest.mark.auth
@pytest.mark.requires_backend
class TestJWTTokenManagement(AuthenticationTestBase):
    """JWT token lifecycle management tests"""
    
    @pytest.mark.asyncio
    async def test_expired_token_handling(self, http_client, mock_jwt_token, contract_validator):
        """Test handling of expired JWT tokens"""
        
        # Create expired token
        mock_jwt_token.payload["exp"] = int(time.time()) - 3600  # Expired 1 hour ago
        expired_token = mock_jwt_token.encode()
        expired_headers = {"Authorization": f"Bearer {expired_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=expired_headers
        )
        
        self.assert_error_response(response, 401, "TOKEN_EXPIRED")
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_malformed_token_handling(self, http_client, contract_validator):
        """Test handling of malformed JWT tokens"""
        
        malformed_headers = {"Authorization": "Bearer malformed.token.here"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=malformed_headers
        )
        
        self.assert_error_response(response, 401, "INVALID_TOKEN")
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_token_with_wrong_issuer(self, http_client, mock_jwt_token, contract_validator):
        """Test rejection of tokens from wrong issuer"""
        
        mock_jwt_token.payload["iss"] = "https://wrong-issuer.com"
        wrong_issuer_token = mock_jwt_token.encode()
        wrong_issuer_headers = {"Authorization": f"Bearer {wrong_issuer_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=wrong_issuer_headers
        )
        
        self.assert_error_response(response, 401, "INVALID_ISSUER")
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_token_with_missing_claims(self, http_client, mock_jwt_token, contract_validator):
        """Test rejection of tokens with missing required claims"""
        
        # Remove required claim
        del mock_jwt_token.payload["sub"]
        invalid_token = mock_jwt_token.encode()
        invalid_headers = {"Authorization": f"Bearer {invalid_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=invalid_headers
        )
        
        self.assert_error_response(response, 401, "INVALID_TOKEN_CLAIMS")
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)


@pytest.mark.auth
@pytest.mark.requires_backend
class TestOrganizationAccessControl(AuthenticationTestBase):
    """Organization-based access control tests"""
    
    @pytest.mark.asyncio
    async def test_organization_member_access(self, http_client, mock_jwt_token, contract_validator):
        """Test organization member can access org resources"""
        
        # Set up organization context in token
        mock_jwt_token.payload["org_id"] = "org_test_123"
        mock_jwt_token.payload["org_role"] = "member"
        org_token = mock_jwt_token.encode()
        org_headers = {"Authorization": f"Bearer {org_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=org_headers
        )
        
        self.assert_success_response(response)
        contract_validator.validate_response("GET", "/api/v1/auth/session", response.status_code, response.data)
        
        # Should include organization info in response
        data = response.data
        if "user" in data:
            user = data["user"]
            # Organization info might be included in user context
            assert "org_id" in user or "organization" in data, "Should include organization context"
    
    @pytest.mark.asyncio
    async def test_organization_admin_privileges(self, http_client, mock_jwt_token):
        """Test organization admin has elevated privileges"""
        
        mock_jwt_token.payload["org_role"] = "admin"
        admin_token = mock_jwt_token.encode()
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=admin_headers
        )
        
        self.assert_success_response(response)
        
        # Admin should have access to organization management features
        data = response.data
        if "user" in data:
            user = data["user"]
            # Check for admin role indication
            assert user.get("org_role") == "admin" or "permissions" in user
    
    @pytest.mark.asyncio
    async def test_cross_organization_access_denied(self, http_client, mock_jwt_token):
        """Test users cannot access other organizations' resources"""
        
        # This would typically be tested with specific endpoints
        # that require organization-scoped access
        # For now, verify the token contains proper organization isolation
        
        mock_jwt_token.payload["org_id"] = "org_user_123"
        user_token = mock_jwt_token.encode()
        user_headers = {"Authorization": f"Bearer {user_token}"}
        
        response = await self.make_request(
            client=http_client,
            method="GET",
            endpoint=self.AUTH_ENDPOINTS["session"],
            headers=user_headers
        )
        
        self.assert_success_response(response)
        
        # Verify organization context is properly isolated
        data = response.data
        if "user" in data:
            user = data["user"]
            assert user.get("org_id") == "org_user_123", "Should maintain organization isolation"


@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.requires_backend
class TestAuthenticationIntegration(AuthenticationTestBase):
    """End-to-end authentication integration tests"""
    
    @pytest.mark.asyncio
    async def test_authentication_during_file_processing(self, http_client, auth_headers, sample_aktr_file):
        """Test authentication persistence during long file processing operations"""
        
        # Start file upload with authentication
        from base_test import FileExtractionTestBase
        file_extractor = FileExtractionTestBase()
        
        upload_response = await file_extractor.upload_file(
            client=http_client,
            file_path=sample_aktr_file,
            headers=auth_headers
        )
        
        file_extractor.assert_extraction_success(upload_response)
        batch_id = upload_response.data["batch_id"]
        
        # Verify authentication is maintained during processing
        import asyncio
        for attempt in range(5):  # Check authentication multiple times
            auth_response = await self.make_request(
                client=http_client,
                method="GET",
                endpoint=self.AUTH_ENDPOINTS["session"],
                headers=auth_headers
            )
            
            self.assert_success_response(auth_response)
            
            # Also check that we can still access the processing batch
            results_response = await file_extractor.get_extraction_results(
                client=http_client,
                batch_id=batch_id,
                headers=auth_headers
            )
            
            assert results_response.status_code in [200, 404], "Should maintain access to batch"
            
            await asyncio.sleep(1)
    
    @pytest.mark.asyncio
    async def test_concurrent_authentication_sessions(self, http_client, mock_jwt_token):
        """Test handling of concurrent authentication sessions"""
        
        import asyncio
        
        # Create multiple tokens for concurrent sessions
        tasks = []
        for i in range(3):
            session_token = mock_jwt_token.encode()
            session_headers = {"Authorization": f"Bearer {session_token}"}
            
            task = self.make_request(
                client=http_client,
                method="GET",
                endpoint=self.AUTH_ENDPOINTS["session"],
                headers=session_headers
            )
            tasks.append(task)
        
        # Execute concurrent authentication checks
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All sessions should be handled properly
        for response in responses:
            if isinstance(response, Exception):
                pytest.fail(f"Concurrent authentication failed: {response}")
            
            self.assert_success_response(response)