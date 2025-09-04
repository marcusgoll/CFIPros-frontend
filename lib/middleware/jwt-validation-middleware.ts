/**
 * JWT Validation Middleware
 * 
 * Comprehensive middleware for JWT token validation with security-first approach
 * Implements proper signature verification, expiration checking, and claim validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuthorizationHeader, type TokenValidationOptions } from '@/lib/utils/jwt-validation';

export interface JWTMiddlewareOptions extends TokenValidationOptions {
  skipValidation?: (request: NextRequest) => boolean;
  onValidationError?: (error: string, code: string) => NextResponse;
  requiredRole?: string;
  requiredPermissions?: string[];
}

export interface JWTValidationContext {
  isValid: boolean;
  userId?: string | undefined;
  roles?: string[] | undefined;
  organization?: string | undefined;
  error?: string | undefined;
  errorCode?: string | undefined;
}

/**
 * Create JWT validation middleware with comprehensive security checks
 */
export function createJWTValidationMiddleware(options: JWTMiddlewareOptions = {}) {
  const {
    skipValidation,
    onValidationError,
    requiredRole,
    requiredPermissions = []
  } = options;

  return async (
    request: NextRequest,
    handler: (request: NextRequest, context: JWTValidationContext) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    
    // Check if validation should be skipped for this request
    if (skipValidation && skipValidation(request)) {
      return handler(request, { isValid: true });
    }

    try {
      // Extract Authorization header
      const authHeader = request.headers.get('Authorization');
      
      // Validate the authorization header and token
      const validation = await validateAuthorizationHeader(authHeader);
      
      if (!validation.isValid) {
        const errorResponse = onValidationError 
          ? onValidationError(validation.error || 'Authentication failed', validation.errorCode || 'INVALID_TOKEN')
          : createDefaultErrorResponse(validation.error || 'Authentication failed', validation.errorCode || 'INVALID_TOKEN');
        
        return errorResponse;
      }

      // Additional role-based validation if required
      if (requiredRole && validation.data?.roles) {
        const userRoles = Array.isArray(validation.data.roles) ? validation.data.roles : [];
        if (!userRoles.includes(requiredRole)) {
          const errorResponse = onValidationError
            ? onValidationError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS')
            : createDefaultErrorResponse('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
          
          return errorResponse;
        }
      }

      // Additional permission-based validation
      if (requiredPermissions.length > 0 && validation.data?.roles) {
        const hasRequiredPermissions = checkPermissions(validation.data.roles, requiredPermissions);
        if (!hasRequiredPermissions) {
          const errorResponse = onValidationError
            ? onValidationError('Required permissions not met', 'MISSING_PERMISSIONS')
            : createDefaultErrorResponse('Required permissions not met', 'MISSING_PERMISSIONS');
          
          return errorResponse;
        }
      }

      // Create validation context for the handler
      const context: JWTValidationContext = {
        isValid: true,
        userId: validation.data?.userId || undefined,
        roles: validation.data?.roles || undefined,
        organization: validation.data?.organization || undefined
      };

      // Call the protected handler with validation context
      return handler(request, context);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'JWT validation failed';
      const errorResponse = onValidationError
        ? onValidationError(errorMessage, 'MIDDLEWARE_ERROR')
        : createDefaultErrorResponse(errorMessage, 'MIDDLEWARE_ERROR');
      
      return errorResponse;
    }
  };
}

/**
 * Create a simplified middleware for API route protection
 */
export function withJWTValidation(
  handler: (request: NextRequest, context: JWTValidationContext) => Promise<NextResponse>,
  options: JWTMiddlewareOptions = {}
) {
  const middleware = createJWTValidationMiddleware(options);
  
  return async (request: NextRequest): Promise<NextResponse> => {
    return middleware(request, handler);
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(role: string, options: JWTMiddlewareOptions = {}) {
  return createJWTValidationMiddleware({
    ...options,
    requiredRole: role
  });
}

/**
 * Permission-based access control middleware
 */
export function requirePermissions(permissions: string[], options: JWTMiddlewareOptions = {}) {
  return createJWTValidationMiddleware({
    ...options,
    requiredPermissions: permissions
  });
}

/**
 * Create default error response for validation failures
 */
function createDefaultErrorResponse(error: string, code: string): NextResponse {
  return NextResponse.json({
    error,
    code,
    timestamp: new Date().toISOString()
  }, { 
    status: code === 'INSUFFICIENT_PERMISSIONS' || code === 'MISSING_PERMISSIONS' ? 403 : 401 
  });
}

/**
 * Check if user roles meet required permissions
 */
function checkPermissions(userRoles: string[], requiredPermissions: string[]): boolean {
  // Define role-permission mapping
  const rolePermissions: Record<string, string[]> = {
    'school_admin': ['manage_users', 'view_analytics', 'upload_files', 'view_reports', 'manage_students'],
    'cfi': ['upload_files', 'view_reports', 'manage_students'],
    'student': ['upload_files', 'view_reports']
  };

  // Get all permissions for user's roles
  const userPermissions = userRoles.reduce((permissions: string[], role: string) => {
    return permissions.concat(rolePermissions[role] || []);
  }, []);

  // Check if all required permissions are present
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Utility to extract JWT context from validated request
 */
export function extractJWTContext(context: JWTValidationContext) {
  return {
    userId: context.userId,
    roles: context.roles || [],
    organization: context.organization,
    isAuthenticated: context.isValid
  };
}

/**
 * Development mode JWT validation bypass (use with caution)
 */
export function createDevelopmentBypass(): JWTMiddlewareOptions {
  return {
    skipValidation: () => process.env.NODE_ENV === 'development' && process.env['BYPASS_JWT'] === 'true'
  };
}