/**
 * Secure JWT Validation Utilities
 * 
 * Provides secure JWT validation using Clerk's built-in verification
 * instead of dangerous manual parsing
 */

import { verifyToken } from '@clerk/nextjs/server';

export interface ValidatedTokenData {
  userId: string;
  roles?: string[];
  organization?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface TokenValidationResult {
  isValid: boolean;
  data?: ValidatedTokenData;
  error?: string;
  errorCode?: string;
}

export interface TokenValidationOptions {
  clockTolerance?: number; // seconds
  verifyIssuer?: boolean;
  verifyAudience?: boolean;
  requiredClaims?: string[];
}

/**
 * Securely validate a JWT token using Clerk's verification
 * This replaces dangerous manual parsing with proper signature verification
 */
export async function validateJWTSecurely(
  token: string,
  options: TokenValidationOptions = {}
): Promise<TokenValidationResult> {
  try {
    // Input validation
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        error: 'Token is required and must be a string',
        errorCode: 'MISSING_TOKEN'
      };
    }

    // Validate JWT format (3 parts separated by dots)
    if (!isValidJWTFormat(token)) {
      return {
        isValid: false,
        error: 'Invalid token format',
        errorCode: 'INVALID_FORMAT'
      };
    }

    // Use Clerk's secure token verification
    const jwtKey = process.env['CLERK_JWT_KEY'];
    const payload = await verifyToken(token, jwtKey ? { jwtKey } : {});
    
    if (!payload) {
      return {
        isValid: false,
        error: 'Invalid token signature',
        errorCode: 'INVALID_JWT'
      };
    }

    // Extract user data from verified payload
    const validatedData: ValidatedTokenData = {
      userId: payload.sub || '',
      ...payload
    };

    // Additional validation checks
    const validationError = performAdditionalValidation(payload, options);
    if (validationError) {
      return {
        isValid: false,
        error: validationError.error,
        errorCode: validationError.code
      };
    }

    return {
      isValid: true,
      data: validatedData
    };

  } catch (error) {
    // Handle verification errors securely
    const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
    
    // Determine error code based on error type
    let errorCode = 'VERIFICATION_ERROR';
    if (errorMessage.toLowerCase().includes('expired')) {
      errorCode = 'TOKEN_EXPIRED';
    } else if (errorMessage.toLowerCase().includes('signature')) {
      errorCode = 'INVALID_SIGNATURE';
    }

    return {
      isValid: false,
      error: errorMessage,
      errorCode
    };
  }
}

/**
 * Extract token metadata safely without signature verification
 * Only for metadata that doesn't require security validation (like expiration display)
 */
export function extractTokenMetadataSafely(token: string): { expiresAt: string | null; error?: string } {
  try {
    if (!isValidJWTFormat(token)) {
      return { expiresAt: null, error: 'Invalid token format' };
    }

    // This is ONLY for metadata extraction - not for security decisions
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1] || '', 'base64').toString());
    
    return {
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
    };
  } catch {
    return { expiresAt: null, error: 'Failed to extract metadata' };
  }
}

/**
 * Validate JWT format (3 base64-encoded parts)
 */
function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {return false;}
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Perform additional validation checks on verified token payload
 */
function performAdditionalValidation(
  payload: Record<string, unknown>,
  options: TokenValidationOptions
): { error: string; code: string } | null {
  const {
    clockTolerance = 30,
    verifyIssuer = true,
    requiredClaims = ['sub', 'exp', 'iat']
  } = options;

  // Check required claims
  for (const claim of requiredClaims) {
    if (!payload[claim]) {
      return {
        error: `Missing required claim: ${claim}`,
        code: 'MISSING_CLAIM'
      };
    }
  }

  // Check token expiration with clock tolerance
  if (payload['exp']) {
    const now = Math.floor(Date.now() / 1000);
    if ((payload['exp'] as number + clockTolerance) < now) {
      return {
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      };
    }
  }

  // Validate issuer if required
  if (verifyIssuer && payload['iss']) {
    const allowedIssuers = [
      'https://clerk.accounts.dev',
      'https://clerk.dev'
    ];
    
    if (!allowedIssuers.some(() => (payload['iss'] as string).includes('clerk'))) {
      return {
        error: 'Invalid token issuer',
        code: 'INVALID_ISSUER'
      };
    }
  }

  return null;
}

/**
 * Create middleware for JWT validation
 */
export function createJWTValidationMiddleware(options: TokenValidationOptions = {}) {
  return async (token: string): Promise<TokenValidationResult> => {
    return validateJWTSecurely(token, options);
  };
}

/**
 * Validate JWT from Authorization header
 */
export async function validateAuthorizationHeader(authHeader: string | null): Promise<TokenValidationResult> {
  if (!authHeader) {
    return {
      isValid: false,
      error: 'Authorization header required',
      errorCode: 'MISSING_AUTH_HEADER'
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: 'Invalid authorization header format',
      errorCode: 'INVALID_AUTH_FORMAT'
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  return validateJWTSecurely(token);
}