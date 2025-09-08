/**
 * API Contract Validation Tests
 * Tests for Zod schema validation and contract compliance
 */

import {
  ContractValidator,
  ExtractResponseSchema,
  ProcessingResultsSchema,
  ErrorResponseSchema,
  ACSSectionSchema,
  UserInfoSchema,
  validateResponseStatus,
  validateResponseHeaders,
  validateContentType,
} from '@/lib/validation/api-contracts';

describe('API Contract Validation', () => {
  describe('ContractValidator', () => {
    describe('validateExtractResponse', () => {
      test('validates correct extract response', () => {
        const validResponse = {
          batch_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'processing',
          estimated_completion: '2025-09-08T10:30:00Z',
          files_count: 2,
          files: [
            {
              id: 'file_1',
              name: 'test.pdf',
              size: 2048000,
              type: 'application/pdf',
              status: 'queued',
            },
          ],
        };

        const result = ContractValidator.validateExtractResponse(validResponse);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.batch_id).toBe('550e8400-e29b-41d4-a716-446655440000');
          expect(result.data.status).toBe('processing');
          expect(result.data.files_count).toBe(2);
        }
      });

      test('rejects invalid extract response', () => {
        const invalidResponse = {
          batch_id: 'invalid-uuid',
          status: 'invalid-status',
          files_count: 'not-a-number',
        };

        const result = ContractValidator.validateExtractResponse(invalidResponse);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.violations).toContain('batch_id: Invalid uuid');
          expect(result.violations.some(v => v.includes('status'))).toBe(true);
          expect(result.violations.some(v => v.includes('estimated_completion'))).toBe(true);
        }
      });

      test('validates files_count boundaries', () => {
        const responseWithTooManyFiles = {
          batch_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'processing',
          estimated_completion: '2025-09-08T10:30:00Z',
          files_count: 50, // Exceeds max of 30
        };

        const result = ContractValidator.validateExtractResponse(responseWithTooManyFiles);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.violations.some(v => v.includes('files_count'))).toBe(true);
        }
      });
    });

    describe('validateResultsResponse', () => {
      test('validates processing status response', () => {
        const processingResponse = {
          batch_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'processing',
          progress: 0.5,
          files_processed: 1,
          files_total: 2,
        };

        const result = ContractValidator.validateResultsResponse(processingResponse);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.batch_id).toBe('550e8400-e29b-41d4-a716-446655440000');
          expect(result.data.progress).toBe(0.5);
        }
      });

      test('validates completed results response', () => {
        const completedResponse = {
          batch_id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'completed',
          completed_at: '2025-09-08T10:35:00Z',
          results: [
            {
              file_id: 'file_1',
              file_name: 'test.pdf',
              status: 'success',
              extracted_data: {
                acs_sections: [
                  {
                    section: 'PA.I.A',
                    task: 'Certificates and Documents',
                    elements: ['Check certificates', 'Verify documents'],
                    confidence: 0.95,
                  },
                ],
                total_sections_found: 1,
                confidence_score: 0.95,
                document_type: 'aktr',
              },
              processing_time_seconds: 45.2,
            },
          ],
        };

        const result = ContractValidator.validateResultsResponse(completedResponse);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe('completed');
          expect(result.data.results).toHaveLength(1);
          expect(result.data.results[0].extracted_data?.acs_sections).toHaveLength(1);
        }
      });
    });

    describe('validateErrorResponse', () => {
      test('validates standard error response', () => {
        const errorResponse = {
          error: 'Invalid file type',
          code: 'INVALID_FILE_TYPE',
          details: {
            accepted_types: ['application/pdf', 'image/jpeg', 'image/png'],
          },
          timestamp: '2025-09-08T10:30:00Z',
        };

        const result = ContractValidator.validateErrorResponse(errorResponse);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.code).toBe('INVALID_FILE_TYPE');
          expect(result.data.details).toEqual({
            accepted_types: ['application/pdf', 'image/jpeg', 'image/png'],
          });
        }
      });

      test('validates rate limit error', () => {
        const rateLimitError = {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            retry_after: 3600,
            limit: '10 requests per hour',
          },
        };

        const result = ContractValidator.validateErrorResponse(rateLimitError);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(result.data.details?.retry_after).toBe(3600);
        }
      });

      test('rejects invalid error code', () => {
        const invalidError = {
          error: 'Some error',
          code: 'INVALID_ERROR_CODE',
        };

        const result = ContractValidator.validateErrorResponse(invalidError);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.violations.some(v => v.includes('code'))).toBe(true);
        }
      });
    });

    describe('validateFileUpload', () => {
      test('validates valid file upload', () => {
        const files = [
          new File(['content'], 'test1.pdf', { type: 'application/pdf' }),
          new File(['content'], 'test2.pdf', { type: 'application/pdf' }),
        ];

        const result = ContractValidator.validateFileUpload(files);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
        }
      });

      test('rejects empty file array', () => {
        const result = ContractValidator.validateFileUpload([]);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.violations.some(v => v.includes('files'))).toBe(true);
        }
      });

      test('rejects too many files', () => {
        const files = Array.from({ length: 31 }, (_, i) => 
          new File(['content'], `test${i}.pdf`, { type: 'application/pdf' })
        );

        const result = ContractValidator.validateFileUpload(files);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.violations.some(v => v.includes('Array must contain at most 30'))).toBe(true);
        }
      });
    });
  });

  describe('ACS Section Validation', () => {
    test('validates correct ACS section format', () => {
      const validSection = {
        section: 'PA.I.A',
        task: 'Certificates and Documents',
        elements: ['Check certificates', 'Verify documents'],
        confidence: 0.95,
        page_numbers: [1, 2],
      };

      const result = ACSSectionSchema.safeParse(validSection);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.section).toBe('PA.I.A');
        expect(result.data.confidence).toBe(0.95);
      }
    });

    test('validates complex ACS section format', () => {
      const complexSection = {
        section: 'PPT.VII.A.1a',
        task: 'Complex Task',
        elements: ['Element 1', 'Element 2', 'Element 3'],
        confidence: 0.87,
      };

      const result = ACSSectionSchema.safeParse(complexSection);
      
      expect(result.success).toBe(true);
    });

    test('rejects invalid ACS section format', () => {
      const invalidSection = {
        section: 'INVALID.FORMAT',
        task: 'Task',
        elements: ['Element'],
        confidence: 0.5,
      };

      const result = ACSSectionSchema.safeParse(invalidSection);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid ACS section format');
      }
    });

    test('validates confidence boundaries', () => {
      const invalidConfidence = {
        section: 'PA.I.A',
        task: 'Task',
        elements: ['Element'],
        confidence: 1.5, // Invalid: > 1
      };

      const result = ACSSectionSchema.safeParse(invalidConfidence);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Confidence must be between 0 and 1');
      }
    });

    test('requires at least one element', () => {
      const noElements = {
        section: 'PA.I.A',
        task: 'Task',
        elements: [],
        confidence: 0.5,
      };

      const result = ACSSectionSchema.safeParse(noElements);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one element is required');
      }
    });
  });

  describe('User Information Validation', () => {
    test('validates complete user info', () => {
      const userInfo = {
        id: 'user_123',
        email: 'test@cfipros.com',
        first_name: 'John',
        last_name: 'Pilot',
        org_id: 'org_456',
        org_role: 'student',
        permissions: ['read_files', 'upload_files'],
      };

      const result = UserInfoSchema.safeParse(userInfo);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.org_role).toBe('student');
        expect(result.data.permissions).toEqual(['read_files', 'upload_files']);
      }
    });

    test('validates minimal user info', () => {
      const minimalUser = {
        id: 'user_123',
        email: 'test@cfipros.com',
        org_role: 'instructor',
      };

      const result = UserInfoSchema.safeParse(minimalUser);
      
      expect(result.success).toBe(true);
    });

    test('rejects invalid email format', () => {
      const invalidEmail = {
        id: 'user_123',
        email: 'not-an-email',
        org_role: 'student',
      };

      const result = UserInfoSchema.safeParse(invalidEmail);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email');
      }
    });

    test('rejects invalid org role', () => {
      const invalidRole = {
        id: 'user_123',
        email: 'test@cfipros.com',
        org_role: 'invalid_role',
      };

      const result = UserInfoSchema.safeParse(invalidRole);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Invalid enum value");
      }
    });
  });
});

describe('Response Validation Utilities', () => {
  describe('validateResponseStatus', () => {
    test('accepts expected status code', () => {
      const response = new Response(null, { status: 200 });
      const result = validateResponseStatus(response, [200, 202]);
      
      expect(result.success).toBe(true);
    });

    test('rejects unexpected status code', () => {
      const response = new Response(null, { status: 404 });
      const result = validateResponseStatus(response, [200, 202]);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unexpected status code: expected one of [200, 202], got 404');
      }
    });
  });

  describe('validateResponseHeaders', () => {
    test('validates CORS headers for OPTIONS request', () => {
      const response = new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });

      const result = validateResponseHeaders(response, 'OPTIONS /api/extract');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.headers['access-control-allow-origin']).toBe('*');
      }
    });

    test('detects missing CORS headers', () => {
      const response = new Response(null, { status: 200 });
      
      const result = validateResponseHeaders(response, 'OPTIONS /api/extract');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.missing).toContain('Access-Control-Allow-Origin');
        expect(result.missing).toContain('Access-Control-Allow-Methods');
        expect(result.missing).toContain('Access-Control-Allow-Headers');
      }
    });

    test('validates rate limit headers for 429 response', () => {
      const response = new Response(null, {
        status: 429,
        headers: {
          'Retry-After': '3600',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Reset': '1694102400',
        },
      });

      const result = validateResponseHeaders(response, 'POST /api/extract');
      
      expect(result.success).toBe(true);
    });

    test('detects missing rate limit headers', () => {
      const response = new Response(null, { status: 429 });
      
      const result = validateResponseHeaders(response, 'POST /api/extract');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.missing).toContain('Retry-After');
        expect(result.missing).toContain('X-RateLimit-Limit');
        expect(result.missing).toContain('X-RateLimit-Reset');
      }
    });
  });

  describe('validateContentType', () => {
    test('accepts correct content type', () => {
      const response = new Response(null, {
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });

      const result = validateContentType(response, 'application/json');
      
      expect(result.success).toBe(true);
    });

    test('rejects incorrect content type', () => {
      const response = new Response(null, {
        headers: { 'Content-Type': 'text/html' },
      });

      const result = validateContentType(response, 'application/json');
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Expected Content-Type to include 'application/json', got 'text/html'");
      }
    });

    test('handles missing content type', () => {
      const response = new Response(null);

      const result = validateContentType(response);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("got 'null'");
      }
    });
  });
});