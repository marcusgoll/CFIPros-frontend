/**
 * Authenticated Query Hooks for React Query Integration
 * 
 * Provides authenticated query hooks that integrate React Query with Clerk authentication,
 * including automatic query invalidation on auth state changes and proper error handling.
 */

'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { useClerkAPI } from '@/lib/api/clerk-client';
import { authKeys } from '@/lib/utils/query-keys';
import { useEffect, useCallback } from 'react';

/**
 * Hook that creates authenticated queries with automatic token handling
 */
export function useAuthenticatedQuery<TData = unknown, TError = Error>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>
) {
  const { isSignedIn, isLoaded } = useAuth();
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!isSignedIn) {
        throw new Error('User not authenticated');
      }
      return queryFn();
    },
    enabled: isLoaded && isSignedIn && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes default
    gcTime: 10 * 60 * 1000, // 10 minutes default
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // Reduce unnecessary requests
    ...options,
  });
}

/**
 * Hook that creates authenticated mutations with proper error handling
 */
export function useAuthenticatedMutation<TData = unknown, TError = Error, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  const { isSignedIn } = useAuth();
  
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (!isSignedIn) {
        throw new Error('User not authenticated');
      }
      return mutationFn(variables);
    },
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status === 401 || status === 403) {
          return false;
        }
      }
      return failureCount < 1; // Reduce retry for mutations
    },
    ...options,
  });
}

/**
 * Hook that automatically invalidates queries when user signs out
 */
export function useAuthQueryInvalidation() {
  const { isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // When user signs out, invalidate all auth queries
    if (!isSignedIn && !userId) {
      queryClient.invalidateQueries({
        queryKey: authKeys.all,
      });
      
      // Also clear all cached data for security
      queryClient.clear();
    }
  }, [isSignedIn, userId, queryClient]);
  
  const invalidateUserQueries = useCallback(() => {
    if (userId) {
      queryClient.invalidateQueries({
        queryKey: authKeys.user(userId),
      });
    }
  }, [userId, queryClient]);
  
  const invalidateAllAuth = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: authKeys.all,
    });
  }, [queryClient]);
  
  return {
    invalidateUserQueries,
    invalidateAllAuth,
  };
}

/**
 * Hook that provides loading states during token refresh
 */
export function useTokenRefreshState() {
  const { getToken, isLoaded } = useAuth();
  const { user } = useUser();
  
  const refreshToken = useCallback(async () => {
    if (!user) return null;
    
    try {
      const token = await getToken({ 
        template: process.env['NEXT_PUBLIC_JWT_TEMPLATE'] || "backend",
        skipCache: true // Force fresh token
      });
      return token;
    } catch {
      throw new Error('Failed to refresh authentication token');
    }
  }, [getToken, user]);
  
  const tokenMutation = useMutation({
    mutationFn: refreshToken,
    retry: false, // Don't retry token refresh
  });
  
  return {
    refreshToken: tokenMutation.mutate,
    isRefreshing: tokenMutation.isPending,
    refreshError: tokenMutation.error,
    isTokenValid: isLoaded && !!user,
  };
}

/**
 * Hook that provides authenticated API queries with automatic error handling
 */
export function useAuthAPI() {
  const api = useClerkAPI();
  
  // Wrapper for GET requests with auth
  const useAuthGet = <TData = unknown>(
    path: string,
    params?: Record<string, string>,
    options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
  ) => {
    return useAuthenticatedQuery(
      ['api', path, params],
      () => api.get<TData>(path, params),
      {
        ...options,
      }
    );
  };
  
  // Wrapper for POST/PUT/DELETE mutations with auth
  const useAuthMutation = <TData = unknown, TVariables = unknown>(
    path: string,
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
    options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
  ) => {
    return useAuthenticatedMutation(
      async (variables: TVariables) => {
        switch (method) {
          case 'POST':
            return api.post<TData>(path, variables);
          case 'PUT':
            return api.put<TData>(path, variables);
          case 'DELETE':
            return api.delete<TData>(path);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      },
      {
        ...options,
      }
    );
  };
  
  return {
    useGet: useAuthGet,
    usePost: <TData = unknown, TVariables = unknown>(
      path: string,
      options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
    ) => useAuthMutation<TData, TVariables>(path, 'POST', options),
    
    usePut: <TData = unknown, TVariables = unknown>(
      path: string,
      options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>
    ) => useAuthMutation<TData, TVariables>(path, 'PUT', options),
    
    useDelete: <TData = unknown>(
      path: string,
      options?: Omit<UseMutationOptions<TData, Error, never>, 'mutationFn'>
    ) => useAuthMutation<TData, never>(path, 'DELETE', options),
  };
}

/**
 * Hook that provides comprehensive authentication-aware query management
 */
export function useAuthQueryManager() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { invalidateAllAuth, invalidateUserQueries } = useAuthQueryInvalidation();
  const { refreshToken, isRefreshing } = useTokenRefreshState();
  
  const clearUserCache = useCallback(() => {
    if (userId) {
      // Remove all user-specific cached data
      queryClient.removeQueries({
        queryKey: authKeys.user(userId),
      });
    }
  }, [userId, queryClient]);
  
  const refreshUserData = useCallback(async () => {
    if (userId) {
      // Refresh token first, then invalidate queries
      await refreshToken();
      invalidateUserQueries();
    }
  }, [userId, refreshToken, invalidateUserQueries]);
  
  return {
    clearUserCache,
    refreshUserData,
    invalidateAllAuth,
    invalidateUserQueries,
    isRefreshing,
  };
}