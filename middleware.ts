import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/study-plan(.*)',
  '/reports(.*)',
  '/analytics(.*)',
  '/admin(.*)',
  '/api/auth(.*)',
  '/api/user(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // Create response for security headers
  let response: NextResponse;

  // Handle authentication logic
  if (!userId && isProtectedRoute(request)) {
    // Redirect unauthenticated users to sign-in
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    response = NextResponse.redirect(signInUrl);
  } else if (userId && (pathname === '/sign-in' || pathname === '/sign-up')) {
    // Redirect authenticated users away from auth pages
    response = NextResponse.redirect(new URL('/dashboard', request.url));
  } else {
    // Allow the request to continue
    response = NextResponse.next();
  }

  // Add comprehensive security headers to all responses
  addSecurityHeaders(response);
  
  return response;
});

function addSecurityHeaders(response: NextResponse) {
  // Add comprehensive security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  
  // Add CSP header for enhanced security
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.cfipros.com https://*.clerk.accounts.dev https://*.clerk.dev https://us.i.posthog.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev",
    ].join("; ")
  );
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt, sitemap.xml (SEO files)
     * - manifest.json (PWA manifest)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)",
  ],
};
