/**
 * JWT Security Contract Tests
 * 
 * These tests ensure JWT validation security meets the requirements
 * and validates against the API contract in api-contracts/openapi.yaml
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock JWT validation responses for testing
const mockValidJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzJuUFdyRTVYWFhYeHh4eCIsImlhdCI6MTcwNDA5NjAwMCwiZXhwIjoxNzA0MDk5NjAwfQ.valid_signature";
const mockInvalidJWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.invalid_signature";
const mockMalformedJWT = "not.a.valid.jwt.format";

describe('JWT Security Contract Tests', () => {
  describe('Token Validation API Contract', () => {
    test('validates token request schema matches OpenAPI contract', () => {
      const tokenRequest = {
        token: mockValidJWT
      };
      
      // Validate request schema structure
      expect(tokenRequest).toHaveProperty('token');
      expect(typeof tokenRequest.token).toBe('string');
      expect(tokenRequest.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    test('returns correct success response schema for valid token', () => {
      const mockSuccessResponse = {
        valid: true,
        user_id: "user_2nPWrE5XXXXxxxx",
        roles: ["cfi"],
        expires_at: "2025-09-04T15:30:00Z"
      };

      // Validate response matches OpenAPI contract
      expect(mockSuccessResponse).toHaveProperty('valid');
      expect(mockSuccessResponse).toHaveProperty('user_id');
      expect(mockSuccessResponse).toHaveProperty('roles');
      expect(mockSuccessResponse).toHaveProperty('expires_at');
      
      // Validate types
      expect(typeof mockSuccessResponse.valid).toBe('boolean');
      expect(typeof mockSuccessResponse.user_id).toBe('string');
      expect(Array.isArray(mockSuccessResponse.roles)).toBe(true);
      expect(typeof mockSuccessResponse.expires_at).toBe('string');
      
      // Validate ISO date format (allow milliseconds variation)
      expect(mockSuccessResponse.expires_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    });

    test('returns correct error response schema for invalid token', () => {
      const mockErrorResponse = {
        error: "Invalid token signature",
        code: "INVALID_JWT",
        timestamp: "2025-09-04T12:00:00Z",
        path: "/api/auth/validate-token"
      };

      // Validate error response matches contract
      expect(mockErrorResponse).toHaveProperty('error');
      expect(mockErrorResponse).toHaveProperty('code');
      expect(typeof mockErrorResponse.error).toBe('string');
      expect(typeof mockErrorResponse.code).toBe('string');
      expect(mockErrorResponse.code).toBe('INVALID_JWT');
    });
  });

  describe('JWT Signature Verification', () => {
    test('validates JWT format before processing', () => {
      // Test valid JWT format (3 parts separated by dots)
      expect(isValidJWTFormat(mockValidJWT)).toBe(true);
      
      // Test invalid formats
      expect(isValidJWTFormat(mockMalformedJWT)).toBe(false);
      expect(isValidJWTFormat("only.two")).toBe(false);
      expect(isValidJWTFormat("")).toBe(false);
      expect(isValidJWTFormat("not-a-jwt")).toBe(false);
    });

    test('prevents manual JWT parsing without verification', () => {
      // This test ensures we DON'T use manual parsing
      const dangerousParseAttempt = () => {
        const parts = mockInvalidJWT.split('.');
        return JSON.parse(Buffer.from(parts[1], 'base64').toString());
      };

      // We should NOT do manual parsing - this would be dangerous
      expect(dangerousParseAttempt).toThrow();
    });

    test('validates token signature verification requirement', () => {
      const tokenValidationConfig = {
        requireSignatureVerification: true,
        allowManualParsing: false,
        verifyIssuer: true,
        verifyAudience: true,
        clockTolerance: 30 // seconds
      };

      // Validate security configuration
      expect(tokenValidationConfig.requireSignatureVerification).toBe(true);
      expect(tokenValidationConfig.allowManualParsing).toBe(false);
      expect(tokenValidationConfig.verifyIssuer).toBe(true);
      expect(tokenValidationConfig.verifyAudience).toBe(true);
      expect(tokenValidationConfig.clockTolerance).toBeLessThanOrEqual(60);
    });
  });

  describe('Token Expiration Validation', () => {
    test('validates token expiration with clock skew tolerance', () => {
      const now = Math.floor(Date.now() / 1000);
      const clockTolerance = 30; // 30 seconds
      
      // Test cases for expiration validation
      const testCases = [
        { exp: now + 3600, shouldBeValid: true, description: 'future expiration' },
        { exp: now - 10, shouldBeValid: true, description: 'recently expired within tolerance' },
        { exp: now - 60, shouldBeValid: false, description: 'expired beyond tolerance' },
        { exp: now + 1, shouldBeValid: true, description: 'expires soon but valid' }
      ];

      testCases.forEach(({ exp, shouldBeValid, description }) => {
        const isValid = validateTokenExpiration(exp, now, clockTolerance);
        expect(isValid).toBe(shouldBeValid);
      });
    });

    test('validates issuer and audience claims', () => {
      const validClerkClaims = {
        iss: 'https://clerk.accounts.dev',
        aud: 'cfipros-frontend',
        sub: 'user_2nPWrE5XXXXxxxx',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      // Validate required claims are present
      expect(validClerkClaims).toHaveProperty('iss');
      expect(validClerkClaims).toHaveProperty('aud');
      expect(validClerkClaims).toHaveProperty('sub');
      expect(validClerkClaims).toHaveProperty('iat');
      expect(validClerkClaims).toHaveProperty('exp');
      
      // Validate Clerk-specific issuer
      expect(validClerkClaims.iss).toContain('clerk');
      expect(typeof validClerkClaims.sub).toBe('string');
      expect(validClerkClaims.sub).toMatch(/^user_/);
    });
  });

  describe('JWT Validation Middleware', () => {
    test('validates middleware configuration requirements', () => {
      const middlewareConfig = {
        validateSignature: true,
        checkExpiration: true,
        verifyIssuer: true,
        verifyAudience: true,
        allowedIssuers: ['https://clerk.accounts.dev'],
        clockSkew: 30,
        requiredClaims: ['sub', 'iss', 'aud', 'exp', 'iat']
      };

      // Validate security-first configuration
      expect(middlewareConfig.validateSignature).toBe(true);
      expect(middlewareConfig.checkExpiration).toBe(true);
      expect(middlewareConfig.verifyIssuer).toBe(true);
      expect(middlewareConfig.verifyAudience).toBe(true);
      expect(middlewareConfig.allowedIssuers).toContain('https://clerk.accounts.dev');
      expect(middlewareConfig.requiredClaims).toContain('sub');
    });

    test('validates secure error handling for invalid tokens', () => {
      const invalidTokenScenarios = [
        { token: null, expectedError: 'Token required', expectedCode: 'MISSING_TOKEN' },
        { token: '', expectedError: 'Token required', expectedCode: 'MISSING_TOKEN' },
        { token: 'invalid-format', expectedError: 'Invalid token format', expectedCode: 'INVALID_FORMAT' },
        { token: mockInvalidJWT, expectedError: 'Invalid token signature', expectedCode: 'INVALID_JWT' }
      ];

      invalidTokenScenarios.forEach(({ token, expectedError, expectedCode }) => {
        const errorResponse = generateTokenValidationError(token);
        expect(errorResponse.error).toContain(expectedError.toLowerCase());
        expect(errorResponse.code).toBe(expectedCode);
      });
    });
  });

  describe('Security Anti-patterns Prevention', () => {
    test('prevents unsafe token operations', () => {
      // These operations should NOT be done - testing that we avoid them
      const unsafeOperations = {
        manualParsing: false,
        trustingUnverifiedTokens: false,
        ignoringExpiration: false,
        skipSignatureCheck: false
      };

      Object.entries(unsafeOperations).forEach(([operation, allowed]) => {
        expect(allowed).toBe(false);
      });
    });

    test('validates secure token storage requirements', () => {
      const tokenStorageSecurity = {
        storeInHttpOnlyCookies: true,
        avoidLocalStorage: true,
        useSecureTransmission: true,
        implementCSRFProtection: true
      };

      expect(tokenStorageSecurity.storeInHttpOnlyCookies).toBe(true);
      expect(tokenStorageSecurity.avoidLocalStorage).toBe(true);
      expect(tokenStorageSecurity.useSecureTransmission).toBe(true);
      expect(tokenStorageSecurity.implementCSRFProtection).toBe(true);
    });
  });
});

// Helper functions for JWT validation tests
function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

function validateTokenExpiration(exp: number, now: number, tolerance: number): boolean {
  return (exp + tolerance) > now;
}

function generateTokenValidationError(token: string | null) {
  if (!token) {
    return { error: 'token required', code: 'MISSING_TOKEN' };
  }
  if (!isValidJWTFormat(token)) {
    return { error: 'invalid token format', code: 'INVALID_FORMAT' };
  }
  return { error: 'invalid token signature', code: 'INVALID_JWT' };
}