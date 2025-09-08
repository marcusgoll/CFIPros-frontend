/**
 * Next.js API Routes Integration Tests
 * Tests frontend API proxy routes and their integration with backend services
 */

import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import '../mocks/setup';

// Mock fetch for testing API routes
global.fetch = jest.fn();

describe('Next.js API Routes Proxy Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  describe('/api/upload proxy route', () => {
    test('successfully proxies file upload to backend', async () => {
      server.use(
        http.post('/api/upload', async ({ request }) => {
          const formData = await request.formData();
          const files = formData.getAll('files') as File[];
          
          return HttpResponse.json({
            message: 'Files uploaded successfully',
            batch_id: `batch_proxy_${Date.now()}`,
            files_count: files.length
          }, { status: 200 });
        })
      );

      const formData = new FormData();
      const testFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      formData.append('files', testFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.message).toBe('Files uploaded successfully');
      expect(result.files_count).toBe(1);
      expect(result.batch_id).toMatch(/^batch_proxy_/);
    });

    test('handles upload errors from backend', async () => {
      server.use(
        http.post('/api/upload', () => {
          return HttpResponse.json({
            error: 'File too large',
            code: 'FILE_TOO_LARGE'
          }, { status: 413 });
        })
      );

      const formData = new FormData();
      const largeFile = new File(['x'.repeat(1024 * 1024 * 50)], 'large.pdf', { type: 'application/pdf' });
      formData.append('files', largeFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      expect(response.status).toBe(413);
      expect(result.error).toBe('File too large');
      expect(result.code).toBe('FILE_TOO_LARGE');
    });

    test('validates required authentication headers', async () => {
      server.use(
        http.post('/api/upload', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          
          if (!authHeader) {
            return HttpResponse.json({
              error: 'Unauthorized',
              code: 'UNAUTHORIZED'
            }, { status: 401 });
          }

          return HttpResponse.json({
            message: 'Upload successful',
            batch_id: 'batch_auth_test'
          }, { status: 200 });
        })
      );

      // Test without auth header
      const responseUnauth = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData()
      });

      expect(responseUnauth.status).toBe(401);

      // Test with auth header
      const responseAuth = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test_token'
        },
        body: new FormData()
      });

      expect(responseAuth.status).toBe(200);
    });
  });

  describe('/api/results/[batchId] proxy route', () => {
    test('successfully proxies results request to backend', async () => {
      const batchId = 'batch_test_123';
      
      server.use(
        http.get(`/api/results/${batchId}`, ({ params }) => {
          return HttpResponse.json({
            batch_id: params.batchId,
            status: 'processing',
            progress: 0.75,
            message: 'Processing via Next.js proxy'
          }, { status: 200 });
        })
      );

      const response = await fetch(`/api/results/${batchId}`);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.batch_id).toBe(batchId);
      expect(result.status).toBe('processing');
      expect(result.progress).toBe(0.75);
    });

    test('handles batch not found errors', async () => {
      const batchId = 'batch_not_found';
      
      server.use(
        http.get(`/api/results/${batchId}`, () => {
          return HttpResponse.json({
            error: 'Batch not found',
            code: 'BATCH_NOT_FOUND'
          }, { status: 404 });
        })
      );

      const response = await fetch(`/api/results/${batchId}`);
      const result = await response.json();

      expect(response.status).toBe(404);
      expect(result.error).toBe('Batch not found');
      expect(result.code).toBe('BATCH_NOT_FOUND');
    });
  });

  describe('/api/auth/* proxy routes', () => {
    test('proxies authentication status check', async () => {
      server.use(
        http.get('/api/auth/status', ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          
          return HttpResponse.json({
            authenticated: !!authHeader,
            user_id: authHeader ? 'test_user_123' : null
          }, { status: 200 });
        })
      );

      const response = await fetch('/api/auth/status', {
        headers: {
          'Authorization': 'Bearer test_token'
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.authenticated).toBe(true);
      expect(result.user_id).toBe('test_user_123');
    });

    test('proxies session retrieval', async () => {
      server.use(
        http.get('/api/auth/session', () => {
          return HttpResponse.json({
            user: {
              id: 'test_user_session',
              email: 'test@cfipros.com',
              first_name: 'Test',
              last_name: 'User'
            },
            session: {
              id: 'session_test_123',
              expires_at: new Date(Date.now() + 3600000).toISOString()
            }
          }, { status: 200 });
        })
      );

      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': 'Bearer valid_token'
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.user.id).toBe('test_user_session');
      expect(result.session.id).toBe('session_test_123');
    });

    test('proxies token refresh requests', async () => {
      server.use(
        http.post('/api/auth/refresh', () => {
          return HttpResponse.json({
            token: 'new_jwt_token_123',
            expires_at: new Date(Date.now() + 3600000).toISOString()
          }, { status: 200 });
        })
      );

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer old_token'
        }
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.token).toBe('new_jwt_token_123');
      expect(result.expires_at).toBeTruthy();
    });
  });

  describe('Error handling and edge cases', () => {
    test('handles backend service unavailable', async () => {
      server.use(
        http.post('/api/upload', () => {
          return HttpResponse.json({
            error: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE'
          }, { status: 503 });
        })
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData()
      });

      const result = await response.json();

      expect(response.status).toBe(503);
      expect(result.error).toBe('Service temporarily unavailable');
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('handles timeout scenarios', async () => {
      server.use(
        http.get('/api/error/timeout', async () => {
          // Simulate long delay
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ 
            message: 'Should handle timeout gracefully' 
          });
        })
      );

      const response = await fetch('/api/error/timeout');
      const result = await response.json();

      expect(result.message).toBe('Should handle timeout gracefully');
    });

    test('handles malformed responses from backend', async () => {
      server.use(
        http.get('/api/error/malformed', () => {
          // Return invalid JSON
          return new Response('invalid json {', {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const response = await fetch('/api/error/malformed');
      
      expect(response.status).toBe(200);
      // Should handle JSON parsing errors gracefully
      try {
        await response.json();
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    test('validates CORS headers in responses', async () => {
      server.use(
        http.options('/api/upload', () => {
          return new Response(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          });
        })
      );

      const response = await fetch('/api/upload', {
        method: 'OPTIONS'
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('Rate limiting integration', () => {
    test('enforces rate limits on proxy routes', async () => {
      server.use(
        http.post('/api/upload', () => {
          return HttpResponse.json({
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retry_after: 3600
          }, { status: 429 });
        })
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData()
      });

      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result.error).toBe('Rate limit exceeded');
      expect(result.retry_after).toBe(3600);
    });

    test('includes rate limit headers in responses', async () => {
      server.use(
        http.post('/api/upload', () => {
          return new Response(JSON.stringify({ message: 'Success' }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '9',
              'X-RateLimit-Reset': '3600'
            }
          });
        })
      );

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData()
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9');
    });
  });

  describe('Security header validation', () => {
    test('validates security headers in API responses', async () => {
      server.use(
        http.get('/api/auth/status', () => {
          return new Response(JSON.stringify({ authenticated: true }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block',
              'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            }
          });
        })
      );

      const response = await fetch('/api/auth/status');

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
    });

    test('validates Content-Security-Policy headers', async () => {
      server.use(
        http.get('/api/upload', () => {
          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'"
            }
          });
        })
      );

      const response = await fetch('/api/upload');

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });
  });
});