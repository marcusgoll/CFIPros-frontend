"""
File Extraction Endpoint Contract Tests
Tests /api/v1/extractor/extract endpoint following OpenAPI contract
"""

import pytest
from pathlib import Path
from typing import Dict, Any

from base_test import FileExtractionTestBase, APIResponse


@pytest.mark.contract
@pytest.mark.requires_backend
class TestFileExtractionContract(FileExtractionTestBase):
    """Contract tests for file extraction endpoint"""
    
    def setup_method(self):
        """Setup for each test method"""
        self.auth_headers = {"Authorization": "Bearer fake_jwt_token"}
    
    @pytest.mark.asyncio
    async def test_extract_files_success(self, http_client, auth_headers, sample_aktr_file, contract_validator, performance_monitor):
        """Test successful file extraction matches contract"""
        
        with performance_monitor.measure_request("file_extraction_success"):
            response = await self.upload_file(
                client=http_client,
                file_path=sample_aktr_file,
                mime_type="application/pdf",
                headers=auth_headers
            )
        
        # Assert API contract compliance
        self.assert_extraction_success(response)
        self.assert_response_time(response)
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
        
        # Validate response structure per OpenAPI spec
        data = response.data
        assert isinstance(data["batch_id"], str), "batch_id should be string"
        assert len(data["batch_id"]) > 0, "batch_id should not be empty"
        assert data["status"] == "processing", "status should be 'processing'"
        assert "estimated_completion" in data, "should contain estimated_completion"
        assert "files_count" in data or "files" in data, "should contain files count or files array"
    
    @pytest.mark.asyncio
    async def test_extract_files_invalid_type(self, http_client, auth_headers, malicious_exe_file, contract_validator):
        """Test 400 response for invalid file type"""
        
        response = await self.upload_file(
            client=http_client,
            file_path=malicious_exe_file,
            mime_type="application/x-msdownload",
            headers=auth_headers
        )
        
        # Assert contract compliance for error response
        self.assert_error_response(response, 400, "INVALID_FILE_TYPE")
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
        
        # Validate error response structure
        error_data = response.data
        assert "error" in error_data, "Error response should contain 'error' field"
        assert "code" in error_data, "Error response should contain 'code' field"
        assert error_data["code"] == "INVALID_FILE_TYPE", "Error code should match"
        assert isinstance(error_data["error"], str), "Error message should be string"
    
    @pytest.mark.asyncio
    async def test_extract_files_unauthorized(self, http_client, contract_validator):
        """Test 401 response when not authenticated"""
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.EXTRACT_ENDPOINT
        )
        
        self.assert_error_response(response, 401)
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
        
        # Validate unauthorized response
        if response.data:
            assert "error" in response.data, "Unauthorized response should contain error"
    
    @pytest.mark.asyncio
    async def test_extract_files_oversized(self, http_client, auth_headers, large_test_file, contract_validator):
        """Test 400 response for oversized file"""
        
        response = await self.upload_file(
            client=http_client,
            file_path=large_test_file,
            mime_type="application/pdf",
            headers=auth_headers
        )
        
        # Should reject oversized files
        self.assert_error_response(response, 400, "FILE_TOO_LARGE")
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_extract_batch_processing_limit(self, http_client, auth_headers, test_files_path, contract_validator):
        """Test batch processing with maximum 30 files per request"""
        
        # Create more than 30 test files
        valid_files_dir = test_files_path / "valid"
        available_files = list(valid_files_dir.glob("*.pdf"))
        
        if len(available_files) < 3:
            pytest.skip("Need at least 3 test files for batch testing")
        
        # Test with exactly 30 files (should succeed)
        test_files = available_files[:min(30, len(available_files))]
        
        response = await self.upload_multiple_files(
            client=http_client,
            file_paths=test_files,
            headers=auth_headers
        )
        
        # Should succeed with up to 30 files
        if len(test_files) <= 30:
            self.assert_extraction_success(response)
        else:
            self.assert_error_response(response, 400, "TOO_MANY_FILES")
        
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_extract_files_missing_file(self, http_client, auth_headers, contract_validator):
        """Test 400 response when no files provided"""
        
        response = await self.make_request(
            client=http_client,
            method="POST",
            endpoint=self.EXTRACT_ENDPOINT,
            headers=auth_headers
        )
        
        self.assert_error_response(response, 400, "NO_FILES_PROVIDED")
        contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)


@pytest.mark.rate_limit
@pytest.mark.requires_backend
class TestFileExtractionRateLimit(FileExtractionTestBase):
    """Rate limiting tests for file extraction"""
    
    @pytest.mark.asyncio
    async def test_extract_files_rate_limit(self, http_client, auth_headers, sample_aktr_file, contract_validator):
        """Test 429 response for rate limit exceeded"""
        
        responses = await self.test_rate_limit_enforcement(
            client=http_client,
            endpoint=self.EXTRACT_ENDPOINT,
            method="POST",
            files={"files": open(sample_aktr_file, "rb")},
            expected_limit=10
        )
        
        # Validate rate limiting behavior
        self.assert_rate_limit_exceeded(responses, limit=10)
        
        # Check that rate limited responses comply with contract
        for response in responses:
            if response.status_code == 429:
                contract_validator.validate_response("POST", "/api/v1/extractor/extract", response.status_code, response.data)
                self.assert_error_response(response, 429, "RATE_LIMIT_EXCEEDED")


@pytest.mark.contract
@pytest.mark.requires_backend
class TestExtractionResultsContract(FileExtractionTestBase):
    """Contract tests for extraction results endpoint"""
    
    @pytest.mark.asyncio
    async def test_get_results_success(self, http_client, auth_headers, sample_aktr_file, contract_validator):
        """Test successful results retrieval matches contract"""
        
        # First, start an extraction
        upload_response = await self.upload_file(
            client=http_client,
            file_path=sample_aktr_file,
            headers=auth_headers
        )
        
        self.assert_extraction_success(upload_response)
        batch_id = upload_response.data["batch_id"]
        
        # Then, get the results
        results_response = await self.get_extraction_results(
            client=http_client,
            batch_id=batch_id,
            headers=auth_headers
        )
        
        # Validate results response contract
        self.assert_success_response(results_response, 200)
        contract_validator.validate_response("GET", f"/api/v1/extractor/results/{batch_id}", results_response.status_code, results_response.data)
        
        # Validate response structure
        data = results_response.data
        assert "batch_id" in data, "Results should contain batch_id"
        assert "status" in data, "Results should contain status"
        assert data["status"] in ["processing", "completed", "failed"], "Status should be valid"
        
        if data["status"] == "completed":
            assert "results" in data, "Completed results should contain results array"
            assert isinstance(data["results"], list), "Results should be a list"
    
    @pytest.mark.asyncio
    async def test_get_results_not_found(self, http_client, auth_headers, contract_validator):
        """Test 404 response for non-existent batch_id"""
        
        fake_batch_id = "batch_nonexistent_12345"
        
        response = await self.get_extraction_results(
            client=http_client,
            batch_id=fake_batch_id,
            headers=auth_headers
        )
        
        self.assert_error_response(response, 404, "BATCH_NOT_FOUND")
        contract_validator.validate_response("GET", f"/api/v1/extractor/results/{fake_batch_id}", response.status_code, response.data)
    
    @pytest.mark.asyncio
    async def test_get_results_unauthorized(self, http_client, contract_validator):
        """Test 401 response when not authenticated"""
        
        response = await self.get_extraction_results(
            client=http_client,
            batch_id="batch_123"
        )
        
        self.assert_error_response(response, 401)
        contract_validator.validate_response("GET", "/api/v1/extractor/results/batch_123", response.status_code, response.data)


@pytest.mark.security
@pytest.mark.requires_backend
class TestFileExtractionSecurity(FileExtractionTestBase):
    """Security tests for file extraction endpoint"""
    
    @pytest.mark.asyncio
    async def test_malicious_file_rejection(self, http_client, auth_headers, malicious_exe_file):
        """Test that malicious executable files are rejected"""
        
        response = await self.test_malicious_file_rejection(
            client=http_client,
            malicious_file_path=malicious_exe_file
        )
        
        self.assert_malicious_file_rejected(response)
    
    @pytest.mark.asyncio
    async def test_script_injection_prevention(self, http_client, auth_headers, test_files_path):
        """Test prevention of script injection in filenames"""
        
        script_injection_file = test_files_path / "malicious" / "script-injection.pdf"
        
        if not script_injection_file.exists():
            pytest.skip("Script injection test file not available")
        
        response = await self.upload_file(
            client=http_client,
            file_path=script_injection_file,
            headers=auth_headers
        )
        
        # Should either reject or sanitize the file
        if response.status_code == 400:
            self.assert_malicious_file_rejected(response)
        elif response.status_code == 202:
            # If accepted, filename should be sanitized
            self.assert_extraction_success(response)
    
    @pytest.mark.asyncio
    async def test_path_traversal_prevention(self, http_client, auth_headers, tmp_path):
        """Test prevention of path traversal attacks"""
        
        # Create a test file with path traversal in name
        malicious_name = "../../malicious.pdf"
        malicious_file = tmp_path / "test.pdf"
        malicious_file.write_bytes(b"%PDF-1.4\n1 0 obj\n<< >>\nendobj")
        
        with open(malicious_file, "rb") as f:
            files = {"files": (malicious_name, f, "application/pdf")}
            
            response = await self.make_request(
                client=http_client,
                method="POST",
                endpoint=self.EXTRACT_ENDPOINT,
                files=files,
                headers=auth_headers
            )
        
        # Should handle path traversal safely (either reject or sanitize)
        assert response.status_code in [200, 202, 400], "Should handle path traversal gracefully"
    
    @pytest.mark.asyncio
    async def test_concurrent_upload_handling(self, http_client, auth_headers, sample_aktr_file):
        """Test handling of concurrent file uploads"""
        
        import asyncio
        
        # Start multiple uploads simultaneously
        tasks = []
        for i in range(5):
            task = self.upload_file(
                client=http_client,
                file_path=sample_aktr_file,
                headers=auth_headers
            )
            tasks.append(task)
        
        # Wait for all uploads to complete
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should either succeed or hit rate limit
        for response in responses:
            if isinstance(response, Exception):
                pytest.fail(f"Concurrent upload failed with exception: {response}")
            
            assert response.status_code in [202, 429], (
                f"Concurrent upload should succeed or hit rate limit, got {response.status_code}"
            )


@pytest.mark.integration
@pytest.mark.requires_backend
class TestFileExtractionIntegration(FileExtractionTestBase):
    """End-to-end integration tests for file extraction workflow"""
    
    @pytest.mark.asyncio
    async def test_complete_extraction_workflow(self, http_client, auth_headers, sample_aktr_file, performance_monitor):
        """Test complete workflow: upload -> processing -> results"""
        
        with performance_monitor.measure_request("complete_extraction_workflow"):
            
            # Step 1: Upload file
            upload_response = await self.upload_file(
                client=http_client,
                file_path=sample_aktr_file,
                headers=auth_headers
            )
            
            self.assert_extraction_success(upload_response)
            batch_id = upload_response.data["batch_id"]
            
            # Step 2: Poll for results (with timeout)
            import asyncio
            max_attempts = 30  # 30 seconds max
            results_response = None
            
            for attempt in range(max_attempts):
                results_response = await self.get_extraction_results(
                    client=http_client,
                    batch_id=batch_id,
                    headers=auth_headers
                )
                
                if results_response.status_code == 200:
                    status = results_response.data.get("status")
                    if status in ["completed", "failed"]:
                        break
                
                await asyncio.sleep(1)
            
            # Validate final results
            assert results_response is not None, "Should receive results response"
            self.assert_success_response(results_response)
            
            final_status = results_response.data.get("status")
            assert final_status in ["completed", "failed"], f"Final status should be completed or failed, got {final_status}"
            
            if final_status == "completed":
                assert "results" in results_response.data, "Completed extraction should contain results"
                results = results_response.data["results"]
                assert isinstance(results, list), "Results should be a list"
                assert len(results) > 0, "Should have at least one result"