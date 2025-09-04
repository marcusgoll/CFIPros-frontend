// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

const mockAuth = jest.fn();

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocks
import { apiFetch } from '@/lib/api/clerk-client';

// Re-assign the mocked auth function
const { auth } = require('@clerk/nextjs/server');
auth.mockImplementation(() => mockAuth());

describe('apiFetch', () => {
  const mockToken = 'mock-jwt-token';
  const mockUserId = 'user_123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuth.mockResolvedValue({
      userId: mockUserId,
      getToken: jest.fn().mockResolvedValue(mockToken),
    } as any);
  });

  it('should make authenticated API requests successfully', async () => {
    const mockResponse = { data: 'success' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await apiFetch('/api/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle requests without authentication', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      getToken: jest.fn().mockResolvedValue(null),
    } as any);

    const mockResponse = { data: 'public' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await apiFetch('/api/public');

    expect(mockFetch).toHaveBeenCalledWith('/api/public', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle POST requests with body', async () => {
    const requestBody = { name: 'test' };
    const mockResponse = { success: true };
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    const result = await apiFetch('/api/test', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`,
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should handle 401 unauthorized responses', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
    });

    await expect(apiFetch('/api/protected')).rejects.toThrow('HTTP 401: Unauthorized');
  });

  it('should handle 500 server errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: jest.fn().mockResolvedValue({ error: 'Server error' }),
    });

    await expect(apiFetch('/api/error')).rejects.toThrow('HTTP 500: Internal Server Error');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(apiFetch('/api/test')).rejects.toThrow('Network error');
  });

  it('should handle token retrieval errors', async () => {
    mockAuth.mockResolvedValue({
      userId: mockUserId,
      getToken: jest.fn().mockRejectedValue(new Error('Token error')),
    } as any);

    await expect(apiFetch('/api/test')).rejects.toThrow('Token error');
  });

  it('should preserve custom headers', async () => {
    const customHeaders = {
      'X-Custom-Header': 'custom-value',
      'Content-Type': 'text/plain', // Should be overridden
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
    });

    await apiFetch('/api/test', {
      headers: customHeaders,
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      headers: {
        'Content-Type': 'application/json', // Overridden
        'X-Custom-Header': 'custom-value',
        'Authorization': `Bearer ${mockToken}`,
      },
    });
  });

  it('should handle non-JSON responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      text: jest.fn().mockResolvedValue('Plain text response'),
    });

    // For non-JSON responses, the function should still try to parse as JSON and fail
    await expect(apiFetch('/api/text')).rejects.toThrow('Invalid JSON');
  });
});