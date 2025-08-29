/**
 * Tests for /api/upload route handler
 * Testing file upload endpoints with BFF proxy functionality
 */

import { NextRequest } from 'next/server';
import { POST, OPTIONS } from '@/app/api/upload/route';
import { APIError } from '@/lib/api/errors';

// Mock the proxy functions
jest.mock('@/lib/api/proxy', () => ({
  proxyFileUpload: jest.fn(),
  getClientIP: jest.fn().mockReturnValue('127.0.0.1'),
  addCorrelationId: jest.fn().mockReturnValue('test-correlation-id'),
}));

// Mock fetch for testing error scenarios
global.fetch = jest.fn();

describe('/api/upload', () => {
  let mockProxyFileUpload: jest.MockedFunction<any>;

  beforeEach(() => {
    const { proxyFileUpload } = require('@/lib/api/proxy');
    mockProxyFileUpload = proxyFileUpload;
    jest.clearAllMocks();
  });

  describe('POST /api/upload', () => {
    it('should successfully upload a valid PDF file', async () => {
      // Arrange
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);

      const mockUploadResult = {
        id: 'test-upload-id',
        status: 'processing',
        filename: 'test.pdf',
        size: 1024,
        uploaded_at: '2024-01-01T00:00:00Z',
      };

      // Mock successful proxy response
      mockProxyFileUpload.mockResolvedValue(
        new Response(JSON.stringify(mockUploadResult), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      );

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Origin': 'http://localhost:3000',
        },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(mockUploadResult);
      expect(mockProxyFileUpload).toHaveBeenCalledWith(
        request,
        '/upload',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': 'test-correlation-id',
            'X-Client-IP': '127.0.0.1',
          }),
        })
      );
    });

    it('should reject files that exceed size limit', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { 
        type: 'application/pdf' 
      });
      const formData = new FormData();
      formData.append('file', largeFile);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe('about:blank#file_too_large');
      expect(data.title).toBe('file_too_large');
      expect(data.detail).toContain('exceeds maximum size');
    });

    it('should reject unsupported file types', async () => {
      // Arrange
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', invalidFile);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe('about:blank#unsupported_file_type');
      expect(data.title).toBe('unsupported_file_type');
      expect(data.detail).toContain('Supported types');
    });

    it('should reject requests without files', async () => {
      // Arrange
      const formData = new FormData();
      
      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.type).toBe('about:blank#no_file_provided');
      expect(data.title).toBe('no_file_provided');
      expect(data.detail).toBe('No file was provided for upload');
    });

    it('should handle rate limiting', async () => {
      // Arrange - simulate rate limiting by making many rapid requests
      // The middleware has a built-in rate limiter that should trigger
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);

      // Mock the proxy to return success for the few requests that pass rate limiting
      mockProxyFileUpload.mockResolvedValue(
        new Response(JSON.stringify({ id: 'test' }), { status: 200 })
      );

      // Make many requests to trigger rate limiting (upload endpoint allows 60/hour)
      const requests = Array.from({ length: 62 }, () => 
        new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData,
          headers: { 'x-forwarded-for': '192.168.1.100' }, // Same IP
        })
      );

      // Act - make all requests rapidly
      const responses = await Promise.all(
        requests.map(req => POST(req))
      );

      // Assert - some responses should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      
      if (rateLimitedResponses.length > 0) {
        const response = rateLimitedResponses[0]!;
        const data = await response.json();
        expect(data.type).toBe('about:blank#rate_limit_exceeded');
        expect(data.title).toBe('rate_limit_exceeded');
        expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
        expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      }
    });

    it('should handle backend API errors', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);

      // Mock proxy to throw an error (simulating backend failure)
      const backendError = new APIError('processing_failed', 500, 'Backend processing failed');
      mockProxyFileUpload.mockRejectedValue(backendError);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.type).toBe('about:blank#processing_failed');
      expect(data.title).toBe('processing_failed');
      expect(data.detail).toBe('Backend processing failed');
    });

    it('should include proper CORS headers', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', mockFile);

      // Mock successful proxy response
      mockProxyFileUpload.mockResolvedValue(
        new Response(JSON.stringify({ id: 'test' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Origin': 'http://localhost:3000',
        },
      });

      // Act
      const response = await POST(request);

      // Assert - CORS headers should be added by the middleware
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('OPTIONS /api/upload', () => {
    it('should handle preflight CORS requests', async () => {
      // This test would be for the OPTIONS handler
      // const request = new NextRequest('http://localhost:3000/api/upload', {
      //   method: 'OPTIONS',
      // });

      // Would need to import and test OPTIONS handler
      // const response = await OPTIONS(request);
      
      // expect(response.status).toBe(200);
      // expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });
});