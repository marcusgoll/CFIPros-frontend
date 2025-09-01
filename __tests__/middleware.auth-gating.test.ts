import { middleware } from "@/middleware";

describe("Auth gating middleware", () => {
  it("redirects unauthenticated users from /dashboard to /login with redirect param", () => {
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

    // jest.setup mocks NextResponse.redirect to return an object
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    // Validate redirect to /login with redirect=/dashboard (absolute URL is fine)
    const redirected = new URL(location!, "http://localhost:3000");
    expect(redirected.pathname).toBe("/login");
    expect(redirected.searchParams.get("redirect")).toBe("/dashboard");
  });
});
