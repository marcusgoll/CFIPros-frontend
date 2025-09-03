import { GET } from '@/app/api/auth/status/route';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Mock Clerk server functions
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;

describe('/api/auth/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return authentication status for signed-in user', async () => {
    const mockUserId = 'user_123';
    const mockToken = 'mock-jwt-token';
    const mockUser = {
      id: mockUserId,
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com', verification: { status: 'verified' } }],
      imageUrl: 'https://example.com/avatar.jpg',
      privateMetadata: { role: 'student' },
    };

    mockAuth.mockResolvedValue({
      userId: mockUserId,
      getToken: jest.fn().mockResolvedValue(mockToken),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      authenticated: true,
      user: {
        id: mockUserId,
        email: 'john@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg',
        role: 'student',
        emailVerified: true,
      },
      permissions: [
        'auth:read_own_profile',
        'reports:view_own',
        'study_plans:create_own',
        'progress:view_own',
      ],
      session: {
        hasActiveSession: true,
        hasValidToken: true,
      },
    });
  });

  it('should return unauthenticated status for no user ID', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      getToken: jest.fn().mockResolvedValue(null),
    } as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      authenticated: false,
      user: null,
      permissions: [],
      session: {
        hasActiveSession: false,
        hasValidToken: false,
      },
    });
  });

  it('should return unauthenticated status when user not found', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: jest.fn().mockResolvedValue('token'),
    } as any);
    
    mockCurrentUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      authenticated: false,
      user: null,
      permissions: [],
      session: {
        hasActiveSession: false,
        hasValidToken: false,
      },
    });
  });

  it('should handle users with CFI role', async () => {
    const mockUser = {
      id: 'user_456',
      firstName: 'Jane',
      lastName: 'Smith',
      emailAddresses: [{ emailAddress: 'jane@example.com', verification: { status: 'verified' } }],
      imageUrl: 'https://example.com/jane.jpg',
      privateMetadata: { role: 'cfi' },
    };

    mockAuth.mockResolvedValue({
      userId: 'user_456',
      getToken: jest.fn().mockResolvedValue('token'),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.user.role).toBe('cfi');
    expect(data.permissions).toContain('reports:view_students');
    expect(data.permissions).toContain('assignments:create');
    expect(data.permissions).toContain('students:manage');
  });

  it('should handle users with school_admin role', async () => {
    const mockUser = {
      id: 'user_789',
      firstName: 'Admin',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'admin@example.com', verification: { status: 'verified' } }],
      imageUrl: 'https://example.com/admin.jpg',
      privateMetadata: { role: 'school_admin' },
    };

    mockAuth.mockResolvedValue({
      userId: 'user_789',
      getToken: jest.fn().mockResolvedValue('token'),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.user.role).toBe('school_admin');
    expect(data.permissions).toContain('organization:manage');
    expect(data.permissions).toContain('users:invite');
    expect(data.permissions).toContain('analytics:view');
  });

  it('should default to student role when role is not specified', async () => {
    const mockUser = {
      id: 'user_000',
      firstName: 'New',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'new@example.com', verification: { status: 'verified' } }],
      imageUrl: 'https://example.com/new.jpg',
      privateMetadata: {}, // No role specified
    };

    mockAuth.mockResolvedValue({
      userId: 'user_000',
      getToken: jest.fn().mockResolvedValue('token'),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.user.role).toBe('student');
    expect(data.permissions).toEqual([
      'auth:read_own_profile',
      'reports:view_own',
      'study_plans:create_own',
      'progress:view_own',
    ]);
  });

  it('should handle token retrieval failure', async () => {
    const mockUser = {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [{ emailAddress: 'john@example.com', verification: { status: 'verified' } }],
      privateMetadata: { role: 'student' },
    };

    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: jest.fn().mockResolvedValue(null), // Token fails
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.session.hasValidToken).toBe(false);
    expect(data.authenticated).toBe(true); // Still authenticated, just no token
  });

  it('should handle server errors gracefully', async () => {
    mockAuth.mockRejectedValue(new Error('Server error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Authentication status check failed');
  });

  it('should handle missing email addresses', async () => {
    const mockUser = {
      id: 'user_123',
      firstName: 'John',
      lastName: 'Doe',
      emailAddresses: [], // No email addresses
      privateMetadata: { role: 'student' },
    };

    mockAuth.mockResolvedValue({
      userId: 'user_123',
      getToken: jest.fn().mockResolvedValue('token'),
    } as any);
    
    mockCurrentUser.mockResolvedValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(data.user.email).toBeUndefined();
    expect(data.user.emailVerified).toBe(false);
  });
});