import { auth } from "@clerk/nextjs/server";
import { useAuth } from "@clerk/nextjs";
import { APIError } from "@/lib/api/errors";

/**
 * Server-side API client that automatically includes Clerk JWT token
 * Use this for server components, API routes, and server actions
 */
export async function apiFetch<T = unknown>(
  path: string, 
  init: RequestInit = {}
): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken({ template: process.env['JWT_TEMPLATE'] || "backend" });
  
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE'] || "https://api.cfipros.com/api/v1";
  const url = `${baseUrl}${path}`;
  
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store', // Ensure fresh data for auth-sensitive requests
  });
  
  if (!response.ok) {
    // Try to parse error response
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    
    if (errorData && typeof errorData === 'object') {
      const obj = errorData as Record<string, unknown>;
      const code = (obj['error'] as string) || 'api_error';
      const message = (obj['message'] as string) || response.statusText;
      throw new APIError(code, response.status, message);
    }
    
    throw new APIError('api_error', response.status, `API request failed: ${response.status}`);
  }
  
  // Handle empty responses
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      throw new APIError('invalid_json', 500, 'Invalid JSON response from API');
    }
  }
  
  return null as T;
}

/**
 * Client-side hook for API requests with automatic token handling
 * Use this in React components and client-side code
 */
export function useClerkAPI() {
  const { getToken, isSignedIn } = useAuth();
  
  const fetchWithAuth = async <T = unknown>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> => {
    if (!isSignedIn) {
      throw new APIError('unauthorized', 401, 'User not authenticated');
    }
    
    const token = await getToken({ template: process.env['NEXT_PUBLIC_JWT_TEMPLATE'] || "backend" });
    const baseUrl = process.env['NEXT_PUBLIC_API_BASE'] || "https://api.cfipros.com/api/v1";
    const url = `${baseUrl}${path}`;
    
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = null;
      }
      
      if (errorData && typeof errorData === 'object') {
        const obj = errorData as Record<string, unknown>;
        const code = (obj['error'] as string) || 'api_error';
        const message = (obj['message'] as string) || response.statusText;
        throw new APIError(code, response.status, message);
      }
      
      throw new APIError('api_error', response.status, `API request failed: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await response.json();
      } catch {
        throw new APIError('invalid_json', 500, 'Invalid JSON response from API');
      }
    }
    
    return null as T;
  };
  
  return {
    get: <T = unknown>(path: string, params?: Record<string, string>) => {
      const searchParams = params ? `?${new URLSearchParams(params).toString()}` : '';
      return fetchWithAuth<T>(`${path}${searchParams}`);
    },
    
    post: <T = unknown>(path: string, body?: unknown) => {
      const options: RequestInit = { method: 'POST' };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }
      return fetchWithAuth<T>(path, options);
    },
    
    put: <T = unknown>(path: string, body?: unknown) => {
      const options: RequestInit = { method: 'PUT' };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }
      return fetchWithAuth<T>(path, options);
    },
    
    delete: <T = unknown>(path: string) => {
      return fetchWithAuth<T>(path, {
        method: 'DELETE',
      });
    },
  };
}

/**
 * Type definitions for API responses based on our OpenAPI contract
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  org_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  role: string;
}

export interface APIResponse<T = unknown> {
  data: T;
  message?: string;
}

/**
 * Convenience functions for common API endpoints
 */
export const AuthAPI = {
  // Get current user info
  me: () => apiFetch<User>('/auth/me'),
  
  // Get current organization
  currentOrg: () => apiFetch<Organization>('/organizations/current'),
  
  // Refresh user session
  refresh: () => apiFetch<{ success: boolean }>('/auth/refresh'),
};

/**
 * Client-side auth API hook
 */
export function useAuthAPI() {
  const api = useClerkAPI();
  
  return {
    me: () => api.get<User>('/auth/me'),
    currentOrg: () => api.get<Organization>('/organizations/current'),
    refresh: () => api.post<{ success: boolean }>('/auth/refresh'),
  };
}