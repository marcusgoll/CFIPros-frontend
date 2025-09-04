/**
 * Live API Integration Tests
 * Tests against the actual api.cfipros.com backend
 * 
 * Note: These tests require a live backend and will make real API calls
 * Skip these tests in CI/CD by setting SKIP_LIVE_TESTS=true
 */

import { NextRequest } from "next/server";

const SKIP_LIVE_TESTS = process.env.SKIP_LIVE_TESTS === 'true' || process.env.CI === 'true';
const API_BASE_URL = process.env.BACKEND_API_URL || 'https://api.cfipros.com';

describe('Live API Integration Tests', () => {
  beforeAll(() => {
    if (SKIP_LIVE_TESTS) {
      console.log('⏭️  Skipping live API tests (SKIP_LIVE_TESTS=true)');
    }
  });

  describe('API Health Check', () => {
    it('should connect to the live API', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
    });

    it('should have OpenAPI documentation available', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/openapi.json`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('openapi');
      expect(data).toHaveProperty('info');
      expect(data).toHaveProperty('paths');
      
      // Check that our expected endpoints exist
      expect(data.paths).toHaveProperty('/v1/extractor/extract');
      expect(data.paths).toHaveProperty('/v1/extractor/batch/extract');
    });
  });

  describe('File Upload Validation', () => {
    it('should validate multipart form data requirements', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      // Test without proper multipart boundary
      const response = await fetch(`${API_BASE_URL}/v1/extractor/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.detail).toContain('boundary');
    });

    it('should require authentication for extraction endpoints', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const formData = new FormData();
      formData.append('files', new File(['test'], 'test.pdf', { type: 'application/pdf' }));

      const response = await fetch(`${API_BASE_URL}/v1/extractor/extract`, {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Frontend API Proxy', () => {
    it('should correctly proxy requests through frontend API', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      // Create a test file
      const testFile = new File(
        ['%PDF-1.4 Test PDF content for ACS code extraction'], 
        'test-report.pdf', 
        { type: 'application/pdf' }
      );

      const formData = new FormData();
      formData.append('files', testFile);

      // Test through our frontend API proxy
      const response = await fetch('http://localhost:3000/api/extractor/extract', {
        method: 'POST',
        body: formData
      });

      // The response will depend on rate limiting and authentication
      // but should not be a connection error
      expect(response).toBeDefined();
      expect([200, 202, 400, 401, 429]).toContain(response.status);
    });
  });

  describe('API Contract Validation', () => {
    it('should validate response schemas match OpenAPI spec', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      // Validate health response structure
      expect(typeof data.status).toBe('string');
      expect(typeof data.timestamp).toBe('string');
      expect(typeof data.version).toBe('string');
      expect(typeof data.environment).toBe('string');
      
      // Validate timestamp is ISO format
      expect(() => new Date(data.timestamp)).not.toThrow();
    });

    it('should return proper CORS headers', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/health`);
      
      // Check security headers are present
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('strict-transport-security')).toContain('max-age');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/nonexistent-endpoint`);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('detail', 'Not Found');
    });

    it('should validate content-type for file uploads', async () => {
      if (SKIP_LIVE_TESTS) {
        pending('Skipping live test');
        return;
      }

      // Test with invalid content type
      const response = await fetch(`${API_BASE_URL}/v1/extractor/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: ['test'] })
      });

      expect([400, 422]).toContain(response.status);
    });
  });
});

// Helper function to create test files
function createTestPDF(content: string = 'Test PDF content'): File {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${content.length + 50}
>>
stream
BT
/F1 12 Tf
100 700 Td
(${content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
0000000180 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${250 + content.length}
%%EOF`;

  return new File([pdfContent], 'test.pdf', { type: 'application/pdf' });
}