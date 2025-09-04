/**
 * API Middleware Security Testing  
 * Tests for Task 1.5: Security Modules Testing
 * 
 * Coverage Areas:
 * - Authentication middleware validation
 * - Rate limiting implementation
 * - CORS header security
 * - Security header application
 * - Input validation integration
 * - Error handling security
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware, createOptionsHandler } from '@/lib/api/middleware';

// Mock NextResponse properly
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    url: typeof input === 'string' ? input : input?.url || '',
    method: init?.method || 'GET',
    headers: new Headers(init?.headers || {}),
    json: jest.fn().mockResolvedValue({}),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      headers: new global.Headers(init?.headers || {}),
      json: jest.fn().mockResolvedValue(data),
    })),
    next: jest.fn().mockImplementation(() => ({
      status: 200,
      headers: new global.Headers(),
    })),
  }
}));

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/api/rateLimiter', () => ({
  rateLimiter: {
    check: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logError: jest.fn(),
}));

jest.mock('@/lib/api/proxy', () => ({
  getClientIP: jest.fn().mockReturnValue('192.168.1.1'),
}));

// Import mocked dependencies
import { auth } from '@clerk/nextjs/server';
import { rateLimiter } from '@/lib/api/rateLimiter';
import { logError } from '@/lib/utils/logger';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockRateLimiter = rateLimiter as jest.Mocked<typeof rateLimiter>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe('API Middleware Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockAuth.mockResolvedValue({ userId: 'user_123' });
    mockRateLimiter.check.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 3600000
    });
  });

  describe('Authentication Security', () => {
    it('should require authentication when auth: true', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        auth: true
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
      
      const body = await response.json();
      expect(body.title).toBe('unauthorized');
    });

    it('should allow access with valid authentication', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        auth: true
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request);
      expect(request.headers.get('X-User-ID')).toBe('user_123');
    });

    it('should handle authentication errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Auth service error'));
      
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        auth: true
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(mockLogError).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
      
      const body = await response.json();
      expect(body.detail).toBe('Invalid authentication');
    });

    it('should not require auth when auth: false or undefined', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
        // auth not specified, should default to false
      });

      const request = new NextRequest('http://localhost:3000/api/public');
      await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request);
      expect(mockAuth).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits', async () => {
      mockRateLimiter.check.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 3600000
      });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'upload'
      });

      const request = new NextRequest('http://localhost:3000/api/upload');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
      
      const body = await response.json();
      expect(body.title).toBe('rate_limit_exceeded');
    });

    it('should add rate limit headers to error responses', async () => {
      const resetTime = Date.now() + 3600000;
      mockRateLimiter.check.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: resetTime
      });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'upload'
      });

      const request = new NextRequest('http://localhost:3000/api/upload');
      const response = await wrappedHandler(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(Math.ceil(resetTime / 1000).toString());
      expect(response.headers.get('Retry-After')).toBeTruthy();
    });

    it('should add rate limit headers to successful responses', async () => {
      const resetTime = Date.now() + 3600000;
      mockRateLimiter.check.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 8,
        reset: resetTime
      });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'upload'
      });

      const request = new NextRequest('http://localhost:3000/api/upload');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('8');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('should handle different rate limits for different endpoints', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      
      // Test upload endpoint
      const uploadHandler = withAPIMiddleware(handler, { endpoint: 'upload' });
      await uploadHandler(new NextRequest('http://localhost:3000/api/upload'));
      
      // Test auth endpoint  
      const authHandler = withAPIMiddleware(handler, { endpoint: 'auth' });
      await authHandler(new NextRequest('http://localhost:3000/api/auth/login'));
      
      expect(mockRateLimiter.check).toHaveBeenCalledWith('192.168.1.1', 'upload');
      expect(mockRateLimiter.check).toHaveBeenCalledWith('192.168.1.1', 'auth');
    });

    it('should handle rate limiter failures gracefully', async () => {
      mockRateLimiter.check.mockRejectedValue(new Error('Redis connection failed'));

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith('API error in default:', expect.any(Error));
    });
  });

  describe('CORS Security', () => {
    it('should add CORS headers when cors: true', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        cors: true,
        methods: ['GET', 'POST']
      });

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { Origin: 'http://localhost:3000' }
      });
      const response = await wrappedHandler(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET, POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });

    it('should validate origin against allowed list', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        cors: true
      });

      // Test with disallowed origin
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { Origin: 'http://evil-site.com' }
      });
      const response = await wrappedHandler(request);

      // Should not set CORS headers for unauthorized origin
      const origin = response.headers.get('Access-Control-Allow-Origin');
      expect(origin).not.toBe('http://evil-site.com');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const optionsHandler = createOptionsHandler(['GET', 'POST', 'DELETE']);
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:3000' }
      });
      
      const response = await optionsHandler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET, POST, DELETE');
    });
  });

  describe('Security Headers Application', () => {
    it('should apply security headers to all responses', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      // Check that security headers are applied
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply security headers to error responses', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default',
        auth: true
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should apply security headers to rate limit error responses', async () => {
      mockRateLimiter.check.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        reset: Date.now() + 3600000
      });

      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'upload'
      });

      const request = new NextRequest('http://localhost:3000/api/upload');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });
  });

  describe('Error Handling Security', () => {
    it('should handle handler errors without leaking sensitive information', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Database password is 12345'));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      expect(mockLogError).toHaveBeenCalledWith('API error in default:', expect.any(Error));
      
      const body = await response.json();
      expect(body.detail).not.toContain('Database password');
      expect(body.title).toBe('internal_error');
    });

    it('should sanitize error messages in responses', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('SQL injection attempt: DROP TABLE users'));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      const response = await wrappedHandler(request);

      const body = await response.json();
      expect(body.detail).not.toContain('DROP TABLE');
      expect(body.detail).not.toContain('SQL injection');
    });
  });

  describe('IP Address Validation', () => {
    it('should properly extract client IP for rate limiting', async () => {
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ message: 'success' }));
      const wrappedHandler = withAPIMiddleware(handler, {
        endpoint: 'default'
      });

      const request = new NextRequest('http://localhost:3000/api/test');
      await wrappedHandler(request);

      expect(mockRateLimiter.check).toHaveBeenCalledWith('192.168.1.1', 'default');
    });
  });

  describe('Method Validation', () => {
    it('should respect method restrictions in CORS', async () => {
      const optionsHandler = createOptionsHandler(['GET', 'POST']);
      
      const request = new NextRequest('http://localhost:3000/api/test', {
        method: 'OPTIONS'
      });
      
      const response = await optionsHandler(request);
      const allowedMethods = response.headers.get('Access-Control-Allow-Methods');
      
      expect(allowedMethods).toBe('GET, POST');
      expect(allowedMethods).not.toContain('DELETE');
      expect(allowedMethods).not.toContain('PUT');
    });
  });
});