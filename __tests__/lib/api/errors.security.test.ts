/**
 * Error Handling Security Testing
 * Tests for Task 1.5: Security Modules Testing
 * 
 * Coverage Areas:
 * - Information disclosure prevention in error messages
 * - Security header application in error responses
 * - CORS handling in error scenarios
 * - Rate limit error responses
 * - Problem Details format compliance
 * - Error sanitization
 * - Stack trace protection
 */

import { NextResponse } from 'next/server';
import { APIError, CommonErrors, handleAPIError, addSecurityHeaders, addCORSHeaders, createRateLimitErrorResponse } from '@/lib/api/errors';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn(),
}));

import { logError } from '@/lib/utils/logger';
const mockLogError = logError as jest.MockedFunction<typeof logError>;

describe('Error Handling Security', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Information Disclosure Prevention', () => {
    it('should not expose sensitive information in error messages', async () => {
      const sensitiveErrors = [
        new Error('Database connection failed: password=secret123 host=db.internal'),
        new Error('JWT secret key is jwt_secret_key_12345'),
        new Error('Redis password: redis_password_456'),
        new Error('API key validation failed: sk-1234567890abcdef'),
        new Error('SQL query failed: SELECT * FROM users WHERE password = "secret"'),
        new Error('File path: /var/www/app/.env contains DATABASE_PASSWORD=secret'),
        new Error('Session secret: session_secret_xyz789'),
        new Error('Private key: -----BEGIN PRIVATE KEY----- MII...')
      ];

      for (const error of sensitiveErrors) {
        const response = handleAPIError(error);
        const body = await response.json();
        
        // Should not contain sensitive patterns
        expect(body.detail).not.toContain('password');
        expect(body.detail).not.toContain('secret');
        expect(body.detail).not.toContain('key');
        expect(body.detail).not.toContain('token');
        expect(body.detail).not.toContain('127.0.0.1');
        expect(body.detail).not.toContain('localhost');
        expect(body.detail).not.toContain('SELECT');
        expect(body.detail).not.toContain('BEGIN PRIVATE KEY');
        
        // Should use generic error message
        expect(body.detail).toBe('Internal server error');
        expect(body.title).toBe('internal_error');
        expect(response.status).toBe(500);
      }
    });

    it('should sanitize stack traces from production errors', async () => {
      const errorWithStack = new Error('Database connection failed');
      errorWithStack.stack = `Error: Database connection failed
    at Database.connect (/var/www/app/src/database.js:123:45)
    at API.handler (/var/www/app/src/api.js:67:89)
    at /var/www/app/.env:1:1234`;

      const response = handleAPIError(errorWithStack);
      const body = await response.json();
      
      // Should not expose file paths or stack trace
      expect(body.detail).not.toContain('/var/www');
      expect(body.detail).not.toContain('.js:');
      expect(body.detail).not.toContain('at ');
      expect(body.detail).not.toContain('.env');
    });

    it('should not expose internal error codes or debugging info', async () => {
      const debugErrors = [
        new Error('ECONNREFUSED: Connection refused to 192.168.1.100:5432'),
        new Error('ENOTFOUND: DNS lookup failed for internal-db.company.com'),
        new Error('ETIMEDOUT: Operation timeout after 30000ms'),
        new Error('Error code: DB_CONNECTION_POOL_EXHAUSTED'),
        new Error('Debug: User role check failed for user_id=12345'),
        new Error('Trace ID: trace-abc-123-def-456')
      ];

      for (const error of debugErrors) {
        const response = handleAPIError(error);
        const body = await response.json();
        
        // Should use generic error message
        expect(body.detail).toBe('Internal server error');
        expect(body.detail).not.toContain('ECONNREFUSED');
        expect(body.detail).not.toContain('ENOTFOUND');
        expect(body.detail).not.toContain('192.168.');
        expect(body.detail).not.toContain('internal-db');
        expect(body.detail).not.toContain('user_id=');
        expect(body.detail).not.toContain('trace-');
      }
    });

    it('should log detailed errors internally while returning generic messages', async () => {
      const detailedError = new Error('Detailed internal error with sensitive data');
      
      handleAPIError(detailedError);
      
      // Should log the actual error for debugging
      expect(mockLogError).toHaveBeenCalledWith('Unhandled API error:', detailedError);
    });
  });

  describe('APIError Security', () => {
    it('should create secure APIError instances', () => {
      const error = new APIError('test_error', 400, 'Test error message');
      
      expect(error.code).toBe('test_error');
      expect(error.status).toBe(400);
      expect(error.detail).toBe('Test error message');
      expect(error.name).toBe('APIError');
    });

    it('should convert to Problem Details format securely', () => {
      const error = new APIError('validation_error', 400, 'Invalid input data', 'req-123');
      const problemDetails = error.toProblemDetails();
      
      expect(problemDetails.type).toBe('about:blank#validation_error');
      expect(problemDetails.title).toBe('validation_error');
      expect(problemDetails.status).toBe(400);
      expect(problemDetails.detail).toBe('Invalid input data');
      expect(problemDetails.instance).toBe('req-123');
    });

    it('should handle backend errors securely', () => {
      const backendError = {
        type: 'validation_error',
        title: 'validation_error',
        status: 400,
        detail: 'User input validation failed',
        instance: 'req-456'
      };

      const apiError = APIError.fromBackendError(backendError);
      
      expect(apiError.code).toBe('validation_error');
      expect(apiError.status).toBe(400);
      expect(apiError.detail).toBe('User input validation failed');
      expect(apiError.instance).toBe('req-456');
    });

    it('should sanitize malicious backend error responses', () => {
      const maliciousBackendError = {
        type: '<script>alert("XSS")</script>',
        title: 'validation_error<script>alert("XSS")</script>',
        status: 400,
        detail: 'Error: <img src=x onerror=alert("XSS")>',
        instance: 'javascript:alert("XSS")'
      };

      const apiError = APIError.fromBackendError(maliciousBackendError);
      
      // Should not create XSS vulnerability
      expect(apiError.code).not.toContain('<script>');
      expect(apiError.detail).not.toContain('<img');
      expect(apiError.instance).not.toContain('javascript:');
    });
  });

  describe('Common Errors Security', () => {
    it('should provide secure predefined error types', () => {
      const errors = [
        CommonErrors.UNAUTHORIZED(),
        CommonErrors.FORBIDDEN(),
        CommonErrors.VALIDATION_ERROR('Invalid input'),
        CommonErrors.INVALID_REQUEST('Bad request'),
        CommonErrors.NOT_FOUND(),
        CommonErrors.RATE_LIMIT_EXCEEDED(),
        CommonErrors.FILE_TOO_LARGE(),
        CommonErrors.INTERNAL_ERROR()
      ];

      for (const error of errors) {
        expect(error).toBeInstanceOf(APIError);
        expect(error.status).toBeGreaterThanOrEqual(400);
        expect(error.status).toBeLessThan(600);
        expect(error.code).toBeTruthy();
        expect(error.detail).toBeTruthy();
        
        // Should not contain sensitive information
        expect(error.detail).not.toContain('password');
        expect(error.detail).not.toContain('secret');
        expect(error.detail).not.toContain('token');
      }
    });

    it('should validate error status codes', () => {
      expect(CommonErrors.UNAUTHORIZED().status).toBe(401);
      expect(CommonErrors.FORBIDDEN().status).toBe(403);
      expect(CommonErrors.NOT_FOUND().status).toBe(404);
      expect(CommonErrors.RATE_LIMIT_EXCEEDED().status).toBe(429);
      expect(CommonErrors.INTERNAL_ERROR().status).toBe(500);
      expect(CommonErrors.BACKEND_ERROR().status).toBe(502);
      expect(CommonErrors.REQUEST_TIMEOUT().status).toBe(504);
    });
  });

  describe('Security Headers in Error Responses', () => {
    it('should apply security headers to error responses', () => {
      const response = new NextResponse('Error', { status: 500 });
      const secureResponse = addSecurityHeaders(response);
      
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('DENY');
      expect(secureResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(secureResponse.headers.get('Strict-Transport-Security')).toBeTruthy();
      expect(secureResponse.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(secureResponse.headers.get('Referrer-Policy')).toBeTruthy();
    });

    it('should not overwrite existing security headers', () => {
      const response = new NextResponse('Error', { 
        status: 500,
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'Custom-Header': 'value'
        }
      });
      
      const secureResponse = addSecurityHeaders(response);
      
      // Should preserve existing headers when they exist
      expect(secureResponse.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(secureResponse.headers.get('Custom-Header')).toBe('value');
      
      // Should add missing headers
      expect(secureResponse.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should include security headers in APIError responses', async () => {
      const error = CommonErrors.VALIDATION_ERROR('Invalid input');
      const response = handleAPIError(error);
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });
  });

  describe('CORS Security in Errors', () => {
    it('should validate origins in CORS error responses', () => {
      const response = new NextResponse('Error', { status: 500 });
      const request = {
        headers: {
          get: (name: string) => name === 'origin' ? 'https://cfipros.com' : null
        }
      } as any;
      
      const corsResponse = addCORSHeaders(response, request);
      
      // Should only allow whitelisted origins
      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://cfipros.com');
    });

    it('should reject malicious origins in CORS', () => {
      const response = new NextResponse('Error', { status: 500 });
      const maliciousOrigins = [
        'http://evil-site.com',
        'https://phishing-cfipros.com',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'null',
        ''
      ];

      for (const origin of maliciousOrigins) {
        const request = {
          headers: {
            get: (name: string) => name === 'origin' ? origin : null
          }
        } as any;
        
        const corsResponse = addCORSHeaders(response, request);
        
        // Should not set CORS header for malicious origin
        expect(corsResponse.headers.get('Access-Control-Allow-Origin')).not.toBe(origin);
      }
    });

    it('should set secure CORS headers', () => {
      const response = new NextResponse('Error', { status: 500 });
      const request = {
        headers: {
          get: (name: string) => name === 'origin' ? 'http://localhost:3000' : null
        }
      } as any;
      
      const corsResponse = addCORSHeaders(response, request, 'GET, POST');
      
      expect(corsResponse.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST');
      expect(corsResponse.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization, X-Correlation-ID');
      expect(corsResponse.headers.get('Access-Control-Allow-Credentials')).toBe('true');
      expect(corsResponse.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('Rate Limit Error Security', () => {
    it('should create secure rate limit error responses', () => {
      const resetTime = Date.now() + 3600000; // 1 hour from now
      const response = createRateLimitErrorResponse(100, 0, resetTime);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(response.headers.get('Retry-After')).toBeTruthy();
      
      // Should include security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should include proper retry timing in rate limit errors', async () => {
      const resetTime = Date.now() + 3600000;
      const response = createRateLimitErrorResponse(10, 0, resetTime);
      
      const retryAfter = response.headers.get('Retry-After');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');
      
      expect(parseInt(retryAfter || '0')).toBeGreaterThan(0);
      expect(parseInt(rateLimitReset || '0')).toBeGreaterThan(Math.floor(Date.now() / 1000));
      
      const body = await response.json();
      expect(body.title).toBe('rate_limit_exceeded');
      expect(body.detail).toContain('Try again after');
    });

    it('should not leak internal timing information', async () => {
      const resetTime = Date.now() + 3600000;
      const response = createRateLimitErrorResponse(10, 0, resetTime);
      
      const body = await response.json();
      
      // Should not expose internal timestamps or server time
      expect(body.detail).not.toContain(Date.now().toString());
      expect(body.detail).not.toContain(resetTime.toString());
    });
  });

  describe('Error Response Format Security', () => {
    it('should follow RFC 7807 Problem Details format', async () => {
      const error = CommonErrors.VALIDATION_ERROR('Invalid email format');
      const response = handleAPIError(error);
      const body = await response.json();
      
      // Should follow Problem Details format
      expect(body.type).toContain('about:blank#');
      expect(body.title).toBeTruthy();
      expect(body.status).toBe(400);
      expect(body.detail).toBeTruthy();
      expect(body.instance).toBeTruthy();
    });

    it('should include unique instance IDs for tracking', async () => {
      const error1 = CommonErrors.INTERNAL_ERROR();
      const error2 = CommonErrors.INTERNAL_ERROR();
      
      const response1 = handleAPIError(error1);
      const response2 = handleAPIError(error2);
      
      const body1 = await response1.json();
      const body2 = await response2.json();
      
      // Should have unique instance IDs
      expect(body1.instance).toBeTruthy();
      expect(body2.instance).toBeTruthy();
      expect(body1.instance).not.toBe(body2.instance);
    });

    it('should set appropriate content type for error responses', () => {
      const error = CommonErrors.NOT_FOUND();
      const response = handleAPIError(error);
      
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Error-Code')).toBe('not_found');
    });
  });

  describe('Error Message Sanitization', () => {
    it('should sanitize user input in error messages', async () => {
      const userInputs = [
        '<script>alert("XSS")</script>',
        '${7*7}',
        '#{7*7}',
        '%{7*7}',
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        '../../etc/passwd',
        '\r\nX-Injected: header'
      ];

      for (const input of userInputs) {
        const error = CommonErrors.VALIDATION_ERROR(`Invalid input: ${input}`);
        const response = handleAPIError(error);
        const body = await response.json();
        
        // Should sanitize dangerous characters
        expect(body.detail).not.toContain('<script>');
        expect(body.detail).not.toContain('javascript:');
        expect(body.detail).not.toContain('${');
        expect(body.detail).not.toContain('\r\n');
        expect(body.detail).not.toContain('../');
      }
    });
  });
});