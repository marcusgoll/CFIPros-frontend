import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

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
    // TODO: Replace with proper logging service in production
    // logger.error('Webhook signature validation failed', { error: err.message });
    
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
    // TODO: Replace with proper logging service in production
    // logger.error('Webhook processing failed', { error: error.message });
    
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(evt: ClerkWebhookEvent): Promise<boolean> {
  const { type, data } = evt;

  // TODO: Replace with proper logging service in production
  // logger.info('Processing webhook event', { type, userId: data.id });

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
      // TODO: Replace with proper logging service in production
      // logger.warn('Unhandled webhook event type', { type });
      return false; // Event not processed
  }
}

async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('User created', { userId: data.id });
  
  // TODO: In production, save user to your backend database
  // Example data structure for backend sync:
  const userData = {
    clerkUserId: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url,
    role: data.private_metadata?.role || 'student',
    emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  };
  
  // await saveUserToDatabase(userData);
  // TODO: Implement user database persistence
}

async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('User updated', { userId: data.id });
  
  // TODO: Update user in your backend database
  const userData = {
    clerkUserId: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url,
    role: data.private_metadata?.role || 'student',
    emailVerified: data.email_addresses?.[0]?.verification?.status === 'verified',
    updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
  };
  
  // await updateUserInDatabase(userData);
  // TODO: Implement user database update
}

async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('User deleted', { userId: data.id });
  
  // TODO: Delete or deactivate user in your backend database
  // await deleteUserFromDatabase(data.id);
  // TODO: Implement user database deletion
}

async function handleOrganizationCreated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Organization created', { organizationId: data.id });
  // TODO: Handle organization creation
}

async function handleOrganizationUpdated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Organization updated', { organizationId: data.id });
  // TODO: Handle organization update
}

async function handleOrganizationDeleted(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Organization deleted', { organizationId: data.id });
  // TODO: Handle organization deletion
}

async function handleMembershipCreated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Membership created', { userId: data.id });
  // TODO: Handle membership creation
}

async function handleMembershipUpdated(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Membership updated', { userId: data.id });
  // TODO: Handle membership update
}

async function handleMembershipDeleted(data: ClerkWebhookEvent['data']) {
  // TODO: Replace with proper logging service in production
  // logger.info('Membership deleted', { userId: data.id });
  // TODO: Handle membership deletion
}