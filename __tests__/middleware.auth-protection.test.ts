/**
 * Authentication Protection Middleware Test
 * 
 * Tests that the middleware properly protects routes and redirects users
 * based on authentication state.
 */

import { NextRequest } from 'next/server';

// Mock auth function
const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: jest.fn((handler) => {
    // Return a function that calls the handler with our mock auth
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

// Import after mocking
import middleware from '../middleware';

describe('Authentication Middleware Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Protected Route Access', () => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/analytics',
      '/profile',
      '/settings',
      '/study-plan',
      '/reports',
      '/admin',
    ];

    protectedRoutes.forEach(route => {
      it(`should redirect unauthenticated users from ${route} to sign-in`, async () => {
        // Mock unauthenticated user
        mockAuth.mockResolvedValue({ userId: null });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(302); // Redirect status
        const location = response.headers.get('location');
        expect(String(location).includes('/sign-in')).toBe(true);
        expect(location).toContain(encodeURIComponent(`http://localhost:3000${route}`));
      });

      it(`should allow authenticated users to access ${route}`, async () => {
        // Mock authenticated user
        mockAuth.mockResolvedValue({ userId: 'user_123' });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(200); // No redirect
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Public Route Access', () => {
    const publicRoutes = [
      '/',
      '/about',
      '/pricing', 
      '/contact',
      '/features',
    ];

    publicRoutes.forEach(route => {
      it(`should allow unauthenticated users to access ${route}`, async () => {
        // Mock unauthenticated user
        mockAuth.mockResolvedValue({ userId: null });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(200); // No redirect
        expect(response.headers.get('location')).toBeNull();
      });

      it(`should allow authenticated users to access ${route}`, async () => {
        // Mock authenticated user  
        mockAuth.mockResolvedValue({ userId: 'user_123' });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(200); // No redirect
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Authentication Page Redirects', () => {
    const authRoutes = ['/sign-in', '/sign-up'];

    authRoutes.forEach(route => {
      it(`should redirect authenticated users from ${route} to dashboard`, async () => {
        // Mock authenticated user
        mockAuth.mockResolvedValue({ userId: 'user_123' });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(302); // Redirect status
        expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard');
      });

      it(`should allow unauthenticated users to access ${route}`, async () => {
        // Mock unauthenticated user
        mockAuth.mockResolvedValue({ userId: null });
        
        const request = new NextRequest(`http://localhost:3000${route}`);
        
        const response = await middleware(request);
        
        expect(response.status).toBe(200); // No redirect
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Security Headers', () => {
    it('should add security headers to all responses', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_123' });
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);
      
      // Check all security headers are present
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Referrer-Policy')).toBe('origin-when-cross-origin');
      expect(response.headers.get('X-Permitted-Cross-Domain-Policies')).toBe('none');
      expect(response.headers.get('Permissions-Policy')).toContain('camera=()');
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
      expect(response.headers.get('Content-Security-Policy')).toContain('clerk.accounts.dev');
    });

    it('should add security headers even for redirected responses', async () => {
      mockAuth.mockResolvedValue({ userId: null });
      
      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await middleware(request);
      
      // Should be a redirect but still have security headers
      expect(response.status).toBe(302);
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    });
  });

  describe('API Route Protection', () => {
    it('should protect auth API routes for unauthenticated users', async () => {
      mockAuth.mockResolvedValue({ userId: null });
      
      const request = new NextRequest('http://localhost:3000/api/auth/status');
      const response = await middleware(request);
      
      expect(response.status).toBe(302);
      expect(String(response.headers.get('location')).includes('/sign-in')).toBe(true);
    });

    it('should allow webhook routes without authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null });
      
      const request = new NextRequest('http://localhost:3000/api/webhooks/clerk');
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });
});