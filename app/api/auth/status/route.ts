import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

interface UserMetadata {
  role?: string;
}

export async function GET() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        permissions: [],
        session: {
          hasActiveSession: false,
          hasValidToken: false,
        },
      });
    }

    // Get user role from metadata or default to student
    const metadata = user.privateMetadata as UserMetadata;
    const role = metadata?.role || 'student';
    
    // Get organization info if available (simplified approach for now)
    const organization = null; // TODO: Implement organization fetching via Clerk API

    // Define permissions based on role
    const permissions = getPermissionsByRole(role);

    // Get session token validation status
    const { getToken } = await auth();
    const hasValidToken = !!(await getToken({ template: process.env['JWT_TEMPLATE'] || "backend" }).catch(() => null));

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      },
      permissions,
      session: {
        hasActiveSession: true,
        hasValidToken,
      },
    });

  } catch (error) {
    // TODO: Replace with proper logging service in production  
    // logger.error('Auth status error', { error: error.message });
    console.error('Auth status error:', error);
    return NextResponse.json(
      { error: 'Authentication status check failed' },
      { status: 500 }
    );
  }
}

function getPermissionsByRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'student': [
      'auth:read_own_profile',
      'reports:view_own',
      'study_plans:create_own',
      'progress:view_own',
    ],
    'cfi': [
      'auth:read_own_profile',
      'reports:view_own',
      'study_plans:create_own',
      'progress:view_own',
      'reports:view_students',
      'assignments:create',
      'students:manage'
    ],
    'school_admin': [
      'auth:read_own_profile',
      'reports:view_own',
      'study_plans:create_own',
      'progress:view_own',
      'reports:view_students',
      'assignments:create',
      'students:manage',
      'organization:manage',
      'users:invite',
      'analytics:view'
    ]
  };

  return rolePermissions[role] || rolePermissions['student'] || [];
}