import { middleware } from "@/middleware";

describe("Security headers middleware", () => {
  it("adds comprehensive security headers to responses", () => {
    const url = new URL("http://localhost:3000/dashboard");
    // Minimal NextRequest-like mock with nextUrl.clone support
    const req = {
      nextUrl: {
        pathname: url.pathname,
        searchParams: new URLSearchParams(url.searchParams),
        clone: () => new URL(url.toString()),
      },
      cookies: {
        get: () => undefined,
      },
      headers: new Headers(),
    } as unknown as any;

    const res = middleware(req);

    // Check security headers are applied
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("origin-when-cross-origin");
    expect(res.headers.get("X-Permitted-Cross-Domain-Policies")).toBe("none");
    expect(res.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });
});