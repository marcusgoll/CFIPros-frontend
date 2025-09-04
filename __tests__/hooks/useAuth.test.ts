import { renderHook } from '@testing-library/react';

// Mock the Clerk client
jest.mock('@/lib/api/clerk-client', () => ({
  useClerkAPI: jest.fn(),
}));

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useOrganization: jest.fn(),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

import { useAuth, useMe, useCurrentOrg } from '@/lib/hooks/useAuth';
import * as clerkClient from '@/lib/api/clerk-client';

const mockClerkClient = clerkClient as jest.Mocked<typeof clerkClient>;
const mockUseQuery = require('@tanstack/react-query').useQuery;

// Removed wrapper function since we're mocking React Query directly

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return authentication status', () => {
    const mockUseUser = require('@clerk/nextjs').useUser;
    mockUseUser.mockReturnValue({
      userId: 'user_123',
      isSignedIn: true,
      isLoaded: true,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.userId).toBe('user_123');
  });

  it('should return loading state when not loaded', () => {
    const mockUseUser = require('@clerk/nextjs').useUser;
    mockUseUser.mockReturnValue({
      userId: null,
      isSignedIn: false,
      isLoaded: false,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.userId).toBeNull();
  });
});

describe('useMe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return data from useQuery', () => {
    const mockUseUser = require('@clerk/nextjs').useUser;
    const mockUseAuthAPI = jest.fn().mockReturnValue({
      me: jest.fn().mockResolvedValue({ id: 'user_123', email: 'test@example.com' })
    });
    
    // Mock dependencies
    mockUseUser.mockReturnValue({ isSignedIn: true });
    require('@/lib/api/clerk-client').useAuthAPI = mockUseAuthAPI;
    
    const mockQueryResult = {
      data: { id: 'user_123', email: 'test@example.com' },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    
    mockUseQuery.mockReturnValue(mockQueryResult);

    const { result } = renderHook(() => useMe());

    expect(result.current).toEqual(mockQueryResult);
  });
});

describe('useCurrentOrg', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return organization data from useQuery', () => {
    const mockUseUser = require('@clerk/nextjs').useUser;
    const mockUseOrganization = require('@clerk/nextjs').useOrganization;
    const mockUseAuthAPI = jest.fn().mockReturnValue({
      currentOrg: jest.fn().mockResolvedValue({ organizations: [], totalCount: 0 })
    });
    
    // Mock dependencies
    mockUseUser.mockReturnValue({ isSignedIn: true });
    mockUseOrganization.mockReturnValue({ organization: { id: 'org_123' } });
    require('@/lib/api/clerk-client').useAuthAPI = mockUseAuthAPI;
    
    const mockQueryResult = {
      data: { organizations: [], totalCount: 0 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    };
    
    mockUseQuery.mockReturnValue(mockQueryResult);

    const { result } = renderHook(() => useCurrentOrg());

    expect(result.current).toEqual(mockQueryResult);
  });
});