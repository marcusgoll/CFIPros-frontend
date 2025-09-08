/**
 * Backend Direct API Test Framework - Core API Client
 * Implements direct backend API testing with authentication and contract validation
 * Task 2.1: Backend Direct API Test Framework
 */

import { getIntegrationConfig, type Environment } from '../config';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  raw?: Response;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  files?: File[];
  timeout?: number;
  expectStatus?: number[];
}

export class BackendApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(environment?: Environment) {
    const config = getIntegrationConfig(environment);
    this.baseUrl = config.config.backendUrl;
    this.timeout = config.config.limits.requestTimeout;
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'CFIPros-Integration-Tests/1.0.0',
    };

    // Add Clerk authentication if available
    if (config.clerkCredentials.publishableKey) {
      this.defaultHeaders['Authorization'] = `Bearer ${config.clerkCredentials.publishableKey}`;
    }
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Make a direct API request to the backend
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      files,
      timeout = this.timeout,
      expectStatus = [200, 201, 202, 204]
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Prepare request headers
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Prepare request body
    let requestBody: any;
    if (files && files.length > 0) {
      // Handle file uploads
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('files', file);
      });
      if (body) {
        Object.keys(body).forEach(key => {
          formData.append(key, body[key]);
        });
      }
      requestBody = formData;
      // Remove Content-Type to let browser set multipart boundary
      delete requestHeaders['Content-Type'];
    } else if (body) {
      requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`[Backend API] ${method} ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data: T;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = null as T;
      }

      const apiResponse: ApiResponse<T> = {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        raw: response,
      };

      // Validate expected status codes
      if (!expectStatus.includes(response.status)) {
        console.error(`[Backend API] Unexpected status ${response.status} for ${method} ${url}`);
        console.error(`[Backend API] Response:`, data);
      }

      return apiResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms for ${method} ${url}`);
      }
      
      throw new Error(`Request failed for ${method} ${url}: ${error}`);
    }
  }

  /**
   * GET request helper
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload files to backend
   */
  async uploadFiles<T = any>(endpoint: string, files: File[], body?: any, options: Omit<RequestOptions, 'method' | 'files' | 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      files, 
      body,
      expectStatus: [200, 201, 202] 
    });
  }
}

/**
 * Create a configured API client instance
 */
export function createApiClient(environment?: Environment): BackendApiClient {
  return new BackendApiClient(environment);
}

/**
 * Global API client instance for tests
 */
export const apiClient = new BackendApiClient();
