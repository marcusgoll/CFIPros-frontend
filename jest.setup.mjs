import "@testing-library/jest-dom";

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
