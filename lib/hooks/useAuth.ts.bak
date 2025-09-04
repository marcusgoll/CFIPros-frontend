'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser, useOrganization } from '@clerk/nextjs';
import { useAuthAPI, type User, type Organization } from '@/lib/api/clerk-client';

/**
 * Hook to get current user data from the API
 * Combines Clerk user info with our backend user data
 */
export function useMe() {
  const { isSignedIn } = useUser();
  const authAPI = useAuthAPI();
  
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authAPI.me(),
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to get current organization data from the API
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
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Combined auth hook that provides both user and org data
 */
export function useAuthData() {
  const userQuery = useMe();
  const orgQuery = useCurrentOrg();
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { organization: clerkOrg } = useOrganization();
  
  return {
    // Clerk data (immediate)
    clerkUser,
    clerkOrg,
    isSignedIn,
    isLoaded,
    
    // API data (async)
    user: userQuery.data,
    organization: orgQuery.data,
    
    // Loading states
    isLoadingUser: userQuery.isLoading,
    isLoadingOrg: orgQuery.isLoading,
    isLoading: userQuery.isLoading || orgQuery.isLoading,
    
    // Error states
    userError: userQuery.error,
    orgError: orgQuery.error,
    hasError: !!userQuery.error || !!orgQuery.error,
    
    // Utility functions
    refetchUser: userQuery.refetch,
    refetchOrg: orgQuery.refetch,
    refetch: () => {
      userQuery.refetch();
      orgQuery.refetch();
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
    role: (organization as Organization)?.role,
  };
}