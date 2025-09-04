import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface TokenPayload {
  exp?: number;
  sub?: string;
  [key: string]: unknown;
}

export async function POST() {
  try {
    const { userId, getToken } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - no active session' },
        { status: 401 }
      );
    }

    // Get a fresh JWT token with the backend template
    const token = await getToken({ 
      template: process.env['JWT_TEMPLATE'] || 'backend'
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate fresh token' },
        { status: 500 }
      );
    }

    // Decode the token to get expiration time (optional, for client reference)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3 || !tokenParts[1]) {
        throw new Error('Invalid JWT format');
      }
      const tokenPayload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString()
      ) as TokenPayload;
      
      return NextResponse.json({
        success: true,
        token,
        expiresAt: tokenPayload.exp ? new Date(tokenPayload.exp * 1000).toISOString() : null,
        issuedAt: new Date().toISOString(),
        userId: tokenPayload.sub || userId
      });
      
    } catch {
      // If token decode fails, still return the token
      return NextResponse.json({
        success: true,
        token,
        expiresAt: null,
        issuedAt: new Date().toISOString(),
        userId
      });
    }

  } catch (error) {
    // Log error for monitoring (in production, use proper logging service)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Token refresh failed',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}