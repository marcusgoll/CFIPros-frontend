import "@testing-library/jest-dom";

// Custom Jest matchers for better assertions
expect.extend({
  toBeValidFile(received) {
    const pass = received && 
                 received instanceof File && 
                 received.name && 
                 received.size >= 0;
    
    return {
      message: () =>
        pass
          ? `Expected ${received} not to be a valid File object`
          : `Expected ${received} to be a valid File object with name and size`,
      pass,
    };
  },
  
  toHaveValidationError(received, field) {
    const pass = received && 
                 received.errors && 
                 received.errors[field];
    
    return {
      message: () =>
        pass
          ? `Expected form not to have validation error for field "${field}"`
          : `Expected form to have validation error for field "${field}"`,
      pass,
    };
  },
  
  toBeSecureResponse(received) {
    const pass = received &&
                 received.headers &&
                 received.headers.get('x-content-type-options') === 'nosniff' &&
                 received.headers.get('x-frame-options');
    
    return {
      message: () =>
        pass
          ? `Expected response not to have security headers`
          : `Expected response to have required security headers`,
      pass,
    };
  }
});

// Add fetch polyfill for integration tests
if (!globalThis.fetch) {
  globalThis.fetch = async (url, options = {}) => {
    const { default: fetch } = await import('node-fetch');
    return fetch(url, options);
  };
}

// Mock next/router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: true,
    };
  },
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock window.matchMedia for components using it (e.g., responsive hooks)
if (!window.matchMedia) {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock Web APIs that are not available in Node.js test environment
// Mock Next.js server-side APIs
jest.mock("next/server", () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    url: typeof input === "string" ? input : input?.url || "",
    method: init?.method || "GET",
    headers: new Headers(init?.headers || {}),
    body: init?.body || null,
    json: jest.fn().mockResolvedValue({}),
    formData: jest.fn().mockResolvedValue(init?.body instanceof FormData ? init?.body : new FormData()),
    text: jest.fn().mockResolvedValue(""),
    clone: jest.fn().mockReturnThis(),
    nextUrl: {
      pathname: "",
      searchParams: new URLSearchParams(),
    },
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => {
      const headers = new Headers(init?.headers || {});
      return {
        status: init?.status || 200,
        headers,
        json: jest.fn().mockResolvedValue(data),
        text: jest.fn().mockResolvedValue(JSON.stringify(data)),
        ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
      };
    }),
    next: jest.fn().mockImplementation(() => ({
      status: 200,
      headers: new Headers(),
    })),
    redirect: jest.fn().mockImplementation((url, status = 302) => ({
      status,
      headers: new Headers({ Location: url }),
    })),
  },
}));

global.Response = class MockResponse {
  constructor(body, init) {
    this.body = body;
    this.status = init?.status || 200;
    this.statusText = init?.statusText || "OK";
    this.headers = new Headers(init?.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }
};

// Mock AbortSignal for Node.js test environment
if (!global.AbortSignal) {
  global.AbortSignal = class MockAbortSignal {
    static timeout(ms) {
      const signal = new MockAbortSignal();
      signal.aborted = false;
      setTimeout(() => {
        signal.aborted = true;
        if (signal.onabort) signal.onabort();
      }, ms);
      return signal;
    }
    
    constructor() {
      this.aborted = false;
      this.onabort = null;
    }
    
    addEventListener(type, listener) {
      if (type === 'abort') {
        this.onabort = listener;
      }
    }
    
    removeEventListener(type, listener) {
      if (type === 'abort') {
        this.onabort = null;
      }
    }
  };
} else if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms) => {
    const signal = new AbortSignal();
    setTimeout(() => {
      if (signal.onabort) signal.onabort();
    }, ms);
    return signal;
  };
}

// Mock Clerk authentication
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(() => ({
    userId: "test_user_123",
    sessionId: "test_session_123",
    getToken: jest.fn().mockResolvedValue("test_token_123"),
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    userId: "test_user_123",
    sessionId: "test_session_123",
    getToken: jest.fn().mockResolvedValue("test_token_123"),
    signOut: jest.fn(),
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: "test_user_123",
      firstName: "Test",
      lastName: "User",
      emailAddresses: [{ emailAddress: "test@example.com" }],
    },
  })),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User Menu</div>,
  RedirectToSignIn: () => <div data-testid="redirect-to-signin">Redirecting...</div>,
  currentUser: jest.fn().mockResolvedValue({
    id: "test_user_123",
    firstName: "Test",
    lastName: "User",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  }),
}));

// Mock Clerk middleware
jest.mock("@clerk/nextjs/server", () => ({
  authMiddleware: jest.fn((config) => {
    return (req) => {
      // Mock authenticated request
      req.auth = {
        userId: "test_user_123",
        sessionId: "test_session_123",
        getToken: jest.fn().mockResolvedValue("test_token_123"),
      };
      return new Response(null, { status: 200 });
    };
  }),
  clerkMiddleware: jest.fn((config) => {
    return (req) => {
      req.auth = {
        userId: "test_user_123",
        sessionId: "test_session_123",
        getToken: jest.fn().mockResolvedValue("test_token_123"),
      };
      return new Response(null, { status: 200 });
    };
  }),
  currentUser: jest.fn().mockResolvedValue({
    id: "test_user_123",
    firstName: "Test",
    lastName: "User",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  }),
}));

// Set production API URL for integration tests
if (!process.env.BACKEND_API_URL) {
  process.env.BACKEND_API_URL = 'https://api.cfipros.com';
}

// Mock FileUploadRateLimiter
jest.mock("./lib/api/rateLimiter", () => ({
  FileUploadRateLimiter: {
    checkRateLimit: jest.fn(() => ({
      allowed: true,
      remainingUploads: 15,
      resetTime: Date.now() + 60000,
    })),
  },
}));

// Mock rate limiter modules that tests might import
global.FileUploadRateLimiter = {
  checkRateLimit: jest.fn(() => ({
    allowed: true,
    remainingUploads: 15,
    resetTime: Date.now() + 60000,
  })),
};

// Set Clerk environment variables for tests
if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_testing_key';
}

if (!process.env.CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = 'sk_test_testing_key';
}

global.Headers = class MockHeaders {
  constructor(init) {
    this.headers = new Map();
    if (init) {
      if (init instanceof Headers) {
        for (const [key, value] of init.entries()) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else if (Array.isArray(init)) {
        for (const [key, value] of init) {
          this.headers.set(key.toLowerCase(), value);
        }
      } else if (typeof init === "object") {
        for (const [key, value] of Object.entries(init)) {
          this.headers.set(key.toLowerCase(), value);
        }
      }
    }
  }

  get(name) {
    return this.headers.get(name.toLowerCase()) || null;
  }

  set(name, value) {
    this.headers.set(name.toLowerCase(), value);
  }

  has(name) {
    return this.headers.has(name.toLowerCase());
  }

  delete(name) {
    this.headers.delete(name.toLowerCase());
  }

  *entries() {
    yield* this.headers.entries();
  }
};

global.FormData = class MockFormData {
  constructor() {
    this.data = new Map();
  }

  append(name, value) {
    if (!this.data.has(name)) {
      this.data.set(name, []);
    }
    this.data.get(name).push(value);
  }

  get(name) {
    const values = this.data.get(name);
    return values ? values[0] : null;
  }

  getAll(name) {
    return this.data.get(name) || [];
  }

  has(name) {
    return this.data.has(name);
  }

  set(name, value) {
    this.data.set(name, [value]);
  }

  delete(name) {
    this.data.delete(name);
  }

  *entries() {
    for (const [key, values] of this.data.entries()) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }
};

global.Blob = class MockBlob {
  constructor(blobParts = [], options = {}) {
    this.blobParts = blobParts;
    this.type = options.type || "";
    this.size = blobParts.reduce((size, part) => {
      if (typeof part === "string") return size + part.length;
      if (part instanceof ArrayBuffer) return size + part.byteLength;
      if (part instanceof Uint8Array) return size + part.length;
      return size;
    }, 0);
  }

  arrayBuffer() {
    const content = this.blobParts.join("");
    const buffer = new ArrayBuffer(content.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < content.length; i++) {
      view[i] = content.charCodeAt(i);
    }
    return Promise.resolve(buffer);
  }

  text() {
    const content = this.blobParts.join("");
    return Promise.resolve(content);
  }

  slice(start = 0, end = this.size) {
    const content = this.blobParts.join("").slice(start, end);
    return new Blob([content], { type: this.type });
  }
};

global.File = class MockFile extends Blob {
  constructor(bits, name, options = {}) {
    super(Array.isArray(bits) ? bits : [bits], options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
  }

  slice(start = 0, end = this.size) {
    const content = this.blobParts.join("").slice(start, end);
    return new File([content], this.name, { type: this.type });
  }
};
