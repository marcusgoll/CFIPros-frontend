/**
 * Query Key Factories for Consistent Cache Management
 * 
 * Centralized query key management for React Query caching strategy
 * Follows the pattern recommended by TanStack Query documentation
 */

/**
 * Authentication query keys factory
 * Provides consistent query keys for all authentication-related queries
 */
export const authKeys = {
  // Base key for all authentication queries
  all: ['auth'] as const,
  
  // User-related query keys
  users: () => [...authKeys.all, 'user'] as const,
  user: (id: string) => [...authKeys.users(), id] as const,
  userProfile: (id: string) => [...authKeys.user(id), 'profile'] as const,
  
  // Organization-related query keys
  orgs: () => [...authKeys.all, 'org'] as const,
  org: (id: string) => [...authKeys.orgs(), id] as const,
  orgMembers: (orgId: string) => [...authKeys.org(orgId), 'members'] as const,
  
  // Session and status query keys
  sessions: () => [...authKeys.all, 'session'] as const,
  session: (userId: string) => [...authKeys.sessions(), userId] as const,
  status: (userId: string) => [...authKeys.all, 'status', userId] as const,
  
  // Permission-related query keys
  permissions: () => [...authKeys.all, 'permissions'] as const,
  userPermissions: (userId: string) => [...authKeys.permissions(), 'user', userId] as const,
  rolePermissions: (role: string) => [...authKeys.permissions(), 'role', role] as const,
  
  // Combined data query keys (for optimized combined queries)
  combined: () => [...authKeys.all, 'combined'] as const,
  userWithStatus: (userId: string) => [...authKeys.combined(), 'user-status', userId] as const,
  userWithOrg: (userId: string, orgId?: string) => [
    ...authKeys.combined(), 
    'user-org', 
    userId, 
    orgId || 'no-org'
  ] as const,
  fullContext: (userId: string, orgId?: string) => [
    ...authKeys.combined(), 
    'full-context', 
    userId, 
    orgId || 'no-org'
  ] as const,
  
  // Token validation query keys
  tokens: () => [...authKeys.all, 'tokens'] as const,
  tokenValidation: (tokenHash: string) => [...authKeys.tokens(), 'validate', tokenHash] as const,
} as const;

/**
 * Helper function to invalidate specific authentication queries
 * Usage with QueryClient for targeted cache invalidation
 */
export const authInvalidation = {
  // Invalidate all authentication data
  all: () => authKeys.all,
  
  // Invalidate user-specific data
  user: (userId: string) => authKeys.user(userId),
  userAndRelated: (userId: string) => [
    authKeys.user(userId),
    authKeys.userPermissions(userId),
    authKeys.status(userId),
    authKeys.session(userId)
  ],
  
  // Invalidate organization-specific data
  org: (orgId: string) => authKeys.org(orgId),
  orgAndRelated: (orgId: string) => [
    authKeys.org(orgId),
    authKeys.orgMembers(orgId)
  ],
  
  // Invalidate permission data
  permissions: () => authKeys.permissions(),
  userPermissions: (userId: string) => authKeys.userPermissions(userId),
  
  // Invalidate combined queries
  combined: () => authKeys.combined(),
  userContext: (userId: string, orgId?: string) => [
    authKeys.userWithStatus(userId),
    authKeys.userWithOrg(userId, orgId),
    authKeys.fullContext(userId, orgId)
  ],
} as const;

/**
 * Query key utilities for cache management
 */
export const queryKeyUtils = {
  /**
   * Extract user ID from authentication query key
   */
  extractUserId: (queryKey: readonly unknown[]): string | null => {
    if (Array.isArray(queryKey) && queryKey.length >= 3) {
      const userId = queryKey[2];
      return typeof userId === 'string' ? userId : null;
    }
    return null;
  },
  
  /**
   * Check if query key is authentication-related
   */
  isAuthQuery: (queryKey: readonly unknown[]): boolean => {
    return Array.isArray(queryKey) && queryKey[0] === 'auth';
  },
  
  /**
   * Check if query key is user-specific
   */
  isUserQuery: (queryKey: readonly unknown[]): boolean => {
    return Array.isArray(queryKey) && 
           queryKey[0] === 'auth' && 
           queryKey[1] === 'user';
  },
  
  /**
   * Check if query key is organization-specific
   */
  isOrgQuery: (queryKey: readonly unknown[]): boolean => {
    return Array.isArray(queryKey) && 
           queryKey[0] === 'auth' && 
           queryKey[1] === 'org';
  },
  
  /**
   * Check if query key is combined data query
   */
  isCombinedQuery: (queryKey: readonly unknown[]): boolean => {
    return Array.isArray(queryKey) && 
           queryKey[0] === 'auth' && 
           queryKey[1] === 'combined';
  }
} as const;

/**
 * Type definitions for query key factories
 */
export type AuthQueryKey = 
  | readonly ['auth']
  | readonly ['auth', 'user']
  | readonly ['auth', 'user', string]
  | readonly ['auth', 'user', string, 'profile']
  | readonly ['auth', 'org']
  | readonly ['auth', 'org', string]
  | readonly ['auth', 'org', string, 'members']
  | readonly ['auth', 'session']
  | readonly ['auth', 'session', string]
  | readonly ['auth', 'status', string]
  | readonly ['auth', 'permissions']
  | readonly ['auth', 'permissions', 'user', string]
  | readonly ['auth', 'permissions', 'role', string]
  | readonly ['auth', 'combined']
  | readonly ['auth', 'combined', 'user-status', string]
  | readonly ['auth', 'combined', 'user-org', string, string]
  | readonly ['auth', 'combined', 'full-context', string, string]
  | readonly ['auth', 'tokens']
  | readonly ['auth', 'tokens', 'validate', string];

export type AuthInvalidationKey = AuthQueryKey | AuthQueryKey[];

/**
 * Performance-focused query key factory
 * For queries that need optimized cache management
 */
export const performanceKeys = {
  // High-frequency queries (short cache time)
  fastAuth: (userId: string) => [...authKeys.all, 'fast', userId] as const,
  
  // Background refresh queries
  backgroundAuth: (userId: string) => [...authKeys.all, 'background', userId] as const,
  
  // Prefetch queries
  prefetchAuth: (userId: string) => [...authKeys.all, 'prefetch', userId] as const,
} as const;