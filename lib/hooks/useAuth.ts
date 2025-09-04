'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useAuthAPI, type User } from '@/lib/api/clerk-client';

/**
 * Basic auth hook that provides authentication status
 * This is the primary hook used throughout the application
 */
export function useAuth() {
  const { user, isSignedIn, isLoaded } = useUser();
  
  return {
    isAuthenticated: isSignedIn,
    isLoading: !isLoaded,
    userId: user?.id,
  };
}

/**
 * Hook to get current user data from the API
 * Optimized to use shared query key for deduplication
 */
export function useMe() {
  const { user: clerkUser, isSignedIn } = useUser();
  const authAPI = useAuthAPI();
  
  return useQuery({
    queryKey: ['auth', 'me', clerkUser?.id],
    queryFn: () => authAPI.me(),
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2; // Reduce retries
    },
    refetchOnWindowFocus: false, // Reduce unnecessary requests
  });
}

/**
 * Hook to get current organization data from the API
 * Optimized with better caching and fewer retries
 */
export function useCurrentOrg() {
  const { isSignedIn } = useUser();
  const { organization } = useOrganization();
  const authAPI = useAuthAPI();
  
  return useQuery({
    queryKey: ['auth', 'current-org', organization?.id],
    queryFn: () => authAPI.currentOrg(),
    enabled: !!isSignedIn && !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2; // Reduce retries
    },
    refetchOnWindowFocus: false,
  });
}

/**
 * Combined auth hook that provides both user and org data
 * Optimized to use a single API call instead of waterfall requests
 */
export function useAuthData() {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { organization: clerkOrg } = useOrganization();
  const authAPI = useAuthAPI();
  
  // Use a single combined query instead of separate user/org queries
  const combinedQuery = useQuery({
    queryKey: ['auth', 'combined-data', clerkUser?.id, clerkOrg?.id],
    queryFn: async () => {
      // Make parallel requests for better performance
      const [userResponse, statusResponse] = await Promise.allSettled([
        authAPI.me(),
        fetch('/api/auth/status', {
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(res => res.ok ? res.json() : Promise.reject(new Error(`Status ${res.status}`)))
      ]);
      
      // Extract results safely
      const user = userResponse.status === 'fulfilled' ? userResponse.value : null;
      const status = statusResponse.status === 'fulfilled' ? statusResponse.value : null;
      
      return {
        user: user || status?.user || null,
        organization: null, // Will be populated when Organizations API is integrated
        permissions: status?.permissions || [],
        session: status?.session || { hasActiveSession: false, hasValidToken: false },
        errors: {
          userError: userResponse.status === 'rejected' ? userResponse.reason : null,
          statusError: statusResponse.status === 'rejected' ? statusResponse.reason : null,
        }
      };
    },
    enabled: !!isSignedIn && isLoaded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2; // Reduce retry attempts
    },
    refetchOnWindowFocus: false, // Reduce unnecessary requests
    refetchOnMount: 'always', // Always refetch on mount for fresh auth state
  });
  
  return {
    // Clerk data (immediate)
    clerkUser,
    clerkOrg,
    isSignedIn,
    isLoaded,
    
    // API data (async) - from combined query
    user: combinedQuery.data?.user,
    organization: combinedQuery.data?.organization,
    permissions: combinedQuery.data?.permissions || [],
    session: combinedQuery.data?.session,
    
    // Loading states - single query
    isLoading: combinedQuery.isLoading,
    
    // Error states - combined from parallel requests
    userError: combinedQuery.data?.errors?.userError,
    statusError: combinedQuery.data?.errors?.statusError,
    hasError: !!combinedQuery.error || !!combinedQuery.data?.errors?.userError || !!combinedQuery.data?.errors?.statusError,
    error: combinedQuery.error,
    
    // Utility functions
    refetch: combinedQuery.refetch,
    invalidate: () => {
      // Invalidate related queries for fresh data
      combinedQuery.refetch();
    },
  };
}

/**
 * Hook to check user roles and permissions
 */
export function useUserRoles() {
  const { user } = useAuthData();
  
  const hasRole = (role: string) => {
    return (user as User)?.roles?.includes(role) ?? false;
  };
  
  const hasAnyRole = (roles: string[]) => {
    return roles.some(role => hasRole(role));
  };
  
  const hasAllRoles = (roles: string[]) => {
    return roles.every(role => hasRole(role));
  };
  
  return {
    roles: (user as User)?.roles ?? [],
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isStudent: hasRole('student'),
    isCFI: hasRole('cfi'),
    isSchoolAdmin: hasRole('school_admin'),
    isAdmin: hasRole('admin'),
  };
}

/**
 * Hook for organization-level permissions
 */
export function useOrgPermissions() {
  const { organization } = useAuthData();
  const { hasRole } = useUserRoles();
  
  const canManageOrg = hasRole('school_admin') || hasRole('admin');
  const canInviteUsers = canManageOrg;
  const canViewReports = hasRole('cfi') || canManageOrg;
  const canManageStudents = hasRole('cfi') || canManageOrg;
  
  return {
    organization,
    canManageOrg,
    canInviteUsers,
    canViewReports,
    canManageStudents,
    role: null, // Will be populated when Organizations API is integrated
  };
}
