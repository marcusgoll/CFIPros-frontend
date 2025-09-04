import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/utils/logger";

interface UserMetadata {
  role?: string;
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user role from metadata or default to student
    const metadata = user.privateMetadata as UserMetadata;
    const role = metadata?.role || 'student';
    
    // Get permissions based on role
    const permissions = getPermissionsByRole(role);
    
    // Organization-specific permissions will be populated when Clerk Organizations API is integrated
    const orgPermissions: string[] = [];

    return NextResponse.json({
      permissions: [...permissions, ...orgPermissions],
      role,
      organizationRole: null
    });

  } catch (error) {
    logError('Permissions fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      'progress:view_own'
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