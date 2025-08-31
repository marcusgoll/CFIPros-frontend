import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Auth gating middleware', () => {
  it('redirects unauthenticated users from /dashboard to /login with redirect param', () => {
    const url = new URL('http://localhost:3000/dashboard');
    const req = new NextRequest(url.toString(), {
      method: 'GET',
      headers: {
        // no auth token cookie header => unauthenticated
      },
    });

    // Simulate no auth cookie
    // jest.setup provides a minimal NextRequest; cookie handling is not needed

    const res = middleware(req as unknown as any);

    // jest.setup mocks NextResponse.redirect to return an object
    expect(res.status).toBe(302);
    const location = res.headers.get('Location');
    expect(location).toBe('/login?redirect=/dashboard');
  });
});

