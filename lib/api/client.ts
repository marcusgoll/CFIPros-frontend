import { APIError } from "@/lib/types";

const API_BASE_URL = process.env["API_BASE_URL"] || "https://api.cfipros.com/v1";
const API_TIMEOUT = parseInt(process.env["API_TIMEOUT"] || "30000");

export class APIClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = API_BASE_URL, timeout = API_TIMEOUT) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: "unknown_error",
          message: "An unknown error occurred",
          details: `HTTP ${response.status} ${response.statusText}`,
        }));

        throw new Error(JSON.stringify(errorData));
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new Error(
            JSON.stringify({
              error: "timeout",
              message: "Request timeout",
              details: `Request took longer than ${this.timeout}ms`,
            })
          );
        }
        throw error;
      }

      throw new Error(
        JSON.stringify({
          error: "unknown_error",
          message: "An unknown error occurred",
        })
      );
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const options: RequestInit = { method: "GET" };
    if (headers) {
      options.headers = headers;
    }
    return this.request<T>(endpoint, options);
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const options: RequestInit = { method: "POST" };
    if (headers) {
      options.headers = headers;
    }
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    const options: RequestInit = { method: "PUT" };
    if (headers) {
      options.headers = headers;
    }
    if (data) {
      options.body = JSON.stringify(data);
    }
    return this.request<T>(endpoint, options);
  }

  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<T> {
    const options: RequestInit = { method: "DELETE" };
    if (headers) {
      options.headers = headers;
    }
    return this.request<T>(endpoint, options);
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const options: RequestInit = {
      method: "POST",
      body: formData,
    };

    if (headers) {
      options.headers = headers;
    }

    return this.request<T>(endpoint, options);
  }
}

export const apiClient = new APIClient();