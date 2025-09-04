/**
 * Authentication and User Type Definitions
 * 
 * Unified, authoritative types for authentication and user management
 * across the CFIPros frontend application
 */

/**
 * Core User interface - single source of truth for user data
 * Consolidates all user-related properties from authentication flows
 */
export interface User {
  // Core Identity Fields
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string;

  // Authentication Fields  
  readonly role: string;
  readonly roles: string[];
  readonly permissions: string[];
  readonly emailVerified: boolean;

  // Organization Context
  readonly organization?: string;
  readonly orgId?: string; // For backward compatibility during migration

  // Timestamps
  readonly createdAt: string; // ISO 8601 format
  readonly updatedAt: string; // ISO 8601 format
}

/**
 * User profile data for display and editing
 */
export interface UserProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * User authentication context for protected routes
 */
export interface UserAuthContext {
  readonly id: string;
  readonly role: string;
  readonly roles: string[];
  readonly permissions: string[];
  readonly organization?: string;
  readonly isAuthenticated: boolean;
}

/**
 * User session data from authentication API
 */
export interface UserSession {
  readonly active: boolean;
  readonly user: User | null;
  readonly session: SessionData | null;
  readonly token?: TokenInfo | null;
}

/**
 * Session information
 */
export interface SessionData {
  readonly id: string;
  readonly userId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly expiresAt: string | null;
  readonly lastActiveAt: string;
}

/**
 * Token information for session management
 */
export interface TokenInfo {
  readonly hasToken: boolean;
  readonly template?: string;
  readonly expiresAt?: string;
}

/**
 * Authentication status response
 */
export interface AuthStatus {
  readonly authenticated: boolean;
  readonly user: User | null;
  readonly permissions: string[];
  readonly session: {
    readonly hasActiveSession: boolean;
    readonly hasValidToken: boolean;
  };
}

/**
 * User metadata from Clerk
 */
export interface UserMetadata {
  readonly role?: string;
  readonly organization?: string;
  readonly permissions?: string[];
  readonly [key: string]: unknown;
}

/**
 * Role definition with permissions
 */
export interface Role {
  readonly id: string;
  readonly name: string;
  readonly permissions: string[];
  readonly description?: string;
}

/**
 * Permission definition
 */
export interface Permission {
  readonly id: string;
  readonly name: string;
  readonly resource: string;
  readonly action: string;
  readonly description?: string;
}

/**
 * Organization context for multi-tenant support
 */
export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly role: string; // User's role in this organization
  readonly permissions?: string[];
}

/**
 * Authentication error types
 */
export interface AuthError {
  readonly error: string;
  readonly code: string;
  readonly timestamp: string;
  readonly path?: string;
}

/**
 * User creation/update input types
 */
export interface CreateUserInput {
  readonly email: string;
  readonly name: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly role: string;
  readonly organization?: string;
}

export interface UpdateUserInput {
  readonly name?: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly imageUrl?: string;
  readonly role?: string;
  readonly organization?: string;
}

/**
 * Type guards for runtime type checking
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj &&
    'role' in obj &&
    'roles' in obj &&
    'permissions' in obj &&
    typeof (obj as Record<string, unknown>)['id'] === 'string' &&
    typeof (obj as Record<string, unknown>)['email'] === 'string' &&
    typeof (obj as Record<string, unknown>)['name'] === 'string' &&
    typeof (obj as Record<string, unknown>)['role'] === 'string' &&
    Array.isArray((obj as Record<string, unknown>)['roles']) &&
    Array.isArray((obj as Record<string, unknown>)['permissions'])
  );
}

export function isUserAuthContext(obj: unknown): obj is UserAuthContext {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'role' in obj &&
    'roles' in obj &&
    'permissions' in obj &&
    'isAuthenticated' in obj &&
    typeof (obj as Record<string, unknown>)['id'] === 'string' &&
    typeof (obj as Record<string, unknown>)['role'] === 'string' &&
    Array.isArray((obj as Record<string, unknown>)['roles']) &&
    Array.isArray((obj as Record<string, unknown>)['permissions']) &&
    typeof (obj as Record<string, unknown>)['isAuthenticated'] === 'boolean'
  );
}

export function isAuthStatus(obj: unknown): obj is AuthStatus {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'authenticated' in obj &&
    'permissions' in obj &&
    'session' in obj &&
    typeof (obj as Record<string, unknown>)['authenticated'] === 'boolean' &&
    Array.isArray((obj as Record<string, unknown>)['permissions'])
  );
}

/**
 * Utility functions for user data transformation
 */
export function formatUserDisplayName(user: User | UserProfile): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.name) {
    return user.name;
  }
  return user.email;
}

export function getUserInitials(user: User | UserProfile): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  if (user.name) {
    const nameParts = user.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0]?.charAt(0) || ''}${nameParts[nameParts.length - 1]?.charAt(0) || ''}`.toUpperCase();
    }
    return nameParts[0]?.charAt(0)?.toUpperCase() || '';
  }
  return user.email.charAt(0).toUpperCase();
}

export function hasPermission(user: UserAuthContext, permission: string): boolean {
  return user.permissions.includes(permission);
}

export function hasRole(user: UserAuthContext, role: string): boolean {
  return user.roles.includes(role);
}

export function isInOrganization(user: User | UserAuthContext, organizationId: string): boolean {
  return user.organization === organizationId || 
         ('orgId' in user && user.orgId === organizationId);
}

/**
 * Constants for role and permission management
 */
export const ROLES = {
  STUDENT: 'student',
  CFI: 'cfi', 
  SCHOOL_ADMIN: 'school_admin'
} as const;

export const PERMISSIONS = {
  // Profile permissions
  READ_OWN_PROFILE: 'auth:read_own_profile',
  
  // Report permissions
  VIEW_OWN_REPORTS: 'reports:view_own',
  VIEW_STUDENT_REPORTS: 'reports:view_students',
  
  // Study plan permissions
  CREATE_OWN_STUDY_PLANS: 'study_plans:create_own',
  
  // Progress permissions
  VIEW_OWN_PROGRESS: 'progress:view_own',
  
  // Assignment permissions
  CREATE_ASSIGNMENTS: 'assignments:create',
  
  // Student management permissions
  MANAGE_STUDENTS: 'students:manage',
  
  // Organization permissions
  MANAGE_ORGANIZATION: 'organization:manage',
  INVITE_USERS: 'users:invite',
  
  // Analytics permissions
  VIEW_ANALYTICS: 'analytics:view'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];