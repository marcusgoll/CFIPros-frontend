/**
 * Tests for /api/results route handler
 * Testing public results access endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/results/[id]/route';
import { APIError } from '@/lib/api/errors';

// Mock the proxy request function
jest.mock('@/lib/api/proxy', () => ({
  proxyRequest: jest.fn(),
  getClientIP: jest.fn().mockReturnValue('test-client-ip'),
}));

// Mock validation
jest.mock('@/lib/api/validation', () => ({
  validateRequest: {
    resultId: jest.fn().mockReturnValue({ isValid: true }),
  },
}));

describe('/api/results', () => {
  let mockProxyRequest: jest.MockedFunction<any>;
  let mockValidateRequest: any;

  beforeEach(() => {
    const { proxyRequest } = require('@/lib/api/proxy');
    const { validateRequest } = require('@/lib/api/validation');
    
    mockProxyRequest = proxyRequest;
    mockValidateRequest = validateRequest;
    jest.clearAllMocks();
    
    // Reset validation mock to return valid by default
    mockValidateRequest.resultId.mockReturnValue({ isValid: true });
  });

  describe('GET /api/results/[id]', () => {
    it('should successfully retrieve results for valid ID', async () => {
      // Arrange
      const resultId = 'test-result-123';
      const mockResult = {
        id: resultId,
        status: 'completed',
        filename: 'test-report.pdf',
        uploaded_at: '2024-01-01T00:00:00Z',
        processed_at: '2024-01-01T00:01:00Z',
        analysis: {
          acs_codes: ['PA.I.A.K1', 'PA.I.B.K2'],
          weak_areas: ['Pre-flight Procedures', 'Weather Systems'],
          score_breakdown: {
            overall: 85,
            areas: {
              'Pre-flight Procedures': 75,
              'Weather Systems': 80,
              'Emergency Procedures': 95,
            },
          },
          recommendations: [
            'Focus more on pre-flight checklist procedures',
            'Review weather pattern recognition',
          ],
        },
      };

      mockProxyRequest.mockResolvedValue(NextResponse.json(mockResult, { status: 200 }));

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockResult);
      expect(mockProxyRequest).toHaveBeenCalledWith(request, `/results/${resultId}`, {
        headers: { 'X-Client-IP': 'test-client-ip' },
      });
    });

    it('should return 404 for non-existent results', async () => {
      // Arrange
      const resultId = 'non-existent-id';
      const errorResponse = NextResponse.json(
        {
          type: 'about:blank#result_not_found',
          title: 'result_not_found',
          detail: `Result ${resultId} not found`,
        },
        { status: 404 }
      );
      mockProxyRequest.mockResolvedValue(errorResponse);

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.type).toBe('about:blank#result_not_found');
      expect(data.title).toBe('result_not_found');
      expect(data.detail).toBe(`Result ${resultId} not found`);
    });

    it('should validate result ID format', async () => {
      // Arrange
      const invalidId = 'invalid-id-format-@#$';
      mockValidateRequest.resultId.mockReturnValue({
        isValid: false,
        error: 'Invalid result ID format',
      });

      const request = new NextRequest(`http://localhost:3000/api/results/${invalidId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: invalidId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe('about:blank#validation_error');
      expect(data.title).toBe('validation_error');
      expect(data.detail).toContain('Invalid result ID format');
    });

    it('should handle processing status correctly', async () => {
      // Arrange
      const resultId = 'processing-result-123';
      const processingResult = {
        id: resultId,
        status: 'processing',
        filename: 'test-report.pdf',
        uploaded_at: '2024-01-01T00:00:00Z',
        progress: 75,
        estimated_completion: '2024-01-01T00:02:00Z',
      };

      const mockResponse = NextResponse.json(processingResult, { status: 200 });
      mockResponse.headers.set('Cache-Control', 'no-cache');
      mockProxyRequest.mockResolvedValue(mockResponse);

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });
      const data = await response.json();

      // Debug - log response for debugging
      if (response.status !== 200) {
        console.log('Unexpected status:', response.status, 'Data:', data);
      }

      // Assert
      expect(response.status).toBe(200);
      expect(data.status).toBe('processing');
      expect(data.progress).toBe(75);
      expect(data).toHaveProperty('estimated_completion');
      // Note: Cache-Control header is set by the route handler, not the proxy
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
    });

    it('should apply appropriate caching for completed results', async () => {
      // Arrange
      const resultId = 'completed-result-123';
      const completedResult = {
        id: resultId,
        status: 'completed',
        filename: 'test-report.pdf',
        analysis: { acs_codes: ['PA.I.A.K1'] },
      };

      mockProxyRequest.mockResolvedValue(NextResponse.json(completedResult, { status: 200 }));

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });

      // Assert
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
      expect(response.headers.get('ETag')).toBe(`"result-${resultId}"`);
    });

    it('should handle rate limiting for results endpoint', async () => {
      // Arrange - Mock proxy to always return success to test just rate limiting
      const resultId = 'test-result-123';
      const mockResult = { id: resultId, status: 'completed' };
      mockProxyRequest.mockResolvedValue(NextResponse.json(mockResult, { status: 200 }));

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act - Make enough requests to trigger rate limit (100 is the limit for results endpoint)
      let lastResponse;
      let responses = [];
      
      // Make 101 requests to exceed the rate limit of 100 requests per hour for results endpoint
      for (let i = 0; i <= 100; i++) {
        lastResponse = await GET(request, { params: Promise.resolve({ id: resultId }) });
        responses.push({ status: lastResponse.status, i });
        
        // Break early if we hit rate limit
        if (lastResponse.status === 429) {
          break;
        }
      }

      const data = await lastResponse!.json();

      // Assert - Should eventually hit rate limit
      expect(lastResponse!.status).toBe(429);
      expect(data.type).toBe('about:blank#rate_limit_exceeded');
      expect(data.title).toBe('rate_limit_exceeded');
      expect(lastResponse!.headers.get('X-RateLimit-Limit')).toBe('100');
    });

    it('should include security headers', async () => {
      // Arrange
      const resultId = 'test-result-123';
      mockProxyRequest.mockResolvedValue(NextResponse.json({ id: resultId, status: 'completed' }, { status: 200 }));

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });

      // Assert
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should handle backend timeouts gracefully', async () => {
      // Arrange - Use unique client IP to avoid rate limiting from previous tests
      const { getClientIP } = require('@/lib/api/proxy');
      getClientIP.mockReturnValue('timeout-test-client-ip');
      
      const resultId = 'test-result-123';
      const errorResponse = NextResponse.json(
        {
          type: 'about:blank#request_timeout',
          title: 'request_timeout',
          detail: 'Backend request timed out',
        },
        { status: 504 }
      );
      mockProxyRequest.mockResolvedValue(errorResponse);

      const request = new NextRequest(`http://localhost:3000/api/results/${resultId}`, {
        method: 'GET',
      });

      // Act
      const response = await GET(request, { params: Promise.resolve({ id: resultId }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(504);
      expect(data.type).toBe('about:blank#request_timeout');
      expect(data.detail).toBe('Backend request timed out');
    });
  });
});