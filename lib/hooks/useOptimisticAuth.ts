/**
 * Optimistic Updates for Authentication Data
 * 
 * Provides optimistic update functionality for authentication-related operations
 * that improve perceived performance while ensuring data consistency
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/lib/utils/query-keys';
import type { User } from '@/lib/types/auth';

export function useOptimisticAuth() {
  const queryClient = useQueryClient();

  /**
   * Optimistically update user profile data
   */
  const updateUserProfile = async (
    userId: string,
    updatedData: Partial<User>,
    updateFn: () => Promise<User>
  ) => {
    // Cancel any outgoing refetches to prevent overriding optimistic update
    await queryClient.cancelQueries({ queryKey: authKeys.user(userId) });

    // Snapshot the previous value for rollback
    const previousUser = queryClient.getQueryData(authKeys.user(userId));

    // Optimistically update the user data
    queryClient.setQueryData(authKeys.user(userId), (old: User | undefined) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
    });

    // Also update any combined queries that might contain user data
    const userWithStatusKey = authKeys.userWithStatus(userId);
    queryClient.setQueryData(userWithStatusKey, (old: { user?: User } | undefined) => {
      if (!old?.user) {
        return old;
      }
      return {
        ...old,
        user: {
          ...old.user,
          ...updatedData,
          updatedAt: new Date().toISOString(),
        },
      };
    });

    try {
      // Perform the actual update
      const updatedUser = await updateFn();
      
      // Update with the actual response data
      queryClient.setQueryData(authKeys.user(userId), updatedUser);
      
      return updatedUser;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(authKeys.user(userId), previousUser);
      queryClient.setQueryData(userWithStatusKey, (old: { user?: User } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          user: previousUser as User | undefined,
        };
      });
      
      throw error;
    }
  };

  /**
   * Optimistically update user permissions
   */
  const updateUserPermissions = async (
    userId: string,
    newPermissions: string[],
    updateFn: () => Promise<{ permissions: string[] }>
  ) => {
    const statusKey = authKeys.status(userId);
    
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: statusKey });

    // Snapshot previous data
    const previousStatus = queryClient.getQueryData(statusKey);

    // Optimistically update permissions
    queryClient.setQueryData(statusKey, (old: { permissions?: string[] } | undefined) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        permissions: newPermissions,
      };
    });

    try {
      // Perform actual update
      const result = await updateFn();
      
      // Update with real response
      queryClient.setQueryData(statusKey, (old: { permissions?: string[] } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          permissions: result.permissions,
        };
      });
      
      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(statusKey, previousStatus);
      throw error;
    }
  };

  /**
   * Optimistically update organization membership
   */
  const updateOrganization = async (
    userId: string,
    orgId: string,
    orgData: Record<string, unknown>,
    updateFn: () => Promise<Record<string, unknown>>
  ) => {
    const orgKey = authKeys.org(orgId);
    const userOrgKey = authKeys.userWithOrg(userId, orgId);
    
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: orgKey });
    await queryClient.cancelQueries({ queryKey: userOrgKey });

    // Snapshot previous data
    const previousOrg = queryClient.getQueryData(orgKey);
    const previousUserOrg = queryClient.getQueryData(userOrgKey);

    // Optimistically update organization data
    queryClient.setQueryData(orgKey, orgData);
    queryClient.setQueryData(userOrgKey, (old: { organization?: Record<string, unknown> } | undefined) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        organization: orgData,
      };
    });

    try {
      // Perform actual update
      const result = await updateFn();
      
      // Update with real data
      queryClient.setQueryData(orgKey, result);
      queryClient.setQueryData(userOrgKey, (old: { organization?: Record<string, unknown> } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          organization: result,
        };
      });
      
      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(orgKey, previousOrg);
      queryClient.setQueryData(userOrgKey, previousUserOrg);
      throw error;
    }
  };

  /**
   * Optimistically update role changes
   */
  const updateUserRole = async (
    userId: string,
    newRole: string,
    updateFn: () => Promise<{ role: string; roles: string[] }>
  ) => {
    const userKey = authKeys.user(userId);
    const statusKey = authKeys.status(userId);
    
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: userKey });
    await queryClient.cancelQueries({ queryKey: statusKey });

    // Snapshot previous data
    const previousUser = queryClient.getQueryData(userKey);
    const previousStatus = queryClient.getQueryData(statusKey);

    // Optimistically update role in user data
    queryClient.setQueryData(userKey, (old: User | undefined) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        role: newRole,
        roles: [newRole], // Simple case, might be more complex in reality
      };
    });

    // Also update status data
    queryClient.setQueryData(statusKey, (old: { user?: User } | undefined) => {
      if (!old) {
        return old;
      }
      return {
        ...old,
        user: {
          ...old.user,
          role: newRole,
          roles: [newRole],
        },
      };
    });

    try {
      // Perform actual update
      const result = await updateFn();
      
      // Update with real data
      queryClient.setQueryData(userKey, (old: User | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          role: result.role,
          roles: result.roles,
        };
      });
      
      queryClient.setQueryData(statusKey, (old: { user?: User } | undefined) => {
        if (!old) {
          return old;
        }
        return {
          ...old,
          user: {
            ...old.user,
            role: result.role,
            roles: result.roles,
          },
        };
      });
      
      // Invalidate permissions since role change affects permissions
      queryClient.invalidateQueries({ queryKey: authKeys.permissions() });
      
      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(userKey, previousUser);
      queryClient.setQueryData(statusKey, previousStatus);
      throw error;
    }
  };

  /**
   * Background refresh specific auth data
   */
  const backgroundRefresh = {
    user: (userId: string) => {
      queryClient.refetchQueries({ 
        queryKey: authKeys.user(userId),
        type: 'active' 
      });
    },
    
    status: (userId: string) => {
      queryClient.refetchQueries({ 
        queryKey: authKeys.status(userId),
        type: 'active' 
      });
    },
    
    permissions: (userId: string) => {
      queryClient.refetchQueries({ 
        queryKey: authKeys.userPermissions(userId),
        type: 'active' 
      });
    },
    
    organization: (orgId: string) => {
      queryClient.refetchQueries({ 
        queryKey: authKeys.org(orgId),
        type: 'active' 
      });
    },
    
    // Refresh all auth data for a user
    all: () => {
      queryClient.refetchQueries({ 
        queryKey: authKeys.all,
        type: 'active' 
      });
    }
  };

  /**
   * Smart prefetching for commonly needed auth data
   */
  const prefetch = {
    userPermissions: async (userId: string) => {
      await queryClient.prefetchQuery({
        queryKey: authKeys.userPermissions(userId),
        queryFn: async () => {
          const response = await fetch(`/api/auth/permissions?userId=${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch permissions');
          }
          return response.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });
    },
    
    organizationData: async (orgId: string) => {
      await queryClient.prefetchQuery({
        queryKey: authKeys.org(orgId),
        queryFn: async () => {
          const response = await fetch(`/api/auth/organizations/${orgId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch organization');
          }
          return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  return {
    updateUserProfile,
    updateUserPermissions,
    updateOrganization,
    updateUserRole,
    backgroundRefresh,
    prefetch,
  };
}