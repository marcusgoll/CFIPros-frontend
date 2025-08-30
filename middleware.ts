import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/lesson",
  "/study-plan", 
  "/settings",
  "/analytics",
];

// Routes that are only accessible when not authenticated
const authRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/reset-password",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();
  
  // Get auth token from cookies (placeholder for now)
  const authToken = request.cookies.get("auth-token")?.value;
  const isAuthenticated = Boolean(authToken);

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth-only
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth routes
  if (isAuthRoute && isAuthenticated) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set(
    "X-Permitted-Cross-Domain-Policies", 
    "none"
  );
  response.headers.set(
    "Permissions-Policy", 
    "camera=(), microphone=(), geolocation=()"
  );

  // Add CSP header for enhanced security
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.cfipros.com https://api.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev https://us.i.posthog.com",
      "frame-src 'self' https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev",
    ].join("; ")
  );

  return response;
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