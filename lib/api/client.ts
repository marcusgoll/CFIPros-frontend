import { APIError } from "@/lib/api/errors";

// Polyfill AbortSignal.timeout in test environments if missing
(() => {
  const asAny = AbortSignal as unknown as {
    timeout?: (ms: number) => AbortSignal;
  };
  if (typeof asAny.timeout !== "function") {
    asAny.timeout = (ms: number) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    };
  }
})();

type RequestHeaders = Record<string, string>;
type RequestParams = Record<string, string | number>;

interface APIClientOptions {
  baseURL?: string;
  timeout?: number;
  headers?: RequestHeaders;
}

interface RequestOptions {
  params?: RequestParams;
  headers?: RequestHeaders;
  body?: unknown;
}

export class APIClient {
  private baseURL: string;
  private timeout?: number;
  private defaultHeaders: RequestHeaders;

  constructor(options: APIClientOptions = {}) {
    this.baseURL = options.baseURL ?? "";
    if (typeof options.timeout === "number") {
      this.timeout = options.timeout;
    }
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    };
  }

  private buildURL(endpoint: string, params?: RequestParams): string {
    const base = this.baseURL ? `${this.baseURL}${endpoint}` : endpoint;
    if (!params || Object.keys(params).length === 0) {
      return base;
    }
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      search.append(key, String(value));
    });
    const qs = search.toString();
    return `${base}?${qs}`;
  }

  private mergeHeaders(headers?: RequestHeaders): RequestHeaders {
    return { ...this.defaultHeaders, ...(headers ?? {}) };
  }

  private getTimeoutSignal(): AbortSignal | undefined {
    if (typeof this.timeout === "number" && this.timeout > 0) {
      const asAny = AbortSignal as unknown as {
        timeout?: (ms: number) => AbortSignal;
      };
      if (typeof asAny.timeout === "function") {
        return asAny.timeout(this.timeout);
      }
    }
    return undefined;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Try to parse error as JSON; fall back to generic
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        data = undefined;
      }
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const code =
          (obj["title"] as string) ||
          (obj["error"] as string) ||
          "unknown_error";
        const detail =
          (obj["detail"] as string) ||
          (obj["message"] as string) ||
          response.statusText ||
          "Request failed";
        const status = (obj["status"] as number) || response.status || 500;
        throw new APIError(code, status, detail);
      }
      throw new APIError(
        "internal_error",
        response.status || 500,
        response.statusText || "Internal Server Error"
      );
    }

    // Success: try JSON, then text, else null
    type RespHeaders = { get: (name: string) => string | null };
    const headersObj = (
      response as unknown as { headers?: Partial<RespHeaders> }
    ).headers;
    const contentType =
      typeof headersObj?.get === "function"
        ? headersObj!.get("content-type") || ""
        : "";
    if (contentType === "" || contentType.includes("application/json")) {
      try {
        return (await response.json()) as T;
      } catch {
        throw new APIError("invalid_json", 500, "Invalid JSON response");
      }
    }
    if (contentType.startsWith("text/")) {
      const text = await response.text();
      return text as unknown as T;
    }
    return null as unknown as T;
  }

  private async request<T>(
    endpoint: string,
    init: RequestInit,
    options?: RequestOptions & { skipDefaultHeaders?: boolean }
  ): Promise<T> {
    const url = this.buildURL(endpoint, options?.params);
    const signal = this.getTimeoutSignal();
    try {
      const headers = options?.skipDefaultHeaders
        ? (options?.headers ?? {})
        : this.mergeHeaders(options?.headers);
      const mergedSignal: AbortSignal | null = signal ?? init.signal ?? null;
      const response = await fetch(url, {
        ...init,
        headers,
        signal: mergedSignal,
      });
      return this.handleResponse<T>(response);
    } catch (err) {
      if (err instanceof APIError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      if (/timeout/i.test(message)) {
        throw new APIError("request_timeout", 504, "Request timeout");
      }
      if (/network/i.test(message)) {
        throw new APIError("network_error", 503, "Network error");
      }
      throw new APIError("internal_error", 500, message || "Request failed");
    }
  }

  async get<T>(
    endpoint: string,
    options?: { params?: RequestParams; headers?: RequestHeaders }
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, options);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { headers?: RequestHeaders }
  ): Promise<T> {
    const init: RequestInit = { method: "POST" };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.request<T>(
      endpoint,
      init,
      options?.headers ? { headers: options.headers } : undefined
    );
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: { headers?: RequestHeaders }
  ): Promise<T> {
    const init: RequestInit = { method: "PUT" };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    return this.request<T>(
      endpoint,
      init,
      options?.headers ? { headers: options.headers } : undefined
    );
  }

  async delete<T>(
    endpoint: string,
    options?: { headers?: RequestHeaders }
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      { method: "DELETE" },
      options?.headers ? { headers: options.headers } : undefined
    );
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    options?: { fields?: Record<string, string>; headers?: RequestHeaders }
  ): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.fields) {
      Object.entries(options.fields).forEach(([k, v]) => formData.append(k, v));
    }
    return this.request<T>(
      endpoint,
      { method: "POST", body: formData },
      options?.headers
        ? { headers: options.headers, skipDefaultHeaders: true }
        : { skipDefaultHeaders: true }
    );
  }
}

export const apiClient = new APIClient();
