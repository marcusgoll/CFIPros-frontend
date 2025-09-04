import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/utils/logger";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  role: string;
  permissions: string[];
  joinedAt: string;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

interface UserMetadata {
  role?: string;
}

interface OrganizationRequest {
  name: string;
  description?: string;
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

    // Organizations will be fetched via Clerk Organizations API when integration is complete
    const organizations: Organization[] = [];

    return NextResponse.json({
      organizations,
      totalCount: organizations.length,
      activeOrganization: null,
      message: 'Organization support requires Clerk API integration'
    });

  } catch (error) {
    logError('Organizations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    // Check if user has permission to create organizations
    const metadata = user.privateMetadata as UserMetadata;
    const userRole = metadata?.role || 'student';
    if (!['school_admin', 'cfi'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create organizations' },
        { status: 403 }
      );
    }

    const body = await request.json() as OrganizationRequest;
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Organization creation will be implemented via Clerk Organizations API when integration is complete
    const newOrganization: Organization = {
      id: `org_${Date.now()}`, // Simulate organization ID
      name,
      description: description || null,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      role: 'admin',
      permissions: getOrganizationPermissions('admin'),
      joinedAt: new Date().toISOString(),
      isActive: true,
      memberCount: 1,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(
      { 
        success: true,
        message: 'Organization created successfully',
        organization: newOrganization 
      },
      { status: 201 }
    );

  } catch (error) {
    logError('Organization creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

function getOrganizationPermissions(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'admin': [
      'org:manage_members',
      'org:manage_settings',
      'org:view_billing',
      'org:export_data',
      'org:delete_organization'
    ],
    'member': [
      'org:view_members',
      'org:collaborate',
      'org:view_reports'
    ]
  };

  return rolePermissions[role] || rolePermissions['member'] || [];
}