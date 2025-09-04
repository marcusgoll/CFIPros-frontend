import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface UserMetadata {
  role?: string;
}

interface SessionData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  lastActiveAt: string;
}

interface UserData {
  id: string;
  email?: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
  role: string;
  emailVerified: boolean;
}

export async function GET() {
  try {
    const { userId, sessionId, getToken } = await auth();
    
    if (!userId || !sessionId) {
      return NextResponse.json({
        active: false,
        session: null,
        user: null
      });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({
        active: false,
        session: null,
        user: null
      });
    }

    // Get session info and token
    const token = await getToken({ template: process.env['JWT_TEMPLATE'] || 'backend' });
    const metadata = user.privateMetadata as UserMetadata;
    
    const sessionData: SessionData = {
      id: sessionId,
      userId: userId,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
      expiresAt: null, // Clerk manages session expiration internally
      lastActiveAt: new Date().toISOString()
    };

    const email = user.emailAddresses[0]?.emailAddress;
    const userData: UserData = {
      id: user.id,
      ...(email ? { email } : {}),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      role: metadata?.role || 'student',
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified'
    };
    
    return NextResponse.json({
      active: true,
      session: sessionData,
      user: userData,
      token: token ? {
        hasToken: true,
        template: process.env['JWT_TEMPLATE'] || 'backend'
      } : null
    });

  } catch {
    // Log error for monitoring (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No active session to delete' },
        { status: 400 }
      );
    }

    // Note: In Clerk, session termination is typically handled client-side
    // via the signOut() method. This endpoint is mainly for compatibility.
    
    return NextResponse.json({
      success: true,
      message: 'Session invalidation requested. Complete sign-out on client side.',
      redirectTo: '/sign-in'
    });

  } catch {
    // Log error for monitoring (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Failed to invalidate session' },
      { status: 500 }
    );
  }
}