import { NextRequest, NextResponse } from 'next/server';
import { validateJWTSecurely } from '@/lib/utils/jwt-validation';

/**
 * JWT Token Validation Endpoint
 * 
 * Validates JWT tokens with proper signature verification
 * Implements the API contract defined in api-contracts/openapi.yaml
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json({
        error: 'Request body is required',
        code: 'MISSING_BODY',
        timestamp: new Date().toISOString(),
        path: '/api/auth/validate-token'
      }, { status: 400 });
    }

    const { token } = body;

    // Validate token presence
    if (!token) {
      return NextResponse.json({
        error: 'Token is required',
        code: 'MISSING_TOKEN',
        timestamp: new Date().toISOString(),
        path: '/api/auth/validate-token'
      }, { status: 400 });
    }

    // Validate token using secure verification
    const validation = await validateJWTSecurely(token, {
      clockTolerance: 30,
      verifyIssuer: true,
      requiredClaims: ['sub', 'exp', 'iat']
    });

    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.error || 'Invalid token',
        code: validation.errorCode || 'INVALID_JWT',
        timestamp: new Date().toISOString(),
        path: '/api/auth/validate-token'
      }, { status: 401 });
    }

    // Return successful validation response matching OpenAPI contract
    return NextResponse.json({
      valid: true,
      user_id: validation.data?.userId,
      roles: validation.data?.roles || [],
      expires_at: validation.data?.exp ? new Date(validation.data.exp * 1000).toISOString() : null
    }, { status: 200 });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Token validation error:', error);
    
    return NextResponse.json({
      error: 'Token validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
      path: '/api/auth/validate-token'
    }, { status: 500 });
  }
}

/**
 * Handle GET requests to provide endpoint info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/validate-token',
    method: 'POST',
    description: 'Validates JWT tokens with signature verification',
    contract: 'See api-contracts/openapi.yaml'
  });
}