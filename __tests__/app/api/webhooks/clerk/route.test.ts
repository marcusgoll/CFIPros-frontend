import { POST } from '@/app/api/webhooks/clerk/route';
import { NextRequest } from 'next/server';

// Mock Next.js headers function
const mockHeaders = jest.fn();
jest.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}));

// Mock Svix for webhook verification
const mockVerify = jest.fn();
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: mockVerify,
  })),
}));

describe('/api/webhooks/clerk', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';
    
    // Mock the headers function to return our test headers
    const mockHeadersMap = new Map([
      ['svix-id', 'msg_123'],
      ['svix-timestamp', '1640995200'],
      ['svix-signature', 'v1,signature123'],
    ]);
    
    mockHeaders.mockReturnValue({
      get: (name: string) => mockHeadersMap.get(name) || null,
    });
    
    mockRequest = {
      text: jest.fn().mockResolvedValue('{"type":"user.created","data":{"id":"user_123"}}'),
    };
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SECRET;
  });

  it('should handle user.created webhook successfully', async () => {
    const mockEventData = {
      type: 'user.created',
      data: {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        email_addresses: [
          { email_address: 'john@example.com', verification: { status: 'verified' } }
        ],
        private_metadata: { role: 'student' },
      },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Webhook processed successfully',
      eventType: 'user.created',
      processed: true,
    });
    expect(mockVerify).toHaveBeenCalledWith(
      '{"type":"user.created","data":{"id":"user_123"}}',
      {
        'svix-id': 'msg_123',
        'svix-timestamp': '1640995200',
        'svix-signature': 'v1,signature123',
      }
    );
  });

  it('should handle user.updated webhook successfully', async () => {
    const mockEventData = {
      type: 'user.updated',
      data: {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Smith', // Updated last name
        email_addresses: [
          { email_address: 'john.smith@example.com', verification: { status: 'verified' } }
        ],
        private_metadata: { role: 'cfi' },
      },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eventType).toBe('user.updated');
    expect(data.processed).toBe(true);
  });

  it('should handle user.deleted webhook successfully', async () => {
    const mockEventData = {
      type: 'user.deleted',
      data: {
        id: 'user_123',
        deleted: true,
      },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eventType).toBe('user.deleted');
    expect(data.processed).toBe(true);
  });

  it('should handle organization.created webhook successfully', async () => {
    const mockEventData = {
      type: 'organization.created',
      data: {
        id: 'org_123',
        name: 'Test Organization',
        slug: 'test-org',
        created_at: 1640995200000,
      },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eventType).toBe('organization.created');
    expect(data.processed).toBe(true);
  });

  it('should handle organizationMembership.created webhook successfully', async () => {
    const mockEventData = {
      type: 'organizationMembership.created',
      data: {
        id: 'orgmem_123',
        organization: {
          id: 'org_123',
          name: 'Test Organization',
        },
        public_user_data: {
          user_id: 'user_123',
          first_name: 'John',
          last_name: 'Doe',
        },
        role: 'admin',
      },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.eventType).toBe('organizationMembership.created');
    expect(data.processed).toBe(true);
  });

  it('should acknowledge unsupported event types', async () => {
    const mockEventData = {
      type: 'session.created',
      data: { id: 'sess_123' },
    };

    mockVerify.mockReturnValue(mockEventData);

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Webhook received but not processed',
      eventType: 'session.created',
      processed: false,
    });
  });

  it('should return error when webhook secret is missing', async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook secret not configured');
  });

  it('should return error when required headers are missing', async () => {
    // Mock empty headers
    mockHeaders.mockReturnValue({
      get: () => null,
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing svix headers');
  });

  it('should handle webhook verification failure', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid webhook signature');
  });

  it('should handle request body parsing failure', async () => {
    mockRequest.text = jest.fn().mockRejectedValue(new Error('Invalid body'));

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Failed to parse request body');
  });

  it('should handle server errors gracefully', async () => {
    mockVerify.mockImplementation(() => {
      throw new Error('Server error');
    });

    const response = await POST(mockRequest as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle missing svix headers individually', async () => {
    // Test missing svix-id
    mockHeaders.mockReturnValue({
      get: (name: string) => {
        const headers = new Map([
          ['svix-timestamp', '1640995200'],
          ['svix-signature', 'v1,signature123'],
        ]);
        return headers.get(name) || null;
      },
    });

    let response = await POST(mockRequest as NextRequest);
    expect(response.status).toBe(400);

    // Test missing svix-timestamp
    mockHeaders.mockReturnValue({
      get: (name: string) => {
        const headers = new Map([
          ['svix-id', 'msg_123'],
          ['svix-signature', 'v1,signature123'],
        ]);
        return headers.get(name) || null;
      },
    });

    response = await POST(mockRequest as NextRequest);
    expect(response.status).toBe(400);

    // Test missing svix-signature
    mockHeaders.mockReturnValue({
      get: (name: string) => {
        const headers = new Map([
          ['svix-id', 'msg_123'],
          ['svix-timestamp', '1640995200'],
        ]);
        return headers.get(name) || null;
      },
    });

    response = await POST(mockRequest as NextRequest);
    expect(response.status).toBe(400);
  });
});