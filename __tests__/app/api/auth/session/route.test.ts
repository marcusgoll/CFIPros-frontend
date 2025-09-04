import { GET, DELETE } from '@/app/api/auth/session/route';
import { auth, currentUser } from '@clerk/nextjs/server';

// Mock Clerk server functions
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('/api/auth/session GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return active session for authenticated user', async () => {
    const mockUserId = 'user_123';
    const mockSessionId = 'sess_456';
    const mockToken = 'mock-jwt-token';
    const mockUser = {
      id: mockUserId,
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com', verification: { status: 'verified' } }],
      imageUrl: 'https://example.com/avatar.jpg',
      privateMetadata: { role: 'cfi' },
      createdAt: 1640995200000, // 2022-01-01
      updatedAt: 1672531200000, // 2023-01-01
    };

    mockAuth.mockResolvedValue({
      userId: mockUserId,
      sessionId: mockSessionId,
      getToken: jest.fn().mockResolvedValue(mockToken),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.active).toBe(true);
    expect(data.session).toEqual({
      id: mockSessionId,
      userId: mockUserId,
      createdAt: '2022-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      expiresAt: null,
      lastActiveAt: expect.any(String),
    });
    expect(data.user).toEqual({
      id: mockUserId,
      email: 'john@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      imageUrl: 'https://example.com/avatar.jpg',
      role: 'cfi',
      emailVerified: true,
    });
    expect(data.token).toEqual({
      hasToken: true,
      template: 'backend',
    });
  });

  it('should return inactive session when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionId: null,
      getToken: jest.fn(),
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      active: false,
      session: null,
      user: null,
    });
  });

  it('should return inactive session when user not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_456',
      getToken: jest.fn(),
    } as any);
    
    mockCurrentUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      active: false,
      session: null,
      user: null,
    });
  });

  it('should handle token retrieval failure', async () => {
    const mockUser = {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com', verification: { status: 'verified' } }],
      privateMetadata: { role: 'student' },
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
    };

    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_456',
      getToken: jest.fn().mockResolvedValue(null), // Token retrieval fails
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.token).toBeNull();
    expect(data.active).toBe(true); // Still active even without token
  });

  it('should use custom JWT template from environment', async () => {
    const originalEnv = process.env['JWT_TEMPLATE'];
    process.env['JWT_TEMPLATE'] = 'custom-template';

    const mockUser = {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com', verification: { status: 'verified' } }],
      privateMetadata: { role: 'student' },
      createdAt: 1640995200000,
      updatedAt: 1640995200000,
    };

    const mockGetToken = jest.fn().mockResolvedValue('custom-token');
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      sessionId: 'sess_456',
      getToken: mockGetToken,
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(mockGetToken).toHaveBeenCalledWith({ template: 'custom-template' });
    expect(data.token).toEqual({
      hasToken: true,
      template: 'custom-template',
    });

    // Restore environment variable
    if (originalEnv) {
      process.env['JWT_TEMPLATE'] = originalEnv;
    } else {
      delete process.env['JWT_TEMPLATE'];
    }
  });

  it('should handle server errors gracefully', async () => {
    mockAuth.mockRejectedValue(new Error('Server error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to check session');
  });
});

describe('/api/auth/session DELETE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success message for authenticated user', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
    } as any);

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Session invalidation requested. Complete sign-out on client side.',
      redirectTo: '/sign-in',
    });
  });

  it('should return error for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
    } as any);

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('No active session to delete');
  });

  it('should handle server errors gracefully', async () => {
    mockAuth.mockRejectedValue(new Error('Server error'));

    const response = await DELETE();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to invalidate session');
  });
});