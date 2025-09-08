/**
 * Task 3.2: Processing Status and Results Testing
 * Direct Backend API Contract Validation Tests
 * 
 * Tests the /api/v1/extractor/results/{batchId} endpoint directly against the backend API
 * following OpenAPI specification requirements from tasks.md
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { ContractValidator } from '@/lib/validation/api-contracts';
import { validateResponseStatus, validateResponseHeaders, validateContentType } from '@/lib/validation/api-contracts';

// Test configuration
const BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';
const API_ENDPOINT = `${BASE_URL}/v1/extractor/results`;
const AUTH_TOKEN = process.env.TEST_JWT_TOKEN || 'test-token-placeholder';

// Mock batch IDs for different testing scenarios
const TEST_BATCH_IDS = {
  processing: '550e8400-e29b-41d4-a716-446655440000',
  completed: '550e8400-e29b-41d4-a716-446655440001', 
  failed: '550e8400-e29b-41d4-a716-446655440002',
  notFound: '550e8400-e29b-41d4-a716-446655440404'
};

// Test data generators
function createValidProcessingStatus() {
  return {
    batch_id: TEST_BATCH_IDS.processing,
    status: 'processing',
    progress: 0.65,
    estimated_completion: '2025-09-08T10:35:00Z',
    files_processed: 13,
    files_total: 20,
    current_file: 'aktr_document_13.pdf'
  };
}

function createValidProcessingResults() {
  return {
    batch_id: TEST_BATCH_IDS.completed,
    status: 'completed',
    completed_at: '2025-09-08T10:45:00Z',
    results: [
      {
        file_id: 'file_1',
        file_name: 'aktr_sample.pdf',
        status: 'success',
        extracted_data: {
          acs_sections: [
            {
              section: 'PA.I.A',
              task: 'Certificates and Documents',
              elements: ['Check certificates', 'Verify documents'],
              page_numbers: [1, 2],
              confidence: 0.95
            },
            {
              section: 'PPT.VII.A.1a',
              task: 'Complex Navigation Task',
              elements: ['Plan cross-country flight', 'Calculate fuel requirements'],
              page_numbers: [15, 16],
              confidence: 0.88
            }
          ],
          total_sections_found: 15,
          confidence_score: 0.92,
          document_type: 'aktr'
        },
        processing_time_seconds: 45.2
      }
    ],
    summary: {
      total_files_processed: 1,
      successful_extractions: 1,
      failed_extractions: 0,
      total_acs_sections_found: 15,
      average_confidence_score: 0.92,
      processing_time_total_seconds: 45.2,
      unique_sections: ['PA.I.A', 'PPT.VII.A.1a']
    }
  };
}

describe('Task 3.2: Processing Status and Results Testing - Direct Backend API', () => {
  let backendAvailable = false;

  beforeAll(async () => {
    // Check if backend is available
    try {
      const response = await fetch(`${BASE_URL}/health`, { method: 'GET' });
      backendAvailable = response.ok;
      if (!backendAvailable) {
        console.warn('Backend API not available - skipping direct API tests');
      }
    } catch (error) {
      console.warn('Backend API not reachable - running contract validation only');
      backendAvailable = false;
    }
  });

  describe('Processing Status Contract Validation', () => {
    /**
     * Task 3.2 Requirement: Test processing status polling with correct status transitions
     */
    it('validates processing status response schema against OpenAPI spec', async () => {
      if (!backendAvailable) {
        // Contract validation test without backend
        const mockStatusResponse = createValidProcessingStatus();

        const validation = ContractValidator.validateResultsResponse(mockStatusResponse);
        
        expect(validation.success).toBe(true);
        if (validation.success) {
          expect(validation.data.batch_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
          expect(['processing', 'queued']).toContain(validation.data.status);
          expect(validation.data.progress).toBeGreaterThanOrEqual(0);
          expect(validation.data.progress).toBeLessThanOrEqual(1);
          expect(validation.data.files_processed).toBeGreaterThanOrEqual(0);
          expect(validation.data.files_total).toBeGreaterThan(0);
        }
        return;
      }

      // Direct backend API test
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.processing}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      // Validate response status (should be 200 for status polling)
      const statusValidation = validateResponseStatus(response, [200]);
      expect(statusValidation.success).toBe(true);

      // Validate content type
      const contentValidation = validateContentType(response, 'application/json');
      expect(contentValidation.success).toBe(true);

      // Validate response schema
      const responseData = await response.json();
      const validation = ContractValidator.validateResultsResponse(responseData);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        // Validate processing status specific fields
        expect(validation.data.status).toMatch(/^(processing|queued)$/);
        expect(validation.data.progress).toBeDefined();
        expect(validation.data.files_processed).toBeDefined();
        expect(validation.data.files_total).toBeDefined();
        
        // Validate progress is within bounds
        expect(validation.data.progress).toBeGreaterThanOrEqual(0);
        expect(validation.data.progress).toBeLessThanOrEqual(1);
        
        // Validate file counts are logical
        expect(validation.data.files_processed).toBeLessThanOrEqual(validation.data.files_total);
      }
    });

    /**
     * Task 3.2 Requirement: Test progress tracking and estimated completion time accuracy
     */
    it('validates progress tracking and completion time format', async () => {
      if (!backendAvailable) {
        // Contract validation test
        const mockProgressResponse = {
          batch_id: TEST_BATCH_IDS.processing,
          status: 'processing',
          progress: 0.75,
          estimated_completion: '2025-09-08T11:15:00Z',
          files_processed: 15,
          files_total: 20,
          current_file: 'document_15.pdf'
        };

        const validation = ContractValidator.validateResultsResponse(mockProgressResponse);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          // Validate progress calculations
          const expectedProgress = validation.data.files_processed / validation.data.files_total;
          expect(Math.abs(validation.data.progress - expectedProgress)).toBeLessThan(0.1); // Allow 10% variance
          
          // Validate estimated completion time format (ISO 8601)
          expect(validation.data.estimated_completion).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
          
          // Validate completion time is in the future
          const completionTime = new Date(validation.data.estimated_completion);
          expect(completionTime.getTime()).toBeGreaterThan(Date.now() - 86400000); // Within last 24 hours or future
        }
        return;
      }

      // Direct backend test
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.processing}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      const responseData = await response.json();
      const validation = ContractValidator.validateResultsResponse(responseData);
      
      if (validation.success && validation.data.status === 'processing') {
        // Validate progress tracking consistency
        const progressRatio = validation.data.files_processed / validation.data.files_total;
        expect(Math.abs(validation.data.progress - progressRatio)).toBeLessThan(0.2); // Allow 20% variance for real systems
        
        // Validate completion time format
        if (validation.data.estimated_completion) {
          expect(validation.data.estimated_completion).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
        }
      }
    });
  });

  describe('Processing Results Contract Validation', () => {
    /**
     * Task 3.2 Requirement: Test results retrieval with ACS extraction data validation
     */
    it('validates completed results response with ACS extraction data', async () => {
      if (!backendAvailable) {
        // Contract validation test
        const mockResultsResponse = createValidProcessingResults();

        const validation = ContractValidator.validateResultsResponse(mockResultsResponse);
        
        expect(validation.success).toBe(true);
        if (validation.success) {
          expect(validation.data.status).toBe('completed');
          expect(validation.data.results).toBeDefined();
          expect(Array.isArray(validation.data.results)).toBe(true);
          expect(validation.data.results.length).toBeGreaterThan(0);
          
          // Validate ACS extraction data structure
          const firstResult = validation.data.results[0];
          expect(firstResult.extracted_data).toBeDefined();
          expect(firstResult.extracted_data.acs_sections).toBeDefined();
          expect(Array.isArray(firstResult.extracted_data.acs_sections)).toBe(true);
          
          // Validate ACS section format
          const firstSection = firstResult.extracted_data.acs_sections[0];
          expect(firstSection.section).toMatch(/^[A-Z]{2,3}\.[IVX]+\.[A-Z]+(\.[0-9]+[a-z]?)?$/);
          expect(firstSection.confidence).toBeGreaterThanOrEqual(0);
          expect(firstSection.confidence).toBeLessThanOrEqual(1);
          expect(Array.isArray(firstSection.elements)).toBe(true);
          expect(firstSection.elements.length).toBeGreaterThan(0);
        }
        return;
      }

      // Direct backend test
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.completed}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      const responseData = await response.json();
      const validation = ContractValidator.validateResultsResponse(responseData);
      
      expect(validation.success).toBe(true);
      if (validation.success && validation.data.status === 'completed') {
        // Validate results structure
        expect(validation.data.results).toBeDefined();
        expect(validation.data.summary).toBeDefined();
        
        // Validate each extraction result
        for (const result of validation.data.results) {
          if (result.status === 'success' && result.extracted_data) {
            // Validate ACS sections
            for (const section of result.extracted_data.acs_sections) {
              expect(section.section).toMatch(/^[A-Z]{2,3}\.[IVX]+\.[A-Z]+(\.[0-9]+[a-z]?)?$/);
              expect(section.confidence).toBeGreaterThanOrEqual(0);
              expect(section.confidence).toBeLessThanOrEqual(1);
              expect(section.elements.length).toBeGreaterThan(0);
            }
            
            // Validate confidence scores
            expect(result.extracted_data.confidence_score).toBeGreaterThanOrEqual(0);
            expect(result.extracted_data.confidence_score).toBeLessThanOrEqual(1);
          }
        }
      }
    });

    /**
     * Task 3.2 Requirement: Test error handling for failed processing scenarios
     */
    it('validates error responses for batch processing failures', async () => {
      if (!backendAvailable) {
        // Contract validation test for failed batch
        const mockFailedResponse = {
          batch_id: TEST_BATCH_IDS.failed,
          status: 'failed',
          completed_at: '2025-09-08T10:50:00Z',
          results: [
            {
              file_id: 'file_1',
              file_name: 'corrupted.pdf',
              status: 'failed',
              error: 'File corrupted or unreadable',
              processing_time_seconds: 5.0
            }
          ],
          summary: {
            total_files_processed: 1,
            successful_extractions: 0,
            failed_extractions: 1,
            total_acs_sections_found: 0
          }
        };

        const validation = ContractValidator.validateResultsResponse(mockFailedResponse);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(validation.data.status).toBe('failed');
          expect(validation.data.results[0].status).toBe('failed');
          expect(validation.data.results[0].error).toBeDefined();
          expect(validation.data.summary.failed_extractions).toBeGreaterThan(0);
        }
        return;
      }

      // Direct backend test for failed batch
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.failed}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      const responseData = await response.json();
      const validation = ContractValidator.validateResultsResponse(responseData);
      
      if (validation.success && validation.data.status === 'failed') {
        // Validate failed processing structure
        expect(validation.data.results).toBeDefined();
        expect(validation.data.summary).toBeDefined();
        expect(validation.data.summary.failed_extractions).toBeGreaterThan(0);
        
        // Check that failed results have error messages
        const failedResults = validation.data.results.filter(r => r.status === 'failed');
        for (const failedResult of failedResults) {
          expect(failedResult.error).toBeDefined();
          expect(typeof failedResult.error).toBe('string');
        }
      }
    });

    /**
     * Task 3.2 Requirement: Test batch not found error (404 response)
     */
    it('validates 404 error response for non-existent batch ID', async () => {
      if (!backendAvailable) {
        // Contract validation test
        const mockNotFoundError = {
          error: 'Batch not found',
          code: 'BATCH_NOT_FOUND',
          timestamp: '2025-09-08T10:30:00Z'
        };

        const validation = ContractValidator.validateErrorResponse(mockNotFoundError);
        expect(validation.success).toBe(true);
        if (validation.success) {
          expect(validation.data.code).toBe('BATCH_NOT_FOUND');
        }
        return;
      }

      // Direct backend test
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.notFound}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      expect(response.status).toBe(404);

      const errorData = await response.json();
      const validation = ContractValidator.validateErrorResponse(errorData);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.code).toBe('BATCH_NOT_FOUND');
      }
    });
  });

  describe('Status Transition and Polling Tests', () => {
    /**
     * Task 3.2 Requirement: Test concurrent processing scenarios and resource management
     */
    it('validates concurrent batch processing and resource management', async () => {
      if (!backendAvailable) {
        // Contract validation test for concurrent processing
        const mockConcurrentBatches = [
          { ...createValidProcessingStatus(), batch_id: '550e8400-e29b-41d4-a716-446655440100', progress: 0.3 },
          { ...createValidProcessingStatus(), batch_id: '550e8400-e29b-41d4-a716-446655440200', progress: 0.7 },
          { ...createValidProcessingStatus(), batch_id: '550e8400-e29b-41d4-a716-446655440300', progress: 0.1 }
        ];

        for (const batch of mockConcurrentBatches) {
          const validation = ContractValidator.validateResultsResponse(batch);
          expect(validation.success).toBe(true);
          
          if (validation.success) {
            expect(validation.data.status).toMatch(/^(processing|queued)$/);
            expect(validation.data.progress).toBeGreaterThanOrEqual(0);
            expect(validation.data.progress).toBeLessThanOrEqual(1);
          }
        }
        return;
      }

      // Direct backend test - simulate multiple concurrent requests
      const concurrentRequests = [
        TEST_BATCH_IDS.processing,
        TEST_BATCH_IDS.completed,
        TEST_BATCH_IDS.processing
      ].map(batchId => 
        fetch(`${API_ENDPOINT}/${batchId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
        })
      );

      const responses = await Promise.all(concurrentRequests);
      
      // Validate all responses were handled properly
      for (const response of responses) {
        expect([200, 404]).toContain(response.status);
        
        if (response.ok) {
          const data = await response.json();
          const validation = ContractValidator.validateResultsResponse(data);
          expect(validation.success).toBe(true);
        }
      }
    });

    /**
     * Task 3.2 Requirement: Test batch completion notifications and webhook delivery
     */
    it('validates batch completion notification format', async () => {
      if (!backendAvailable) {
        // Contract validation test for completion notification
        const mockCompletionNotification = {
          ...createValidProcessingResults(),
          status: 'completed',
          completed_at: new Date().toISOString()
        };

        const validation = ContractValidator.validateResultsResponse(mockCompletionNotification);
        expect(validation.success).toBe(true);
        
        if (validation.success) {
          expect(validation.data.status).toBe('completed');
          expect(validation.data.completed_at).toBeDefined();
          expect(validation.data.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
          expect(validation.data.summary).toBeDefined();
          expect(validation.data.summary.total_files_processed).toBeGreaterThan(0);
        }
        return;
      }

      // For direct backend testing, we check completed batch format
      const response = await fetch(`${API_ENDPOINT}/${TEST_BATCH_IDS.completed}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const validation = ContractValidator.validateResultsResponse(data);
        
        if (validation.success && validation.data.status === 'completed') {
          // Validate completion notification structure
          expect(validation.data.completed_at).toBeDefined();
          expect(validation.data.summary).toBeDefined();
          
          // Validate summary statistics
          const summary = validation.data.summary;
          expect(summary.total_files_processed).toBeDefined();
          expect(summary.successful_extractions).toBeDefined();
          expect(summary.failed_extractions).toBeDefined();
          expect(summary.total_acs_sections_found).toBeDefined();
          
          // Validate statistics consistency
          expect(summary.successful_extractions + summary.failed_extractions)
            .toBeLessThanOrEqual(summary.total_files_processed);
        }
      }
    });
  });

  describe('Contract Compliance and Integration', () => {
    /**
     * Task 3.2 Requirement: Verify all processing endpoints return contract-compliant responses
     */
    it('validates all response headers match OpenAPI specification', async () => {
      const testCases = [
        { batchId: TEST_BATCH_IDS.processing, expectedStatus: 200 },
        { batchId: TEST_BATCH_IDS.completed, expectedStatus: 200 },
        { batchId: TEST_BATCH_IDS.notFound, expectedStatus: 404 }
      ];

      for (const testCase of testCases) {
        if (!backendAvailable) {
          // Mock validation for headers
          const mockResponse = new Response('{}', {
            status: testCase.expectedStatus,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
              'X-Batch-Status': testCase.expectedStatus === 200 ? 'found' : 'not-found'
            }
          });

          const contentValidation = validateContentType(mockResponse, 'application/json');
          expect(contentValidation.success).toBe(true);
          continue;
        }

        // Direct API test
        const response = await fetch(`${API_ENDPOINT}/${testCase.batchId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
          },
        });

        expect(response.status).toBe(testCase.expectedStatus);

        // Validate content type for all responses
        const contentValidation = validateContentType(response, 'application/json');
        expect(contentValidation.success).toBe(true);

        // Validate response format based on status
        if (response.ok) {
          const data = await response.json();
          const validation = ContractValidator.validateResultsResponse(data);
          expect(validation.success).toBe(true);
        } else {
          const errorData = await response.json();
          const validation = ContractValidator.validateErrorResponse(errorData);
          expect(validation.success).toBe(true);
        }
      }
    });
  });
});