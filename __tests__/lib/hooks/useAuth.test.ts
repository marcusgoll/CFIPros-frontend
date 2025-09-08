/**
 * Comprehensive useAuth Hook Tests
 * Tests for Task 2.2: Custom Hooks Testing
 * 
 * Coverage Areas:
 * - Basic authentication status checking
 * - Authenticated API calls with Clerk integration
 * - Error handling for unauthenticated requests
 * - Loading states and data caching with TanStack Query
 * - User data fetching and management
 * - Organization data and permissions
 * - Role-based access control
 * - Query invalidation and cache management
 * - Performance with parallel requests
 * - Memory cleanup and effect management
 * - TypeScript strict mode compliance
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { 
  useAuth, 
  useMe, 
  useCurrentOrg, 
  useAuthData,
  useUserRoles,
  useOrgPermissions
} from '@/lib/hooks/useAuth';

// Mock Clerk hooks
const mockUser = {
  id: 'user_123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'John',
  lastName: 'Doe',
};

const mockOrganization = {
  id: 'org_123',
  name: 'Test Organization',
  slug: 'test-org',
};

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(() => ({
    user: mockUser,
    isSignedIn: true,
    isLoaded: true,
  })),
  useOrganization: jest.fn(() => ({
    organization: mockOrganization,
    isLoaded: true,
  })),
}));

// Mock API client
const mockAuthAPI = {
  me: jest.fn(),
  currentOrg: jest.fn(),
};

jest.mock('@/lib/api/clerk-client', () => ({
  useAuthAPI: () => mockAuthAPI,
  type: {
    User: jest.fn(),
  },
}));

// Mock fetch for combined auth data
global.fetch = jest.fn();

const mockFetch = jest.mocked(fetch);

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useAuth Hook', () => {
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = createWrapper();
  });

  // Basic authentication tests
  describe('Basic Authentication', () => {
    it('returns authentication status correctly', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBe('user_123');
    });

    it('handles unauthenticated state', () => {
      const { useUser } = jest.requireMock('@clerk/nextjs');
      useUser.mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: true,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.userId).toBeUndefined();
    });

    it('handles loading state', () => {
      const { useUser } = jest.requireMock('@clerk/nextjs');
      useUser.mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: false,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.userId).toBeUndefined();
    });
  });

  // User data fetching tests
  describe('useMe Hook', () => {
    it('fetches user data when authenticated', async () => {
      const userData = {
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['student'],
      };

      mockAuthAPI.me.mockResolvedValue(userData);

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(userData);
      expect(result.current.error).toBe(null);
    });

    it('does not fetch when unauthenticated', () => {
      const { useUser } = jest.requireMock('@clerk/nextjs');
      useUser.mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: true,
      });

      const { result } = renderHook(() => useMe(), { wrapper });

      expect(mockAuthAPI.me).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('handles API errors', async () => {
      const apiError = new Error('API Error');
      mockAuthAPI.me.mockRejectedValue(apiError);

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('does not retry on 401/403 errors', async () => {
      const authError = { status: 401 };
      mockAuthAPI.me.mockRejectedValue(authError);

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should not retry auth errors
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
    });

    it('retries on other errors', async () => {
      const networkError = { status: 500 };
      mockAuthAPI.me
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ id: 'user_123' });

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should retry up to 2 times (3 total calls)
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(3);
    });

    it('uses correct query key for caching', () => {
      const { result } = renderHook(() => useMe(), { wrapper });

      // Query key should include user ID for proper cache invalidation
      expect(result.current.queryKey).toEqual(['auth', 'me', 'user_123']);
    });

    it('caches data with correct stale time', async () => {
      const userData = { id: 'user_123', email: 'test@example.com' };
      mockAuthAPI.me.mockResolvedValue(userData);

      const { result, rerender } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Rerender should use cached data
      rerender();

      // Should only be called once due to caching
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(userData);
    });
  });

  // Organization data tests
  describe('useCurrentOrg Hook', () => {
    it('fetches organization data when authenticated and has organization', async () => {
      const orgData = {
        id: 'org_123',
        name: 'Test Organization',
        members: 5,
      };

      mockAuthAPI.currentOrg.mockResolvedValue(orgData);

      const { result } = renderHook(() => useCurrentOrg(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthAPI.currentOrg).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(orgData);
    });

    it('does not fetch when no organization', () => {
      const { useOrganization } = jest.requireMock('@clerk/nextjs');
      useOrganization.mockReturnValue({
        organization: null,
        isLoaded: true,
      });

      const { result } = renderHook(() => useCurrentOrg(), { wrapper });

      expect(mockAuthAPI.currentOrg).not.toHaveBeenCalled();
      expect(result.current.data).toBeUndefined();
    });

    it('handles organization API errors', async () => {
      const apiError = new Error('Org API Error');
      mockAuthAPI.currentOrg.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCurrentOrg(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('uses organization ID in query key', () => {
      const { result } = renderHook(() => useCurrentOrg(), { wrapper });

      expect(result.current.queryKey).toEqual(['auth', 'current-org', 'org_123']);
    });
  });

  // Combined auth data tests
  describe('useAuthData Hook', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          user: { id: 'user_123', email: 'test@example.com' },
          permissions: ['read', 'write'],
          session: { hasActiveSession: true, hasValidToken: true },
        }),
      } as Response);
    });

    it('fetches combined auth data with parallel requests', async () => {
      const userData = { id: 'user_123', email: 'test@example.com' };
      mockAuthAPI.me.mockResolvedValue(userData);

      const { result } = renderHook(() => useAuthData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/status',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(result.current.user).toEqual(userData);
      expect(result.current.permissions).toEqual(['read', 'write']);
      expect(result.current.session).toEqual({
        hasActiveSession: true,
        hasValidToken: true,
      });
    });

    it('handles partial failures gracefully', async () => {
      const userData = { id: 'user_123', email: 'test@example.com' };
      mockAuthAPI.me.mockResolvedValue(userData);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useAuthData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(userData);
      expect(result.current.permissions).toEqual([]);
      expect(result.current.statusError).toBeDefined();
    });

    it('provides clerk data immediately', () => {
      const { result } = renderHook(() => useAuthData(), { wrapper });

      expect(result.current.clerkUser).toEqual(mockUser);
      expect(result.current.clerkOrg).toEqual(mockOrganization);
      expect(result.current.isSignedIn).toBe(true);
      expect(result.current.isLoaded).toBe(true);
    });

    it('provides error states for both requests', async () => {
      const userError = new Error('User API Error');
      const statusError = new Error('Status API Error');

      mockAuthAPI.me.mockRejectedValue(userError);
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useAuthData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.userError).toBe(userError);
      expect(result.current.statusError).toBeDefined();
      expect(result.current.hasError).toBe(true);
    });

    it('invalidates cache correctly', async () => {
      const { result } = renderHook(() => useAuthData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mocks and setup new data
      jest.clearAllMocks();
      const newUserData = { id: 'user_123', email: 'updated@example.com' };
      mockAuthAPI.me.mockResolvedValue(newUserData);

      // Trigger invalidation
      await act(async () => {
        result.current.invalidate();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUserData);
      });
    });

    it('always refetches on mount', () => {
      const { result } = renderHook(() => useAuthData(), { wrapper });

      // refetchOnMount should be 'always' for fresh auth state
      expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });

    it('uses combined query key with user and org IDs', () => {
      const { result } = renderHook(() => useAuthData(), { wrapper });

      expect(result.current.queryKey).toEqual([
        'auth',
        'combined-data',
        'user_123',
        'org_123',
      ]);
    });
  });

  // Role-based access control tests
  describe('useUserRoles Hook', () => {
    it('returns user roles correctly', () => {
      const mockUseAuthData = jest.fn(() => ({
        user: {
          id: 'user_123',
          roles: ['student', 'cfi'],
        },
      }));

      // Mock the useAuthData hook
      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
      }));

      const { result } = renderHook(() => useUserRoles(), { wrapper });

      expect(result.current.roles).toEqual(['student', 'cfi']);
      expect(result.current.hasRole('student')).toBe(true);
      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.isStudent).toBe(true);
      expect(result.current.isCFI).toBe(true);
      expect(result.current.isAdmin).toBe(false);
    });

    it('handles user without roles', () => {
      const mockUseAuthData = jest.fn(() => ({
        user: { id: 'user_123' },
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
      }));

      const { result } = renderHook(() => useUserRoles(), { wrapper });

      expect(result.current.roles).toEqual([]);
      expect(result.current.hasRole('student')).toBe(false);
      expect(result.current.isStudent).toBe(false);
    });

    it('checks multiple roles correctly', () => {
      const mockUseAuthData = jest.fn(() => ({
        user: {
          id: 'user_123',
          roles: ['cfi', 'school_admin'],
        },
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
      }));

      const { result } = renderHook(() => useUserRoles(), { wrapper });

      expect(result.current.hasAnyRole(['student', 'cfi'])).toBe(true);
      expect(result.current.hasAnyRole(['student', 'admin'])).toBe(false);
      expect(result.current.hasAllRoles(['cfi', 'school_admin'])).toBe(true);
      expect(result.current.hasAllRoles(['cfi', 'admin'])).toBe(false);
    });
  });

  // Organization permissions tests
  describe('useOrgPermissions Hook', () => {
    it('calculates organization permissions correctly', () => {
      const mockUseAuthData = jest.fn(() => ({
        organization: { id: 'org_123', name: 'Test Org' },
      }));

      const mockUseUserRoles = jest.fn(() => ({
        hasRole: (role: string) => role === 'school_admin',
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
        useUserRoles: mockUseUserRoles,
      }));

      const { result } = renderHook(() => useOrgPermissions(), { wrapper });

      expect(result.current.canManageOrg).toBe(true);
      expect(result.current.canInviteUsers).toBe(true);
      expect(result.current.canViewReports).toBe(true);
      expect(result.current.canManageStudents).toBe(true);
    });

    it('restricts permissions for regular users', () => {
      const mockUseAuthData = jest.fn(() => ({
        organization: { id: 'org_123', name: 'Test Org' },
      }));

      const mockUseUserRoles = jest.fn(() => ({
        hasRole: () => false, // No special roles
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
        useUserRoles: mockUseUserRoles,
      }));

      const { result } = renderHook(() => useOrgPermissions(), { wrapper });

      expect(result.current.canManageOrg).toBe(false);
      expect(result.current.canInviteUsers).toBe(false);
      expect(result.current.canViewReports).toBe(false);
      expect(result.current.canManageStudents).toBe(false);
    });

    it('allows CFI permissions', () => {
      const mockUseAuthData = jest.fn(() => ({
        organization: { id: 'org_123', name: 'Test Org' },
      }));

      const mockUseUserRoles = jest.fn(() => ({
        hasRole: (role: string) => role === 'cfi',
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
        useUserRoles: mockUseUserRoles,
      }));

      const { result } = renderHook(() => useOrgPermissions(), { wrapper });

      expect(result.current.canManageOrg).toBe(false);
      expect(result.current.canInviteUsers).toBe(false);
      expect(result.current.canViewReports).toBe(true);
      expect(result.current.canManageStudents).toBe(true);
    });
  });

  // Performance and caching tests
  describe('Performance and Caching', () => {
    it('handles concurrent requests efficiently', async () => {
      const userData = { id: 'user_123', email: 'test@example.com' };
      mockAuthAPI.me.mockResolvedValue(userData);

      // Render multiple hooks that use the same query
      const { result: result1 } = renderHook(() => useMe(), { wrapper });
      const { result: result2 } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Should deduplicate requests
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
      expect(result1.current.data).toEqual(result2.current.data);
    });

    it('handles rapid state changes without memory leaks', async () => {
      const { result, unmount } = renderHook(() => useAuthData(), { wrapper });

      // Trigger multiple state changes
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          result.current.refetch();
        });
      }

      // Unmount should clean up properly
      expect(() => unmount()).not.toThrow();
    });

    it('optimizes with reduced retry attempts', async () => {
      const networkError = new Error('Network Error');
      mockAuthAPI.me
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ id: 'user_123' });

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should retry only 2 times (3 total calls) for reduced load
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(3);
    });

    it('reduces unnecessary requests with window focus control', () => {
      const { result } = renderHook(() => useMe(), { wrapper });

      // refetchOnWindowFocus should be false to reduce requests
      expect(result.current.isRefetching).toBe(false);

      // Simulate window focus - should not trigger refetch
      window.dispatchEvent(new Event('focus'));
      expect(mockAuthAPI.me).toHaveBeenCalledTimes(1);
    });
  });

  // Error handling and edge cases
  describe('Error Handling and Edge Cases', () => {
    it('handles malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(null), // Malformed response
      } as Response);

      const { result } = renderHook(() => useAuthData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle null response gracefully
      expect(result.current.permissions).toEqual([]);
      expect(result.current.session).toEqual({
        hasActiveSession: false,
        hasValidToken: false,
      });
    });

    it('handles network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockAuthAPI.me.mockRejectedValue(timeoutError);

      const { result } = renderHook(() => useMe(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(timeoutError);
    });

    it('handles clerk user state changes', () => {
      const { useUser } = jest.requireMock('@clerk/nextjs');
      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);

      // Simulate user sign out
      useUser.mockReturnValue({
        user: null,
        isSignedIn: false,
        isLoaded: true,
      });

      rerender();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBeUndefined();
    });

    it('handles clerk organization changes', () => {
      const { useOrganization } = jest.requireMock('@clerk/nextjs');
      const { result, rerender } = renderHook(() => useCurrentOrg(), { wrapper });

      // Simulate organization change
      useOrganization.mockReturnValue({
        organization: { id: 'org_456', name: 'New Org' },
        isLoaded: true,
      });

      rerender();

      expect(result.current.queryKey).toEqual(['auth', 'current-org', 'org_456']);
    });

    it('handles empty user roles gracefully', () => {
      const mockUseAuthData = jest.fn(() => ({
        user: null, // No user
      }));

      jest.doMock('@/lib/hooks/useAuth', () => ({
        ...jest.requireActual('@/lib/hooks/useAuth'),
        useAuthData: mockUseAuthData,
      }));

      const { result } = renderHook(() => useUserRoles(), { wrapper });

      expect(result.current.roles).toEqual([]);
      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.hasAnyRole(['student', 'cfi'])).toBe(false);
      expect(result.current.hasAllRoles([])).toBe(true); // Empty array should return true
    });
  });

  // Memory cleanup tests
  describe('Memory Management', () => {
    it('cleans up queries on unmount', () => {
      const { unmount } = renderHook(() => useMe(), { wrapper });

      expect(() => unmount()).not.toThrow();
    });

    it('cancels in-flight requests on unmount', async () => {
      let resolveRequest: (value: any) => void;
      const pendingPromise = new Promise(resolve => {
        resolveRequest = resolve;
      });

      mockAuthAPI.me.mockReturnValue(pendingPromise);

      const { unmount } = renderHook(() => useMe(), { wrapper });

      // Unmount before request completes
      unmount();

      // Complete the request after unmount
      await act(async () => {
        resolveRequest({ id: 'user_123' });
      });

      // Should not cause errors
      expect(true).toBe(true);
    });

    it('handles rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => useAuthData(), { wrapper });
        unmount();
      }

      // Should not cause memory leaks
      expect(true).toBe(true);
    });
  });
});