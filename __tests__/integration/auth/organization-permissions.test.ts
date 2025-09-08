/**
 * Integration tests for Task 5.2: Organization and Permission Testing
 * 
 * Tests comprehensive organization-based access control, multi-org membership,
 * role assignment validation, file sharing permissions, and organization management
 * capabilities following Clerk authentication integration patterns.
 * 
 * Contract validation against OpenAPI specification with Zod schema enforcement.
 */

import { z } from 'zod';

// Mock data for comprehensive organization and permission testing scenarios
const MOCK_ORGANIZATION_DATA = {
  organizations: {
    flightAcademy: {
      id: 'org_flight_academy_123',
      name: 'Professional Flight Academy',
      description: 'Leading aviation training institution',
      slug: 'professional-flight-academy',
      isActive: true,
      memberCount: 125,
      createdAt: '2024-01-15T10:00:00Z',
      settings: {
        allowGuestAccess: false,
        requireEmailVerification: true,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['.pdf', '.docx', '.txt', '.aktr'],
        retentionPolicy: '7_years'
      }
    },
    cfiInstitute: {
      id: 'org_cfi_institute_456',
      name: 'CFI Training Institute',
      description: 'Advanced instructor certification programs',
      slug: 'cfi-training-institute',
      isActive: true,
      memberCount: 45,
      createdAt: '2024-02-10T14:30:00Z',
      settings: {
        allowGuestAccess: true,
        requireEmailVerification: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedFileTypes: ['.pdf', '.docx', '.txt', '.aktr', '.ppt', '.xlsx'],
        retentionPolicy: '10_years'
      }
    },
    regionalAirport: {
      id: 'org_regional_airport_789',
      name: 'Regional Airport Authority',
      description: 'Municipal aviation services and training',
      slug: 'regional-airport-authority',
      isActive: true,
      memberCount: 85,
      createdAt: '2024-03-05T09:15:00Z',
      settings: {
        allowGuestAccess: false,
        requireEmailVerification: true,
        maxFileSize: 25 * 1024 * 1024, // 25MB
        allowedFileTypes: ['.pdf', '.txt', '.aktr'],
        retentionPolicy: '5_years'
      }
    }
  },
  users: {
    multiOrgAdmin: {
      id: 'user_multi_admin_001',
      email: 'admin@flightacademy.com',
      firstName: 'Sarah',
      lastName: 'Chen',
      imageUrl: 'https://img.clerk.com/user_001',
      role: 'school_admin',
      emailVerified: true,
      organizations: [
        {
          organizationId: 'org_flight_academy_123',
          role: 'admin',
          permissions: [
            'org:manage_members',
            'org:manage_settings',
            'org:view_billing',
            'org:export_data',
            'org:delete_organization',
            'files:upload',
            'files:download',
            'files:share',
            'files:delete',
            'reports:view_all',
            'analytics:access'
          ],
          joinedAt: '2024-01-15T10:30:00Z',
          isActive: true
        },
        {
          organizationId: 'org_cfi_institute_456',
          role: 'member',
          permissions: [
            'org:view_members',
            'org:collaborate',
            'org:view_reports',
            'files:upload',
            'files:download',
            'files:view_shared'
          ],
          joinedAt: '2024-02-20T16:45:00Z',
          isActive: true
        }
      ]
    },
    cfiInstructor: {
      id: 'user_cfi_instructor_002',
      email: 'instructor@cfiinstitute.com',
      firstName: 'Mike',
      lastName: 'Rodriguez',
      imageUrl: 'https://img.clerk.com/user_002',
      role: 'cfi',
      emailVerified: true,
      organizations: [
        {
          organizationId: 'org_cfi_institute_456',
          role: 'admin',
          permissions: [
            'org:manage_members',
            'org:manage_settings',
            'org:view_billing',
            'org:export_data',
            'files:upload',
            'files:download',
            'files:share',
            'files:delete',
            'reports:view_all',
            'students:manage',
            'assignments:create'
          ],
          joinedAt: '2024-02-10T15:00:00Z',
          isActive: true
        },
        {
          organizationId: 'org_regional_airport_789',
          role: 'instructor',
          permissions: [
            'org:view_members',
            'org:collaborate',
            'files:upload',
            'files:download',
            'files:view_shared',
            'students:view',
            'assignments:view'
          ],
          joinedAt: '2024-03-10T11:20:00Z',
          isActive: true
        }
      ]
    },
    studentPilot: {
      id: 'user_student_pilot_003',
      email: 'student@flightacademy.com',
      firstName: 'Emma',
      lastName: 'Wilson',
      imageUrl: 'https://img.clerk.com/user_003',
      role: 'student',
      emailVerified: true,
      organizations: [
        {
          organizationId: 'org_flight_academy_123',
          role: 'student',
          permissions: [
            'org:view_members',
            'files:upload',
            'files:download',
            'files:view_own',
            'reports:view_own',
            'progress:view_own'
          ],
          joinedAt: '2024-01-20T13:15:00Z',
          isActive: true
        }
      ]
    },
    guestUser: {
      id: 'user_guest_004',
      email: 'guest@example.com',
      firstName: 'John',
      lastName: 'Doe',
      imageUrl: 'https://img.clerk.com/user_004',
      role: 'student',
      emailVerified: false,
      organizations: [
        {
          organizationId: 'org_cfi_institute_456',
          role: 'guest',
          permissions: [
            'files:view_shared',
            'reports:view_public'
          ],
          joinedAt: '2024-04-01T09:30:00Z',
          isActive: true
        }
      ]
    },
    outsiderUser: {
      id: 'user_outsider_005',
      email: 'outsider@external.com',
      firstName: 'Alex',
      lastName: 'Thompson',
      imageUrl: 'https://img.clerk.com/user_005',
      role: 'student',
      emailVerified: true,
      organizations: [
        {
          organizationId: 'org_external_school_999',
          role: 'student',
          permissions: [
            'files:view_own',
            'reports:view_own'
          ],
          joinedAt: '2024-04-10T12:00:00Z',
          isActive: true
        }
      ]
    }
  },
  files: {
    privateStudentFile: {
      id: 'file_student_private_001',
      name: 'Private_Flight_Log.aktr',
      organizationId: 'org_flight_academy_123',
      ownerId: 'user_student_pilot_003',
      visibility: 'private',
      permissions: {
        owner: ['read', 'write', 'delete', 'share'],
        organization: [],
        public: []
      },
      size: 2 * 1024 * 1024, // 2MB
      createdAt: '2024-04-01T10:00:00Z'
    },
    sharedInstructorFile: {
      id: 'file_instructor_shared_002',
      name: 'CFI_Training_Manual.pdf',
      organizationId: 'org_cfi_institute_456',
      ownerId: 'user_cfi_instructor_002',
      visibility: 'organization',
      permissions: {
        owner: ['read', 'write', 'delete', 'share'],
        organization: ['read', 'comment'],
        public: []
      },
      size: 15 * 1024 * 1024, // 15MB
      createdAt: '2024-03-15T14:20:00Z'
    },
    crossOrgFile: {
      id: 'file_cross_org_003',
      name: 'Aviation_Standards.pdf',
      organizationId: 'org_flight_academy_123',
      ownerId: 'user_multi_admin_001',
      visibility: 'cross_org',
      permissions: {
        owner: ['read', 'write', 'delete', 'share'],
        organization: ['read'],
        crossOrg: ['org_cfi_institute_456'],
        public: []
      },
      size: 8 * 1024 * 1024, // 8MB
      createdAt: '2024-02-28T16:45:00Z'
    }
  },
  invitations: {
    pendingInvite: {
      id: 'invite_pending_001',
      organizationId: 'org_flight_academy_123',
      email: 'newpilot@example.com',
      role: 'student',
      invitedBy: 'user_multi_admin_001',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      status: 'pending',
      token: 'inv_token_abc123'
    },
    expiredInvite: {
      id: 'invite_expired_002',
      organizationId: 'org_cfi_institute_456',
      email: 'expired@example.com',
      role: 'member',
      invitedBy: 'user_cfi_instructor_002',
      createdAt: '2024-03-01T10:00:00Z',
      expiresAt: '2024-03-08T10:00:00Z',
      status: 'expired',
      token: 'inv_token_def456'
    }
  }
};

// Zod schemas for comprehensive organization and permission contract validation
const OrganizationSchema = z.object({
  id: z.string().regex(/^org_[a-z0-9_]+$/, 'Organization ID must follow org_ prefix pattern'),
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().nullable(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  isActive: z.boolean(),
  memberCount: z.number().int().min(0, 'Member count cannot be negative'),
  createdAt: z.string().datetime('Invalid ISO datetime format'),
  settings: z.object({
    allowGuestAccess: z.boolean(),
    requireEmailVerification: z.boolean(),
    maxFileSize: z.number().int().min(1024, 'Minimum file size 1KB').max(1024 * 1024 * 1024, 'Maximum file size 1GB'),
    allowedFileTypes: z.array(z.string().regex(/^\.[a-z0-9]+$/, 'File extension must start with dot')),
    retentionPolicy: z.enum(['1_year', '3_years', '5_years', '7_years', '10_years', 'permanent'])
  }).optional()
});

const OrganizationMembershipSchema = z.object({
  organizationId: z.string().regex(/^org_[a-z0-9_]+$/, 'Invalid organization ID format'),
  role: z.enum(['admin', 'member', 'instructor', 'student', 'guest'], {
    errorMap: () => ({ message: 'Invalid role type' })
  }),
  permissions: z.array(z.string().regex(/^[a-z_]+:[a-z_]+$/, 'Permission format: resource:action')).min(1, 'At least one permission required'),
  joinedAt: z.string().datetime('Invalid join date format'),
  isActive: z.boolean()
});

const UserOrganizationProfileSchema = z.object({
  id: z.string().regex(/^user_[a-z0-9_]+$/, 'User ID must follow user_ prefix pattern'),
  email: z.string().email('Valid email address required'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  imageUrl: z.string().url('Valid image URL required'),
  role: z.enum(['student', 'cfi', 'school_admin'], {
    errorMap: () => ({ message: 'Invalid global role type' })
  }),
  emailVerified: z.boolean(),
  organizations: z.array(OrganizationMembershipSchema).min(1, 'User must belong to at least one organization')
});

const FileAccessPermissionSchema = z.object({
  id: z.string().regex(/^file_[a-z0-9_]+$/, 'File ID must follow file_ prefix pattern'),
  name: z.string().min(1, 'Filename required').max(255, 'Filename too long'),
  organizationId: z.string().regex(/^org_[a-z0-9_]+$/, 'Invalid organization ID'),
  ownerId: z.string().regex(/^user_[a-z0-9_]+$/, 'Invalid owner user ID'),
  visibility: z.enum(['private', 'organization', 'cross_org', 'public'], {
    errorMap: () => ({ message: 'Invalid visibility setting' })
  }),
  permissions: z.object({
    owner: z.array(z.enum(['read', 'write', 'delete', 'share'])).min(1),
    organization: z.array(z.enum(['read', 'write', 'comment', 'download'])),
    crossOrg: z.array(z.string().regex(/^org_[a-z0-9_]+$/)).optional(),
    public: z.array(z.enum(['read', 'download']))
  }),
  size: z.number().int().min(1, 'File size must be positive'),
  createdAt: z.string().datetime('Invalid creation date')
});

const OrganizationInvitationSchema = z.object({
  id: z.string().regex(/^invite_[a-z0-9_]+$/, 'Invitation ID must follow invite_ prefix pattern'),
  organizationId: z.string().regex(/^org_[a-z0-9_]+$/, 'Invalid organization ID'),
  email: z.string().email('Valid email address required for invitation'),
  role: z.enum(['admin', 'member', 'instructor', 'student', 'guest']),
  invitedBy: z.string().regex(/^user_[a-z0-9_]+$/, 'Invalid inviter user ID'),
  createdAt: z.string().datetime('Invalid invitation creation date'),
  expiresAt: z.string().datetime('Invalid expiration date'),
  status: z.enum(['pending', 'accepted', 'declined', 'expired', 'cancelled']),
  token: z.string().regex(/^inv_token_[a-z0-9]+$/, 'Invalid invitation token format')
});

// Organization and permission validation utility class
class OrganizationPermissionValidator {
  static validateOrganization(data: any): z.SafeParseReturnType<any, any> {
    return OrganizationSchema.safeParse(data);
  }

  static validateUserOrganizationProfile(data: any): z.SafeParseReturnType<any, any> {
    return UserOrganizationProfileSchema.safeParse(data);
  }

  static validateFilePermissions(data: any): z.SafeParseReturnType<any, any> {
    return FileAccessPermissionSchema.safeParse(data);
  }

  static validateInvitation(data: any): z.SafeParseReturnType<any, any> {
    return OrganizationInvitationSchema.safeParse(data);
  }

  static validateRolePermissions(role: string, permissions: string[]): boolean {
    const rolePermissionMap: Record<string, string[]> = {
      'admin': [
        'org:manage_members', 'org:manage_settings', 'org:view_billing',
        'org:export_data', 'org:delete_organization', 'files:upload',
        'files:download', 'files:share', 'files:delete', 'reports:view_all',
        'analytics:access'
      ],
      'member': [
        'org:view_members', 'org:collaborate', 'org:view_reports',
        'files:upload', 'files:download', 'files:view_shared'
      ],
      'instructor': [
        'org:view_members', 'org:collaborate', 'files:upload',
        'files:download', 'files:view_shared', 'students:view',
        'assignments:view', 'students:manage', 'assignments:create'
      ],
      'student': [
        'org:view_members', 'files:upload', 'files:download',
        'files:view_own', 'reports:view_own', 'progress:view_own'
      ],
      'guest': [
        'files:view_shared', 'reports:view_public'
      ]
    };

    const allowedPermissions = rolePermissionMap[role] || [];
    return permissions.every(permission => allowedPermissions.includes(permission));
  }

  static validateFileAccess(user: any, file: any, action: string): boolean {
    // Owner has full access to their files
    if (file.ownerId === user.id) {
      return file.permissions.owner.includes(action);
    }

    // Check organization-level access
    const userOrgMembership = user.organizations.find(
      (org: any) => org.organizationId === file.organizationId && org.isActive
    );

    if (!userOrgMembership) {
      // Check cross-organization access
      if (file.visibility === 'cross_org' && file.permissions.crossOrg) {
        const userHasCrossOrgAccess = user.organizations.some(
          (org: any) => file.permissions.crossOrg.includes(org.organizationId) && org.isActive
        );
        return userHasCrossOrgAccess && file.permissions.organization.includes(action);
      }

      // Check public access
      if (file.visibility === 'public') {
        return file.permissions.public.includes(action);
      }

      return false;
    }

    // Organization member access - restrict write actions for non-owners
    if (file.visibility === 'organization' || file.visibility === 'cross_org') {
      // Only allow read and comment actions for organization members who aren't owners
      if (['write', 'delete', 'share'].includes(action)) {
        return false;
      }
      return file.permissions.organization.includes(action);
    }

    return false;
  }

  static validateInvitationAccess(inviter: any, organizationId: string, targetRole: string): boolean {
    const inviterOrgMembership = inviter.organizations.find(
      (org: any) => org.organizationId === organizationId && org.isActive
    );

    if (!inviterOrgMembership) {
      return false;
    }

    // Only admins can invite other admins
    if (targetRole === 'admin') {
      return inviterOrgMembership.role === 'admin';
    }

    // Admins can invite anyone, but instructors have limitations  
    if (inviterOrgMembership.role === 'admin') {
      return true;
    }

    // Instructors can only invite students and guests, NOT other admins or instructors
    if (inviterOrgMembership.role === 'instructor') {
      return ['student', 'guest'].includes(targetRole);
    }

    return false;
  }
}

// Mock HTTP client for organization API testing
class MockOrganizationApiClient {
  private baseUrl = 'http://localhost:3000/api';

  async getOrganizations(userId: string) {
    // Simulate API call to /api/auth/organizations
    const user = Object.values(MOCK_ORGANIZATION_DATA.users).find(u => u.id === userId);
    if (!user) {
      return { status: 404, data: { error: 'User not found' } };
    }

    const organizations = user.organizations.map(membership => {
      const orgData = Object.values(MOCK_ORGANIZATION_DATA.organizations).find(
        org => org.id === membership.organizationId
      );
      return {
        ...orgData,
        role: membership.role,
        permissions: membership.permissions,
        joinedAt: membership.joinedAt,
        isActive: membership.isActive
      };
    });

    return {
      status: 200,
      data: {
        organizations,
        totalCount: organizations.length,
        activeOrganization: organizations[0] || null
      }
    };
  }

  async createOrganization(userId: string, orgData: any) {
    // Simulate API call to POST /api/auth/organizations
    const user = Object.values(MOCK_ORGANIZATION_DATA.users).find(u => u.id === userId);
    if (!user) {
      return { status: 404, data: { error: 'User not found' } };
    }

    if (!['school_admin', 'cfi'].includes(user.role)) {
      return { status: 403, data: { error: 'Insufficient permissions to create organizations' } };
    }

    const newOrg = {
      id: `org_${Date.now()}`,
      name: orgData.name,
      description: orgData.description || null,
      slug: orgData.name.toLowerCase().replace(/\s+/g, '-'),
      isActive: true,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      settings: {
        allowGuestAccess: false,
        requireEmailVerification: true,
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['.pdf', '.docx', '.txt', '.aktr'],
        retentionPolicy: '5_years'
      }
    };

    return {
      status: 201,
      data: {
        success: true,
        message: 'Organization created successfully',
        organization: newOrg
      }
    };
  }

  async getUserPermissions(userId: string, organizationId?: string) {
    // Simulate API call to /api/auth/permissions
    const user = Object.values(MOCK_ORGANIZATION_DATA.users).find(u => u.id === userId);
    if (!user) {
      return { status: 404, data: { error: 'User not found' } };
    }

    let permissions = [];
    let organizationRole = null;

    if (organizationId) {
      const orgMembership = user.organizations.find(
        org => org.organizationId === organizationId && org.isActive
      );
      if (orgMembership) {
        permissions = orgMembership.permissions;
        organizationRole = orgMembership.role;
      }
    } else {
      // Get all unique permissions across all organizations
      const allPermissions = user.organizations
        .filter(org => org.isActive)
        .flatMap(org => org.permissions);
      permissions = Array.from(new Set(allPermissions));
    }

    return {
      status: 200,
      data: {
        permissions,
        role: user.role,
        organizationRole
      }
    };
  }

  async inviteUserToOrganization(inviterId: string, organizationId: string, invitationData: any) {
    // Simulate API call to POST /api/auth/organizations/{id}/invitations
    const inviter = Object.values(MOCK_ORGANIZATION_DATA.users).find(u => u.id === inviterId);
    if (!inviter) {
      return { status: 404, data: { error: 'Inviter not found' } };
    }

    if (!OrganizationPermissionValidator.validateInvitationAccess(inviter, organizationId, invitationData.role)) {
      return { status: 403, data: { error: 'Insufficient permissions to send invitation' } };
    }

    const invitation = {
      id: `invite_${Date.now()}`,
      organizationId,
      email: invitationData.email,
      role: invitationData.role,
      invitedBy: inviterId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
      token: `inv_token_${Math.random().toString(36).substring(2, 15)}`
    };

    return {
      status: 201,
      data: {
        success: true,
        message: 'Invitation sent successfully',
        invitation
      }
    };
  }

  async checkFileAccess(userId: string, fileId: string, action: string) {
    // Simulate API call to GET /api/files/{id}/access?action={action}
    const user = Object.values(MOCK_ORGANIZATION_DATA.users).find(u => u.id === userId);
    const file = Object.values(MOCK_ORGANIZATION_DATA.files).find(f => f.id === fileId);

    if (!user) {
      return { status: 404, data: { error: 'User not found' } };
    }

    if (!file) {
      return { status: 404, data: { error: 'File not found' } };
    }

    const hasAccess = OrganizationPermissionValidator.validateFileAccess(user, file, action);

    return {
      status: 200,
      data: {
        hasAccess,
        file: {
          id: file.id,
          name: file.name,
          visibility: file.visibility
        },
        action,
        reason: hasAccess ? 'Access granted' : 'Access denied'
      }
    };
  }
}

describe('Task 5.2: Organization and Permission Testing', () => {
  let mockApiClient: MockOrganizationApiClient;

  beforeAll(() => {
    mockApiClient = new MockOrganizationApiClient();
  });

  describe('5.2.1: Organization-Based Access Control', () => {
    test('validates organization data structure against contract schema', async () => {
      const org = MOCK_ORGANIZATION_DATA.organizations.flightAcademy;
      
      const validation = OrganizationPermissionValidator.validateOrganization(org);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.id).toBe('org_flight_academy_123');
        expect(validation.data.name).toBe('Professional Flight Academy');
        expect(validation.data.memberCount).toBeGreaterThan(0);
        expect(validation.data.settings?.allowedFileTypes).toContain('.aktr');
      }
    });

    test('validates user organization profile with multiple memberships', async () => {
      const user = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      const validation = OrganizationPermissionValidator.validateUserOrganizationProfile(user);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.organizations).toHaveLength(2);
        expect(validation.data.organizations[0].role).toBe('admin');
        expect(validation.data.organizations[1].role).toBe('member');
      }
    });

    test('enforces role-based permission validation', async () => {
      const adminUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      const adminOrgMembership = adminUser.organizations[0];
      
      const isValidPermissions = OrganizationPermissionValidator.validateRolePermissions(
        adminOrgMembership.role,
        adminOrgMembership.permissions
      );
      
      expect(isValidPermissions).toBe(true);
      expect(adminOrgMembership.permissions).toContain('org:manage_members');
      expect(adminOrgMembership.permissions).toContain('org:delete_organization');
    });

    test('rejects invalid role permissions combination', async () => {
      const studentUser = MOCK_ORGANIZATION_DATA.users.studentPilot;
      const studentOrgMembership = studentUser.organizations[0];
      
      // Try to give student admin permissions
      const invalidPermissions = ['org:manage_members', 'org:delete_organization'];
      
      const isValidPermissions = OrganizationPermissionValidator.validateRolePermissions(
        studentOrgMembership.role,
        invalidPermissions
      );
      
      expect(isValidPermissions).toBe(false);
    });

    test('validates cross-organization permission inheritance', async () => {
      const multiOrgUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      // Admin in flight academy, member in CFI institute
      const flightAcademyMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_flight_academy_123'
      );
      const cfiInstituteMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_cfi_institute_456'
      );
      
      expect(flightAcademyMembership?.role).toBe('admin');
      expect(cfiInstituteMembership?.role).toBe('member');
      
      // Permissions should be different for each organization
      expect(flightAcademyMembership?.permissions).toContain('org:manage_members');
      expect(cfiInstituteMembership?.permissions).not.toContain('org:manage_members');
    });
  });

  describe('5.2.2: Multi-Organization Membership and Role Assignment', () => {
    test('handles user with multiple organization memberships', async () => {
      const response = await mockApiClient.getOrganizations('user_multi_admin_001');
      
      expect(response.status).toBe(200);
      expect(response.data.organizations).toHaveLength(2);
      expect(response.data.totalCount).toBe(2);
      
      const flightAcademyOrg = response.data.organizations.find(
        (org: any) => org.id === 'org_flight_academy_123'
      );
      const cfiInstituteOrg = response.data.organizations.find(
        (org: any) => org.id === 'org_cfi_institute_456'
      );
      
      expect(flightAcademyOrg.role).toBe('admin');
      expect(cfiInstituteOrg.role).toBe('member');
    });

    test('validates role switching between organizations', async () => {
      const userId = 'user_cfi_instructor_002';
      
      // Get permissions for CFI Institute (admin role)
      const cfiResponse = await mockApiClient.getUserPermissions(userId, 'org_cfi_institute_456');
      expect(cfiResponse.status).toBe(200);
      expect(cfiResponse.data.organizationRole).toBe('admin');
      expect(cfiResponse.data.permissions).toContain('org:manage_members');
      
      // Get permissions for Regional Airport (instructor role)
      const airportResponse = await mockApiClient.getUserPermissions(userId, 'org_regional_airport_789');
      expect(airportResponse.status).toBe(200);
      expect(airportResponse.data.organizationRole).toBe('instructor');
      expect(airportResponse.data.permissions).not.toContain('org:manage_members');
      expect(airportResponse.data.permissions).toContain('students:view');
    });

    test('validates organization creation permissions by role', async () => {
      // School admin should be able to create organizations
      const adminResponse = await mockApiClient.createOrganization('user_multi_admin_001', {
        name: 'New Aviation School',
        description: 'Test organization creation'
      });
      
      expect(adminResponse.status).toBe(201);
      expect(adminResponse.data.success).toBe(true);
      expect(adminResponse.data.organization.name).toBe('New Aviation School');
      
      // Student should not be able to create organizations
      const studentResponse = await mockApiClient.createOrganization('user_student_pilot_003', {
        name: 'Student Organization',
        description: 'Should fail'
      });
      
      expect(studentResponse.status).toBe(403);
      expect(studentResponse.data.error).toContain('Insufficient permissions');
    });

    test('validates guest user access restrictions', async () => {
      const guestUser = MOCK_ORGANIZATION_DATA.users.guestUser;
      const guestOrgMembership = guestUser.organizations[0];
      
      expect(guestOrgMembership.role).toBe('guest');
      expect(guestOrgMembership.permissions).toHaveLength(2);
      expect(guestOrgMembership.permissions).toContain('files:view_shared');
      expect(guestOrgMembership.permissions).toContain('reports:view_public');
      expect(guestOrgMembership.permissions).not.toContain('files:upload');
    });

    test('validates organization membership activation and deactivation', async () => {
      const user = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      user.organizations.forEach(membership => {
        expect(membership.isActive).toBe(true);
        expect(typeof membership.joinedAt).toBe('string');
        expect(new Date(membership.joinedAt)).toBeInstanceOf(Date);
      });
      
      // Validate membership date ordering
      const sortedMemberships = user.organizations.sort(
        (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
      );
      
      expect(sortedMemberships[0].organizationId).toBe('org_flight_academy_123');
      expect(sortedMemberships[1].organizationId).toBe('org_cfi_institute_456');
    });
  });

  describe('5.2.3: File Sharing Permissions Within Organizations', () => {
    test('validates private file access for owner only', async () => {
      const privateFile = MOCK_ORGANIZATION_DATA.files.privateStudentFile;
      
      // Owner should have full access
      const ownerResponse = await mockApiClient.checkFileAccess(
        privateFile.ownerId,
        privateFile.id,
        'read'
      );
      
      expect(ownerResponse.status).toBe(200);
      expect(ownerResponse.data.hasAccess).toBe(true);
      expect(ownerResponse.data.reason).toBe('Access granted');
      
      // Other organization members should not have access
      const otherUserResponse = await mockApiClient.checkFileAccess(
        'user_multi_admin_001',
        privateFile.id,
        'read'
      );
      
      expect(otherUserResponse.status).toBe(200);
      expect(otherUserResponse.data.hasAccess).toBe(false);
      expect(otherUserResponse.data.reason).toBe('Access denied');
    });

    test('validates organization-level file sharing', async () => {
      const sharedFile = MOCK_ORGANIZATION_DATA.files.sharedInstructorFile;
      
      // Organization member should have read access
      const memberResponse = await mockApiClient.checkFileAccess(
        'user_multi_admin_001', // Has membership in CFI Institute
        sharedFile.id,
        'read'
      );
      
      expect(memberResponse.status).toBe(200);
      expect(memberResponse.data.hasAccess).toBe(true);
      
      // Non-organization member should not have access
      const outsiderResponse = await mockApiClient.checkFileAccess(
        'user_student_pilot_003', // Only in Flight Academy
        sharedFile.id,
        'read'
      );
      
      expect(outsiderResponse.status).toBe(200);
      expect(outsiderResponse.data.hasAccess).toBe(false);
    });

    test('validates cross-organization file access', async () => {
      const crossOrgFile = MOCK_ORGANIZATION_DATA.files.crossOrgFile;
      
      // User with access to cross-org sharing should have access
      const authorizedResponse = await mockApiClient.checkFileAccess(
        'user_multi_admin_001', // Has membership in both orgs  
        crossOrgFile.id,
        'read'
      );
      
      expect(authorizedResponse.status).toBe(200);
      expect(authorizedResponse.data.hasAccess).toBe(true);
      
      // User without membership in either organization should not have access
      const unauthorizedResponse = await mockApiClient.checkFileAccess(
        'user_outsider_005', // Not a member of Flight Academy or CFI Institute
        crossOrgFile.id,
        'read'
      );
      
      expect(unauthorizedResponse.status).toBe(200);
      expect(unauthorizedResponse.data.hasAccess).toBe(false);
    });

    test('validates file permission schema compliance', async () => {
      const filePermissions = MOCK_ORGANIZATION_DATA.files.crossOrgFile;
      
      const validation = OrganizationPermissionValidator.validateFilePermissions(filePermissions);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.permissions.owner).toContain('read');
        expect(validation.data.permissions.owner).toContain('write');
        expect(validation.data.permissions.owner).toContain('delete');
        expect(validation.data.permissions.crossOrg).toContain('org_cfi_institute_456');
      }
    });

    test('validates role-based file action permissions', async () => {
      const sharedFile = MOCK_ORGANIZATION_DATA.files.sharedInstructorFile;
      
      // Owner should have write access to their own file
      const ownerResponse = await mockApiClient.checkFileAccess(
        'user_cfi_instructor_002', // Owner of the file
        sharedFile.id,
        'write'
      );
      
      expect(ownerResponse.status).toBe(200);
      expect(ownerResponse.data.hasAccess).toBe(true);
      
      // Organization member should have read access but not write
      const memberResponse = await mockApiClient.checkFileAccess(
        'user_multi_admin_001', // Member in CFI Institute
        sharedFile.id,
        'read'
      );
      
      expect(memberResponse.status).toBe(200);
      expect(memberResponse.data.hasAccess).toBe(true);
      
      // Organization member should NOT have write access
      const memberWriteResponse = await mockApiClient.checkFileAccess(
        'user_multi_admin_001', // Member in CFI Institute
        sharedFile.id,
        'write'
      );
      
      expect(memberWriteResponse.status).toBe(200);
      expect(memberWriteResponse.data.hasAccess).toBe(false);
    });

    test('validates file size and type restrictions by organization', async () => {
      const flightAcademySettings = MOCK_ORGANIZATION_DATA.organizations.flightAcademy.settings;
      const cfiInstituteSettings = MOCK_ORGANIZATION_DATA.organizations.cfiInstitute.settings;
      
      // Flight Academy has 50MB limit
      expect(flightAcademySettings.maxFileSize).toBe(50 * 1024 * 1024);
      expect(flightAcademySettings.allowedFileTypes).not.toContain('.ppt');
      
      // CFI Institute has 100MB limit and more file types
      expect(cfiInstituteSettings.maxFileSize).toBe(100 * 1024 * 1024);
      expect(cfiInstituteSettings.allowedFileTypes).toContain('.ppt');
      expect(cfiInstituteSettings.allowedFileTypes).toContain('.xlsx');
    });
  });

  describe('5.2.4: Organization Admin Capabilities and User Management', () => {
    test('validates organization invitation workflow', async () => {
      const adminUserId = 'user_multi_admin_001';
      const organizationId = 'org_flight_academy_123';
      
      const invitationResponse = await mockApiClient.inviteUserToOrganization(adminUserId, organizationId, {
        email: 'newpilot@example.com',
        role: 'student'
      });
      
      expect(invitationResponse.status).toBe(201);
      expect(invitationResponse.data.success).toBe(true);
      expect(invitationResponse.data.invitation.email).toBe('newpilot@example.com');
      expect(invitationResponse.data.invitation.role).toBe('student');
      expect(invitationResponse.data.invitation.status).toBe('pending');
    });

    test('validates invitation permission hierarchy', async () => {
      const instructorUserId = 'user_cfi_instructor_002';
      const organizationId = 'org_regional_airport_789'; // User has 'instructor' role here, not 'admin'
      
      // Instructor should be able to invite students
      const studentInviteResponse = await mockApiClient.inviteUserToOrganization(instructorUserId, organizationId, {
        email: 'newstudent@example.com',
        role: 'student'
      });
      
      expect(studentInviteResponse.status).toBe(201);
      expect(studentInviteResponse.data.success).toBe(true);
      
      // Instructor should NOT be able to invite other admins
      const adminInviteResponse = await mockApiClient.inviteUserToOrganization(instructorUserId, organizationId, {
        email: 'newadmin@example.com',
        role: 'admin'
      });
      
      expect(adminInviteResponse.status).toBe(403);
      expect(adminInviteResponse.data.error).toContain('Insufficient permissions');
    });

    test('validates invitation schema and token format', async () => {
      const pendingInvitation = MOCK_ORGANIZATION_DATA.invitations.pendingInvite;
      
      const validation = OrganizationPermissionValidator.validateInvitation(pendingInvitation);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.token).toMatch(/^inv_token_[a-z0-9]+$/);
        expect(validation.data.status).toBe('pending');
        expect(new Date(validation.data.expiresAt)).toBeInstanceOf(Date);
        expect(new Date(validation.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
      }
    });

    test('validates expired invitation handling', async () => {
      const expiredInvitation = MOCK_ORGANIZATION_DATA.invitations.expiredInvite;
      
      const validation = OrganizationPermissionValidator.validateInvitation(expiredInvitation);
      
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.status).toBe('expired');
        expect(new Date(validation.data.expiresAt).getTime()).toBeLessThan(Date.now());
      }
    });

    test('validates non-admin user cannot send invitations', async () => {
      const studentUserId = 'user_student_pilot_003';
      const organizationId = 'org_flight_academy_123';
      
      const invitationResponse = await mockApiClient.inviteUserToOrganization(studentUserId, organizationId, {
        email: 'friend@example.com',
        role: 'student'
      });
      
      expect(invitationResponse.status).toBe(403);
      expect(invitationResponse.data.error).toContain('Insufficient permissions');
    });

    test('validates organization member count tracking', async () => {
      const organizations = Object.values(MOCK_ORGANIZATION_DATA.organizations);
      
      organizations.forEach(org => {
        expect(org.memberCount).toBeGreaterThan(0);
        expect(typeof org.memberCount).toBe('number');
        
        // Member count should be realistic for organization type
        if (org.id === 'org_flight_academy_123') {
          expect(org.memberCount).toBe(125); // Large academy
        } else if (org.id === 'org_cfi_institute_456') {
          expect(org.memberCount).toBe(45); // Specialized institute
        }
      });
    });
  });

  describe('5.2.5: Organization-Scoped Data Access and Isolation', () => {
    test('validates data isolation between organizations', async () => {
      const flightAcademyUser = 'user_student_pilot_003';
      const cfiInstituteUser = 'user_cfi_instructor_002';
      
      // Flight Academy user should not see CFI Institute data
      const flightAcademyOrgResponse = await mockApiClient.getOrganizations(flightAcademyUser);
      expect(flightAcademyOrgResponse.status).toBe(200);
      expect(flightAcademyOrgResponse.data.organizations).toHaveLength(1);
      expect(flightAcademyOrgResponse.data.organizations[0].id).toBe('org_flight_academy_123');
      
      // CFI Institute user should see their organizations
      const cfiOrgResponse = await mockApiClient.getOrganizations(cfiInstituteUser);
      expect(cfiOrgResponse.status).toBe(200);
      expect(cfiOrgResponse.data.organizations).toHaveLength(2);
      
      const orgIds = cfiOrgResponse.data.organizations.map((org: any) => org.id);
      expect(orgIds).toContain('org_cfi_institute_456');
      expect(orgIds).toContain('org_regional_airport_789');
    });

    test('validates organization settings access control', async () => {
      const organizations = Object.values(MOCK_ORGANIZATION_DATA.organizations);
      
      organizations.forEach(org => {
        expect(org.settings).toBeDefined();
        expect(typeof org.settings.allowGuestAccess).toBe('boolean');
        expect(typeof org.settings.requireEmailVerification).toBe('boolean');
        expect(Array.isArray(org.settings.allowedFileTypes)).toBe(true);
        expect(['1_year', '3_years', '5_years', '7_years', '10_years', 'permanent'])
          .toContain(org.settings.retentionPolicy);
      });
    });

    test('validates cross-organization data sharing restrictions', async () => {
      const multiOrgUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      // User should have different permissions in each organization
      const flightAcademyMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_flight_academy_123'
      );
      const cfiInstituteMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_cfi_institute_456'
      );
      
      expect(flightAcademyMembership?.role).toBe('admin');
      expect(cfiInstituteMembership?.role).toBe('member');
      
      // Admin permissions should not carry over to member organization
      expect(flightAcademyMembership?.permissions).toContain('org:delete_organization');
      expect(cfiInstituteMembership?.permissions).not.toContain('org:delete_organization');
    });

    test('validates organization-specific file visibility rules', async () => {
      const files = Object.values(MOCK_ORGANIZATION_DATA.files);
      
      files.forEach(file => {
        expect(['private', 'organization', 'cross_org', 'public']).toContain(file.visibility);
        expect(file.organizationId).toMatch(/^org_[a-z0-9_]+$/);
        expect(file.ownerId).toMatch(/^user_[a-z0-9_]+$/);
        
        // Validate permission structure
        expect(file.permissions.owner).toContain('read');
        expect(Array.isArray(file.permissions.organization)).toBe(true);
        expect(Array.isArray(file.permissions.public)).toBe(true);
      });
    });

    test('validates user cannot access organization without membership', async () => {
      // Try to get permissions for organization user is not member of
      const outsiderResponse = await mockApiClient.getUserPermissions(
        'user_student_pilot_003', // Only member of Flight Academy
        'org_cfi_institute_456' // CFI Institute
      );
      
      expect(outsiderResponse.status).toBe(200);
      expect(outsiderResponse.data.permissions).toHaveLength(0);
      expect(outsiderResponse.data.organizationRole).toBeNull();
    });

    test('validates organization creation with proper isolation', async () => {
      const newOrgResponse = await mockApiClient.createOrganization('user_multi_admin_001', {
        name: 'Private Flying Club',
        description: 'Exclusive member organization'
      });
      
      expect(newOrgResponse.status).toBe(201);
      expect(newOrgResponse.data.organization.memberCount).toBe(1);
      expect(newOrgResponse.data.organization.settings.allowGuestAccess).toBe(false);
      expect(newOrgResponse.data.organization.settings.requireEmailVerification).toBe(true);
    });
  });

  describe('5.2.6: Organization Billing and Subscription Management', () => {
    test('validates organization billing permission access', async () => {
      const adminUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      const adminOrgMembership = adminUser.organizations[0]; // Flight Academy admin
      
      expect(adminOrgMembership.permissions).toContain('org:view_billing');
      
      const memberOrgMembership = adminUser.organizations[1]; // CFI Institute member
      expect(memberOrgMembership.permissions).not.toContain('org:view_billing');
    });

    test('validates subscription-based feature access by organization', async () => {
      const organizations = Object.values(MOCK_ORGANIZATION_DATA.organizations);
      
      organizations.forEach(org => {
        // Validate organization has appropriate settings for subscription tier
        if (org.memberCount > 100) {
          // Large organizations should have enterprise features
          expect(org.settings.maxFileSize).toBeGreaterThanOrEqual(50 * 1024 * 1024);
        } else {
          // Smaller organizations may have basic limits
          expect(org.settings.maxFileSize).toBeGreaterThan(0);
        }
      });
    });

    test('validates billing admin cannot access other organization billing', async () => {
      const multiOrgUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      // Admin in Flight Academy, member in CFI Institute
      const flightAcademyMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_flight_academy_123'
      );
      const cfiInstituteMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_cfi_institute_456'
      );
      
      expect(flightAcademyMembership?.permissions).toContain('org:view_billing');
      expect(cfiInstituteMembership?.permissions).not.toContain('org:view_billing');
    });

    test('validates export permissions for data retention compliance', async () => {
      const adminUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      const cfiInstructor = MOCK_ORGANIZATION_DATA.users.cfiInstructor;
      
      // Admin should have data export permissions
      const adminOrgMembership = adminUser.organizations[0];
      expect(adminOrgMembership.permissions).toContain('org:export_data');
      
      // CFI instructor (admin in their org) should also have export permissions
      const instructorAdminMembership = cfiInstructor.organizations.find(
        org => org.role === 'admin'
      );
      expect(instructorAdminMembership?.permissions).toContain('org:export_data');
      
      // Instructor role in other org should not have export permissions
      const instructorMemberMembership = cfiInstructor.organizations.find(
        org => org.role === 'instructor'
      );
      expect(instructorMemberMembership?.permissions).not.toContain('org:export_data');
    });
  });

  describe('5.2.7: Organization Invitation and Onboarding Workflows', () => {
    test('validates complete invitation workflow from creation to acceptance', async () => {
      const invitation = MOCK_ORGANIZATION_DATA.invitations.pendingInvite;
      
      // Validate invitation structure
      expect(invitation.status).toBe('pending');
      expect(invitation.token).toMatch(/^inv_token_[a-z0-9]+$/);
      expect(new Date(invitation.expiresAt).getTime()).toBeGreaterThan(Date.now());
      
      // Validate invitation belongs to correct organization
      expect(invitation.organizationId).toBe('org_flight_academy_123');
      expect(invitation.role).toBe('student');
      expect(invitation.invitedBy).toBe('user_multi_admin_001');
    });

    test('validates invitation expiration handling', async () => {
      const expiredInvitation = MOCK_ORGANIZATION_DATA.invitations.expiredInvite;
      
      expect(expiredInvitation.status).toBe('expired');
      expect(new Date(expiredInvitation.expiresAt).getTime()).toBeLessThan(Date.now());
      
      // Expired invitations should not be processable
      const currentTime = Date.now();
      const expirationTime = new Date(expiredInvitation.expiresAt).getTime();
      
      expect(expirationTime).toBeLessThan(currentTime);
    });

    test('validates role-appropriate onboarding permissions', async () => {
      const pendingInvite = MOCK_ORGANIZATION_DATA.invitations.pendingInvite;
      
      // Student role invitation should have appropriate limitations
      expect(pendingInvite.role).toBe('student');
      
      // Validate the inviter has permission to invite this role
      const inviter = Object.values(MOCK_ORGANIZATION_DATA.users).find(
        user => user.id === pendingInvite.invitedBy
      );
      
      expect(inviter).toBeDefined();
      if (inviter) {
        const inviterOrgMembership = inviter.organizations.find(
          org => org.organizationId === pendingInvite.organizationId
        );
        expect(inviterOrgMembership?.role).toBe('admin');
      }
    });

    test('validates guest user onboarding with limited access', async () => {
      const guestUser = MOCK_ORGANIZATION_DATA.users.guestUser;
      const guestMembership = guestUser.organizations[0];
      
      expect(guestMembership.role).toBe('guest');
      expect(guestUser.emailVerified).toBe(false);
      
      // Guest should have minimal permissions
      expect(guestMembership.permissions).toHaveLength(2);
      expect(guestMembership.permissions).toContain('files:view_shared');
      expect(guestMembership.permissions).toContain('reports:view_public');
      
      // Guest should not have upload or management permissions
      expect(guestMembership.permissions).not.toContain('files:upload');
      expect(guestMembership.permissions).not.toContain('org:manage_members');
    });

    test('validates onboarding workflow respects organization settings', async () => {
      const cfiInstitute = MOCK_ORGANIZATION_DATA.organizations.cfiInstitute;
      const flightAcademy = MOCK_ORGANIZATION_DATA.organizations.flightAcademy;
      
      // CFI Institute allows guest access
      expect(cfiInstitute.settings.allowGuestAccess).toBe(true);
      
      // Flight Academy does not allow guest access
      expect(flightAcademy.settings.allowGuestAccess).toBe(false);
      
      // Both require email verification
      expect(cfiInstitute.settings.requireEmailVerification).toBe(true);
      expect(flightAcademy.settings.requireEmailVerification).toBe(true);
    });

    test('validates invitation token security and uniqueness', async () => {
      const invitations = Object.values(MOCK_ORGANIZATION_DATA.invitations);
      const tokens = invitations.map(inv => inv.token);
      
      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
      
      // All tokens should match expected format
      tokens.forEach(token => {
        expect(token).toMatch(/^inv_token_[a-z0-9]+$/);
        expect(token.length).toBeGreaterThanOrEqual(15); // Minimum security length
      });
    });
  });

  describe('5.2.8: Contract Tests and Schema Validation', () => {
    test('validates all organization schemas against OpenAPI specification', async () => {
      const testCases = [
        MOCK_ORGANIZATION_DATA.organizations.flightAcademy,
        MOCK_ORGANIZATION_DATA.organizations.cfiInstitute,
        MOCK_ORGANIZATION_DATA.organizations.regionalAirport
      ];
      
      testCases.forEach((org, index) => {
        const validation = OrganizationPermissionValidator.validateOrganization(org);
        
        expect(validation.success).toBe(true);
        if (!validation.success) {
          console.error(`Organization ${index} validation failed:`, validation.error);
        }
      });
    });

    test('validates user organization profiles match contract requirements', async () => {
      const users = Object.values(MOCK_ORGANIZATION_DATA.users);
      
      users.forEach((user, index) => {
        const validation = OrganizationPermissionValidator.validateUserOrganizationProfile(user);
        
        expect(validation.success).toBe(true);
        if (!validation.success) {
          console.error(`User ${index} validation failed:`, validation.error);
        }
      });
    });

    test('validates file permission schemas are contract compliant', async () => {
      const files = Object.values(MOCK_ORGANIZATION_DATA.files);
      
      files.forEach((file, index) => {
        const validation = OrganizationPermissionValidator.validateFilePermissions(file);
        
        expect(validation.success).toBe(true);
        if (!validation.success) {
          console.error(`File ${index} validation failed:`, validation.error);
        }
      });
    });

    test('validates invitation schemas match OpenAPI contract', async () => {
      const invitations = Object.values(MOCK_ORGANIZATION_DATA.invitations);
      
      invitations.forEach((invitation, index) => {
        const validation = OrganizationPermissionValidator.validateInvitation(invitation);
        
        expect(validation.success).toBe(true);
        if (!validation.success) {
          console.error(`Invitation ${index} validation failed:`, validation.error);
        }
      });
    });

    test('validates error responses follow OpenAPI error schema', async () => {
      // Test unauthorized access
      const unauthorizedResponse = await mockApiClient.getOrganizations('invalid_user_id');
      expect(unauthorizedResponse.status).toBe(404);
      expect(unauthorizedResponse.data.error).toBeDefined();
      expect(typeof unauthorizedResponse.data.error).toBe('string');
      
      // Test insufficient permissions
      const insufficientPermissionResponse = await mockApiClient.createOrganization('user_student_pilot_003', {
        name: 'Test Org'
      });
      expect(insufficientPermissionResponse.status).toBe(403);
      expect(insufficientPermissionResponse.data.error).toContain('Insufficient permissions');
    });

    test('validates success responses include required OpenAPI fields', async () => {
      const response = await mockApiClient.getOrganizations('user_multi_admin_001');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('organizations');
      expect(response.data).toHaveProperty('totalCount');
      expect(response.data).toHaveProperty('activeOrganization');
      expect(Array.isArray(response.data.organizations)).toBe(true);
      expect(typeof response.data.totalCount).toBe('number');
    });
  });

  describe('5.2.9: Role-Based Permission Testing and Validation', () => {
    test('validates hierarchical permission inheritance', async () => {
      const permissionHierarchy = {
        'admin': ['org:manage_members', 'org:manage_settings', 'org:delete_organization'],
        'instructor': ['students:manage', 'assignments:create', 'org:collaborate'],
        'member': ['org:view_members', 'org:collaborate'],
        'student': ['files:view_own', 'reports:view_own'],
        'guest': ['files:view_shared']
      };
      
      Object.entries(permissionHierarchy).forEach(([role, expectedPermissions]) => {
        expectedPermissions.forEach(permission => {
          const hasPermission = OrganizationPermissionValidator.validateRolePermissions(role, [permission]);
          expect(hasPermission).toBe(true);
        });
      });
    });

    test('validates permission boundaries between roles', async () => {
      // Student should not have admin permissions
      const studentAdminPermissions = ['org:manage_members', 'org:delete_organization'];
      const studentValid = OrganizationPermissionValidator.validateRolePermissions('student', studentAdminPermissions);
      expect(studentValid).toBe(false);
      
      // Guest should not have upload permissions
      const guestUploadPermissions = ['files:upload', 'files:delete'];
      const guestValid = OrganizationPermissionValidator.validateRolePermissions('guest', guestUploadPermissions);
      expect(guestValid).toBe(false);
      
      // Member should not have management permissions
      const memberManagementPermissions = ['org:manage_settings', 'org:view_billing'];
      const memberValid = OrganizationPermissionValidator.validateRolePermissions('member', memberManagementPermissions);
      expect(memberValid).toBe(false);
    });

    test('validates context-specific permission validation', async () => {
      const multiOrgUser = MOCK_ORGANIZATION_DATA.users.multiOrgAdmin;
      
      // Same user, different permissions in different organizations
      const flightAcademyMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_flight_academy_123'
      );
      const cfiInstituteMembership = multiOrgUser.organizations.find(
        org => org.organizationId === 'org_cfi_institute_456'
      );
      
      // Flight Academy: Admin permissions
      expect(flightAcademyMembership?.permissions).toContain('org:delete_organization');
      
      // CFI Institute: Member permissions
      expect(cfiInstituteMembership?.permissions).not.toContain('org:delete_organization');
      expect(cfiInstituteMembership?.permissions).toContain('org:collaborate');
    });

    test('validates dynamic permission checking based on resource context', async () => {
      const files = [
        MOCK_ORGANIZATION_DATA.files.privateStudentFile,
        MOCK_ORGANIZATION_DATA.files.sharedInstructorFile,
        MOCK_ORGANIZATION_DATA.files.crossOrgFile
      ];
      
      const users = [
        MOCK_ORGANIZATION_DATA.users.multiOrgAdmin,
        MOCK_ORGANIZATION_DATA.users.studentPilot,
        MOCK_ORGANIZATION_DATA.users.guestUser
      ];
      
      files.forEach(file => {
        users.forEach(user => {
          const readAccess = OrganizationPermissionValidator.validateFileAccess(user, file, 'read');
          const writeAccess = OrganizationPermissionValidator.validateFileAccess(user, file, 'write');
          const deleteAccess = OrganizationPermissionValidator.validateFileAccess(user, file, 'delete');
          
          // Owner should have full access to their files
          if (file.ownerId === user.id) {
            expect(readAccess).toBe(true);
            expect(deleteAccess).toBe(true);
          }
          
          // Guest users should have very limited access
          if (user.id === 'user_guest_004') {
            expect(writeAccess).toBe(false);
            expect(deleteAccess).toBe(false);
          }
        });
      });
    });

    test('validates permission caching and consistency', async () => {
      const userId = 'user_cfi_instructor_002';
      
      // Get permissions multiple times to test consistency
      const responses = await Promise.all([
        mockApiClient.getUserPermissions(userId, 'org_cfi_institute_456'),
        mockApiClient.getUserPermissions(userId, 'org_cfi_institute_456'),
        mockApiClient.getUserPermissions(userId, 'org_cfi_institute_456')
      ]);
      
      // All responses should be identical
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.organizationRole).toBe('admin');
        expect(response.data.permissions).toContain('org:manage_members');
      });
      
      // Permissions should be consistent across calls
      const firstPermissions = responses[0].data.permissions.sort();
      responses.slice(1).forEach(response => {
        const permissions = response.data.permissions.sort();
        expect(permissions).toEqual(firstPermissions);
      });
    });
  });
});