import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { logError, logInfo, logWarn } from '@/lib/utils/logger';

interface UserMetadata {
  role?: string;
  [key: string]: unknown;
}

// Define the webhook event types we care about
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string; verification?: { status: string } }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    private_metadata?: UserMetadata;
    organization_memberships?: Array<{
      organization: {
        id: string;
        name: string;
        slug?: string;
      };
      role: string;
    }>;
    created_at?: number;
    updated_at?: number;
  };
};

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body
  let payload: string;
  try {
    payload = await req.text();
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    );
  }

  // Create a new Svix instance with your webhook secret
  const webhookSecret = process.env['CLERK_WEBHOOK_SECRET'];
  if (!webhookSecret) {
    // Log error for monitoring (in production, use proper logging service)
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const wh = new Webhook(webhookSecret);

  let evt: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    logError('Webhook signature validation failed:', err);
    
    // Check if this is a signature verification error vs server error
    if (err instanceof Error && err.message.includes('Invalid signature')) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }
    
    // For other errors (network, parsing, etc.), return 500
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  // Handle the webhook event
  try {
    const processed = await handleWebhookEvent(evt);
    return NextResponse.json({
      success: true,
      message: processed ? 'Webhook processed successfully' : 'Webhook received but not processed',
      eventType: evt.type,
      processed
    });
  } catch (error) {
    logError('Webhook processing failed:', error);
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(evt: ClerkWebhookEvent): Promise<boolean> {
  const { type, data } = evt;

  logInfo('Processing webhook event:', { type, userId: data.id });

  switch (type) {
    case 'user.created':
      await handleUserCreated(data);
      return true;
    
    case 'user.updated':
      await handleUserUpdated(data);
      return true;
    
    case 'user.deleted':
      await handleUserDeleted(data);
      return true;
    
    case 'organization.created':
      await handleOrganizationCreated(data);
      return true;
    
    case 'organization.updated':
      await handleOrganizationUpdated(data);
      return true;
    
    case 'organization.deleted':
      await handleOrganizationDeleted(data);
      return true;
    
    case 'organizationMembership.created':
      await handleMembershipCreated(data);
      return true;
    
    case 'organizationMembership.updated':
      await handleMembershipUpdated(data);
      return true;
    
    case 'organizationMembership.deleted':
      await handleMembershipDeleted(data);
      return true;
    
    default:
      logWarn('Unhandled webhook event type:', type);
      return false; // Event not processed
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  logInfo('User created:', { userId: data.id });
  
  // Backend persistence will be implemented when database layer is ready
  // Example data that will be sent:
  // {
  //   clerkUserId: data.id,
  //   email: data.email_addresses?.[0]?.email_address,
  //   firstName: data.first_name,
  //   lastName: data.last_name,
  //   imageUrl: data.image_url,
  //   role: data.private_metadata?.role || 'student',
  //   emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
  //   createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  // }
  // await apiFetch('/users', { method: 'POST', body: userData });
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  logInfo('User updated:', { userId: data.id });
  
  // Backend persistence will be implemented when database layer is ready
  // Example data that will be sent:
  // {
  //   clerkUserId: data.id,
  //   email: data.email_addresses?.[0]?.email_address,
  //   firstName: data.first_name,
  //   lastName: data.last_name,
  //   imageUrl: data.image_url,
  //   role: data.private_metadata?.role || 'student',
  //   emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
  //   updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
  // }
  // await apiFetch(`/users/${data.id}`, { method: 'PUT', body: userData });
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  logInfo('User deleted:', { userId: data.id });
  
  // Backend API call will be implemented when database persistence layer is ready
  // await apiFetch(`/users/${data.id}`, { method: 'DELETE' });
}

async function handleOrganizationCreated(data: ClerkWebhookEvent['data']) {
  logInfo('Organization created:', { organizationId: data.id });
  // Note: Organization handling will be implemented when backend database is available
}

async function handleOrganizationUpdated(data: ClerkWebhookEvent['data']) {
  logInfo('Organization updated:', { organizationId: data.id });
  // Note: Organization handling will be implemented when backend database is available
}

async function handleOrganizationDeleted(data: ClerkWebhookEvent['data']) {
  logInfo('Organization deleted:', { organizationId: data.id });
  // Note: Organization handling will be implemented when backend database is available
}

async function handleMembershipCreated(data: ClerkWebhookEvent['data']) {
  logInfo('Membership created:', { userId: data.id });
  // Note: Membership handling will be implemented when backend database is available
}

async function handleMembershipUpdated(data: ClerkWebhookEvent['data']) {
  logInfo('Membership updated:', { userId: data.id });
  // Note: Membership handling will be implemented when backend database is available
}

async function handleMembershipDeleted(data: ClerkWebhookEvent['data']) {
  logInfo('Membership deleted:', { userId: data.id });
  // Note: Membership handling will be implemented when backend database is available
}