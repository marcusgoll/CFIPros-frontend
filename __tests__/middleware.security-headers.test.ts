/**
 * Comprehensive Security Headers and CSP Testing
 * Tests for Task 1.5: Security Modules Testing
 * 
 * Coverage Areas:
 * - Security headers validation (X-Frame-Options, X-Content-Type-Options, etc.)
 * - Content Security Policy (CSP) configuration
 * - Referrer Policy validation
 * - Permissions Policy testing
 * - Cross-domain policy validation
 * - Security header consistency across routes
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock auth function for Clerk middleware
const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((handler) => {
    return async (request: NextRequest) => {
      return await handler(mockAuth, request);
    };
  }),
  createRouteMatcher: jest.fn((routes: string[]) => {
    return (request: NextRequest) => {
      const pathname = new URL(request.url).pathname;
      return routes.some(route => {
        if (route.includes('(.*)')) {
          const baseRoute = route.replace('(.*)', '');
          return pathname.startsWith(baseRoute);
        }
        return pathname === route;
      });
    };
  }),
}));

// Import middleware after mocking
import middleware from '../middleware';

describe('Security Headers and CSP Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated user for most tests
    mockAuth.mockResolvedValue({ userId: 'user_123' });
  });

  describe('Security Headers Validation', () => {
    it('should add all required security headers to responses', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      // Test all security headers
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('origin-when-cross-origin');
      expect(response.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
      expect(response.headers.get('Permissions-Policy')).toContain('microphone=()');
      expect(response.headers.get('Permissions-Policy')).toContain('geolocation=()');
    });

    it('should add X-Frame-Options DENY header to prevent clickjacking', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should add X-Content-Type-Options nosniff header', async () => {
      const request = new NextRequest('http://localhost:3000/profile');
      const response = await middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should set appropriate Referrer Policy', async () => {
      const request = new NextRequest('http://localhost:3000/settings');
      const response = await middleware(request);

      expect(response.headers.get('Referrer-Policy')).toBe('origin-when-cross-origin');
    });

    it('should restrict cross-domain policies', async () => {
      const request = new NextRequest('http://localhost:3000/admin');
      const response = await middleware(request);

      expect(response.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
    });

    it('should add security headers even to redirect responses', async () => {
      // Test unauthenticated user being redirected
      mockAuth.mockResolvedValue({ userId: null });
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      expect(response.status).toBe(302); // Redirect
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Content Security Policy (CSP)', () => {
    it('should have comprehensive CSP header', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      expect(csp).toBeTruthy();
      
      // Test CSP directives
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("style-src 'self'");
      expect(csp).toContain("font-src 'self'");
      expect(csp).toContain("img-src 'self'");
      expect(csp).toContain("connect-src 'self'");
    });

    it('should allow Clerk domains in CSP for authentication', async () => {
      const request = new NextRequest('http://localhost:3000/sign-in');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Clerk domains should be allowed
      expect(csp).toContain('clerk.accounts.dev');
      expect(csp).toContain('clerk.dev');
    });

    it('should allow necessary external domains in CSP', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Backend API should be allowed
      expect(csp).toContain('api.cfipros.com');
      
      // Google Fonts should be allowed
      expect(csp).toContain('fonts.googleapis.com');
      expect(csp).toContain('fonts.gstatic.com');
    });

    it('should have restrictive script-src policy', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Should only allow self and necessary external scripts
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain('clerk.accounts.dev');
      
      // Should include unsafe-eval and unsafe-inline for Next.js compatibility
      expect(csp).toContain("'unsafe-eval'");
      expect(csp).toContain("'unsafe-inline'");
    });

    it('should restrict frame-src appropriately', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Should only allow self and Clerk frames
      expect(csp).toContain("frame-src 'self'");
      expect(csp).toContain('clerk.accounts.dev');
      expect(csp).toContain('clerk.dev');
    });
  });

  describe('Permissions Policy', () => {
    it('should restrict dangerous permissions', async () => {
      const request = new NextRequest('http://localhost:3000/');
      const response = await middleware(request);

      const permissionsPolicy = response.headers.get('Permissions-Policy');
      
      // Should disable camera, microphone, geolocation
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');  
      expect(permissionsPolicy).toContain('geolocation=()');
    });

    it('should be consistent across different routes', async () => {
      const routes = ['/dashboard', '/profile', '/settings', '/admin'];
      
      for (const route of routes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middleware(request);
        
        const permissionsPolicy = response.headers.get('Permissions-Policy');
        expect(permissionsPolicy).toContain('camera=()');
        expect(permissionsPolicy).toContain('microphone=()');
        expect(permissionsPolicy).toContain('geolocation=()');
      }
    });
  });

  describe('Security Headers Consistency', () => {
    it('should apply security headers to all routes consistently', async () => {
      const testRoutes = [
        '/',
        '/dashboard', 
        '/profile',
        '/settings',
        '/admin',
        '/sign-in',
        '/sign-up'
      ];

      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options', 
        'Referrer-Policy',
        'X-Permitted-Cross-Domain-Policies',
        'Permissions-Policy',
        'Content-Security-Policy'
      ];

      for (const route of testRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middleware(request);

        for (const header of requiredHeaders) {
          expect(response.headers.get(header)).toBeTruthy();
        }
      }
    });

    it('should maintain security headers for both authenticated and unauthenticated users', async () => {
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Content-Security-Policy'
      ];

      // Test authenticated user
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      const authRequest = new NextRequest('http://localhost:3000/dashboard');
      const authResponse = await middleware(authRequest);

      // Test unauthenticated user  
      mockAuth.mockResolvedValue({ userId: null });
      const unauthRequest = new NextRequest('http://localhost:3000/dashboard');
      const unauthResponse = await middleware(unauthRequest);

      for (const header of requiredHeaders) {
        expect(authResponse.headers.get(header)).toBeTruthy();
        expect(unauthResponse.headers.get(header)).toBeTruthy();
      }
    });
  });

  describe('Anti-Clickjacking Protection', () => {
    it('should prevent embedding in frames with X-Frame-Options DENY', async () => {
      const sensitiveRoutes = ['/dashboard', '/admin', '/profile', '/settings'];
      
      for (const route of sensitiveRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middleware(request);
        
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      }
    });

    it('should prevent embedding even on public routes', async () => {
      const publicRoutes = ['/', '/about', '/pricing'];
      
      for (const route of publicRoutes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middleware(request);
        
        expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      }
    });
  });

  describe('MIME Type Sniffing Protection', () => {
    it('should prevent MIME type sniffing with nosniff header', async () => {
      const routes = ['/dashboard', '/', '/api/auth/profile'];
      
      for (const route of routes) {
        const request = new NextRequest(`http://localhost:3000${route}`);
        const response = await middleware(request);
        
        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      }
    });
  });

  describe('CSP Violation Prevention', () => {
    it('should have CSP that prevents inline script execution (except where necessary)', async () => {
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Should have script-src with self and allowed domains
      expect(csp).toContain("script-src 'self'");
      
      // Should allow unsafe-inline for Next.js but only from trusted sources
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).toContain('clerk.accounts.dev');
    });

    it('should prevent unauthorized external resource loading', async () => {
      const request = new NextRequest('http://localhost:3000/profile');
      const response = await middleware(request);

      const csp = response.headers.get('Content-Security-Policy');
      
      // Should have restrictive default-src
      expect(csp).toContain("default-src 'self'");
      
      // Connect-src should only allow trusted domains
      expect(csp).toContain('connect-src');
      expect(csp).toContain('api.cfipros.com');
      expect(csp).toContain('clerk.accounts.dev');
    });
  });
});