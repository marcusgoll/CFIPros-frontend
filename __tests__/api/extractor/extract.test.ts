/**
 * Tests for ACS Extractor API Route - File Processing
 */

import { POST } from '@/app/api/extractor/extract/route';
import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/api/middleware', () => ({
  withAPIMiddleware: vi.fn((handler) => handler),
  createOptionsHandler: vi.fn(() => () => new Response('OK')),
}));

vi.mock('@/lib/api/validation', () => ({
  validateRequest: {
    fileUpload: vi.fn(),
  },
}));

vi.mock('@/lib/api/proxy', () => ({
  proxyFileUpload: vi.fn(),
  getClientIP: vi.fn(() => '192.168.1.1'),
  addCorrelationId: vi.fn(() => 'test-correlation-id'),
}));

vi.mock('@/lib/security/fileUpload', () => ({
  FileUploadRateLimiter: {
    checkRateLimit: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/telemetry', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/api/errors', () => ({
  CommonErrors: {
    RATE_LIMIT_EXCEEDED: vi.fn((msg) => ({ type: 'RATE_LIMIT_EXCEEDED', message: msg })),
    NO_FILE_PROVIDED: vi.fn((msg) => ({ type: 'NO_FILE_PROVIDED', message: msg })),
    FILE_TOO_LARGE: vi.fn((msg) => ({ type: 'FILE_TOO_LARGE', message: msg })),
    UNSUPPORTED_FILE_TYPE: vi.fn((msg) => ({ type: 'UNSUPPORTED_FILE_TYPE', message: msg })),
    VALIDATION_ERROR: vi.fn((msg) => ({ type: 'VALIDATION_ERROR', message: msg })),
    INTERNAL_SERVER_ERROR: vi.fn((msg, id) => ({ type: 'INTERNAL_SERVER_ERROR', message: msg, correlationId: id })),
  },
  handleAPIError: vi.fn((error) => Response.json({ error: error.type, message: error.message }, { status: 400 })),
}));

import { validateRequest } from '@/lib/api/validation';
import { proxyFileUpload } from '@/lib/api/proxy';
import { FileUploadRateLimiter } from '@/lib/security/fileUpload';
import { trackEvent } from '@/lib/analytics/telemetry';
import { handleAPIError } from '@/lib/api/errors';

describe('/api/extractor/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rate Limiting', () => {
    it('blocks requests when rate limit exceeded', async () => {
      const mockRateLimit = vi.mocked(FileUploadRateLimiter.checkRateLimit);
      mockRateLimit.mockReturnValue({
        allowed: false,
        remainingUploads: 0,
        resetTime: Date.now() + 3600000,
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      const response = await POST(request);
      
      expect(mockRateLimit).toHaveBeenCalledWith('192.168.1.1', 20, 3600000);
      expect(handleAPIError).toHaveBeenCalled();
    });

    it('allows requests within rate limit', async () => {
      const mockRateLimit = vi.mocked(FileUploadRateLimiter.checkRateLimit);
      mockRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });

      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: true,
        files: [new File(['test'], 'test.pdf', { type: 'application/pdf' })],
      });

      const mockProxy = vi.mocked(proxyFileUpload);
      mockProxy.mockResolvedValue(new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers(),
      }));

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(mockRateLimit).toHaveBeenCalledWith('192.168.1.1', 20, 3600000);
      expect(mockValidation).toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      const mockRateLimit = vi.mocked(FileUploadRateLimiter.checkRateLimit);
      mockRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });
    });

    it('rejects requests with no files', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: false,
        error: 'No files provided',
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(handleAPIError).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('extractor_validation_error', expect.any(Object));
    });

    it('rejects files that exceed size limit', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: false,
        error: 'File exceeds maximum size of 10MB',
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(handleAPIError).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('extractor_validation_error', expect.any(Object));
    });

    it('rejects unsupported file types', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: false,
        error: 'Unsupported file type: text/plain',
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(handleAPIError).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('extractor_validation_error', expect.any(Object));
    });

    it('rejects more than 5 files', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: false,
        error: 'Maximum 6 files provided, but only 5 allowed',
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(handleAPIError).toHaveBeenCalled();
      expect(trackEvent).toHaveBeenCalledWith('extractor_validation_error', expect.any(Object));
    });

    it('accepts valid files', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      const testFiles = [
        new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      
      mockValidation.mockResolvedValue({
        isValid: true,
        files: testFiles,
      });

      const mockProxy = vi.mocked(proxyFileUpload);
      mockProxy.mockResolvedValue(new Response(JSON.stringify({ 
        success: true,
        report_id: 'rpt_123',
      }), {
        status: 200,
        headers: new Headers(),
      }));

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(mockValidation).toHaveBeenCalledWith(request, expect.objectContaining({
        maxFiles: 5,
        maxSize: 10 * 1024 * 1024,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        requiredField: 'files',
      }));
      expect(trackEvent).toHaveBeenCalledWith('extractor_upload_started', expect.any(Object));
    });
  });

  describe('Proxy Integration', () => {
    beforeEach(() => {
      const mockRateLimit = vi.mocked(FileUploadRateLimiter.checkRateLimit);
      mockRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });

      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: true,
        files: [new File(['test'], 'test.pdf', { type: 'application/pdf' })],
      });
    });

    it('successfully proxies valid requests to backend', async () => {
      const mockProxy = vi.mocked(proxyFileUpload);
      const mockResponse = new Response(JSON.stringify({ 
        success: true,
        report_id: 'rpt_123456',
        processing_time_ms: 2500,
      }), {
        status: 200,
        headers: new Headers(),
      });
      
      mockProxy.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      const response = await POST(request);
      
      expect(mockProxy).toHaveBeenCalledWith(request, '/v1/extract', {
        headers: expect.objectContaining({
          'X-Correlation-ID': 'test-correlation-id',
          'X-Client-IP': '192.168.1.1',
          'X-Service': 'acs-extractor',
        }),
      });
      
      expect(trackEvent).toHaveBeenCalledWith('extractor_upload_success', expect.any(Object));
    });

    it('handles backend service errors gracefully', async () => {
      const mockProxy = vi.mocked(proxyFileUpload);
      mockProxy.mockRejectedValue(new Error('Backend service unavailable'));

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(trackEvent).toHaveBeenCalledWith('extractor_upload_failed', expect.any(Object));
      expect(handleAPIError).toHaveBeenCalled();
    });

    it('includes proper headers in successful responses', async () => {
      const mockProxy = vi.mocked(proxyFileUpload);
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers(),
      });
      
      mockProxy.mockResolvedValue(mockResponse);

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      const response = await POST(request);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('10');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      const mockRateLimit = vi.mocked(FileUploadRateLimiter.checkRateLimit);
      mockRateLimit.mockReturnValue({
        allowed: true,
        remainingUploads: 10,
        resetTime: Date.now() + 3600000,
      });
    });

    it('tracks upload start events', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: true,
        files: [
          new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
          new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
        ],
      });

      const mockProxy = vi.mocked(proxyFileUpload);
      mockProxy.mockResolvedValue(new Response('{}', { status: 200, headers: new Headers() }));

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(trackEvent).toHaveBeenCalledWith('extractor_upload_started', {
        file_count: 2,
        correlation_id: 'test-correlation-id',
        client_ip: '192.168.1...',
      });
    });

    it('tracks validation errors', async () => {
      const mockValidation = vi.mocked(validateRequest.fileUpload);
      mockValidation.mockResolvedValue({
        isValid: false,
        error: 'File too large',
      });

      const request = new NextRequest('http://localhost/api/extractor/extract', {
        method: 'POST',
        body: new FormData(),
      });

      await POST(request);
      
      expect(trackEvent).toHaveBeenCalledWith('extractor_validation_error', {
        error: 'File too large',
        correlation_id: 'test-correlation-id',
        client_ip: '192.168.1.1',
      });
    });
  });
});