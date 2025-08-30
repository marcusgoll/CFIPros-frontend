/**
 * Tests for API client
 * Testing HTTP client functionality and error handling
 */

import { APIClient } from '@/lib/api/client';
import { APIError } from '@/lib/api/errors';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('APIClient', () => {
  let client: APIClient;
  const mockResponse = { id: 1, name: 'Test' };

  beforeEach(() => {
    client = new APIClient();
    jest.clearAllMocks();
    
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
      headers: new Headers({
        'content-type': 'application/json',
      }),
    } as any);
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should include query parameters', async () => {
      await client.get('/test', { params: { page: 1, limit: 10 } });

      expect(mockFetch).toHaveBeenCalledWith('/test?page=1&limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should include custom headers', async () => {
      await client.get('/test', { 
        headers: { 'Authorization': 'Bearer token' } 
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
      });
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const data = { name: 'Test', value: 123 };
      const result = await client.post('/test', data);

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty POST body', async () => {
      await client.post('/test');

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: undefined,
      });
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const data = { id: 1, name: 'Updated' };
      const result = await client.put('/test/1', data);

      expect(mockFetch).toHaveBeenCalledWith('/test/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const result = await client.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith('/test/1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('File uploads', () => {
    it('should upload file successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { 
        type: 'application/pdf' 
      });

      await client.uploadFile('/upload', mockFile);

      expect(mockFetch).toHaveBeenCalledWith('/upload', {
        method: 'POST',
        headers: {},
        body: expect.any(FormData),
      });

      const formData = (mockFetch.mock.calls[0]![1] as any).body as FormData;
      expect(formData.get('file')).toBe(mockFile);
    });

    it('should include additional form fields in upload', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const options = {
        fields: { description: 'Test file', category: 'documents' }
      };

      await client.uploadFile('/upload', mockFile, options);

      const formData = (mockFetch.mock.calls[0]![1] as any).body as FormData;
      expect(formData.get('file')).toBe(mockFile);
      expect(formData.get('description')).toBe('Test file');
      expect(formData.get('category')).toBe('documents');
    });

    it('should include custom headers in upload', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const options = {
        headers: { 'X-Upload-Type': 'document' }
      };

      await client.uploadFile('/upload', mockFile, options);

      expect(mockFetch).toHaveBeenCalledWith('/upload', {
        method: 'POST',
        headers: { 'X-Upload-Type': 'document' },
        body: expect.any(FormData),
      });
    });
  });

  describe('Error handling', () => {
    it('should handle HTTP error responses', async () => {
      const errorResponse = {
        type: 'about:blank#validation_error',
        title: 'validation_error',
        status: 400,
        detail: 'Invalid input data',
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(errorResponse),
      } as any);

      await expect(client.get('/test')).rejects.toThrow(APIError);
      
      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).code).toBe('validation_error');
        expect((error as APIError).status).toBe(400);
        expect((error as APIError).detail).toBe('Invalid input data');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow(APIError);
      
      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).code).toBe('network_error');
      }
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      await expect(client.get('/test')).rejects.toThrow(APIError);
      
      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).code).toBe('request_timeout');
      }
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any);

      await expect(client.get('/test')).rejects.toThrow(APIError);
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      } as any);

      await expect(client.get('/test')).rejects.toThrow(APIError);
      
      try {
        await client.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).status).toBe(500);
      }
    });
  });

  describe('Request configuration', () => {
    it('should use custom base URL', () => {
      const customClient = new APIClient({ baseURL: 'https://api.example.com' });
      customClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.any(Object));
    });

    it('should use custom timeout', async () => {
      const customClient = new APIClient({ timeout: 5000 });
      
      // Mock AbortSignal.timeout
      const mockAbortSignal = { aborted: false } as AbortSignal;
      jest.spyOn(AbortSignal, 'timeout').mockReturnValue(mockAbortSignal);

      await customClient.get('/test');

      expect(AbortSignal.timeout).toHaveBeenCalledWith(5000);
      expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({
        signal: mockAbortSignal,
      }));
    });

    it('should include default headers', () => {
      const customClient = new APIClient({
        headers: { 'X-API-Key': 'test-key' }
      });

      customClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
        },
      });
    });

    it('should merge request headers with default headers', () => {
      const customClient = new APIClient({
        headers: { 'X-API-Key': 'test-key' }
      });

      customClient.get('/test', {
        headers: { 'Authorization': 'Bearer token' }
      });

      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
          'Authorization': 'Bearer token',
        },
      });
    });
  });

  describe('Response handling', () => {
    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await client.delete('/test/1');
      expect(result).toBeNull();
    });

    it('should handle text responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/plain',
        }),
        text: jest.fn().mockResolvedValue('Plain text response'),
        json: jest.fn().mockRejectedValue(new Error('Not JSON')),
      } as any);

      const result = await client.get('/test');
      expect(result).toBe('Plain text response');
    });
  });
});