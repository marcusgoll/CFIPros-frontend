/**
 * DOM Testing Environment Setup
 * Configures proper DOM environment with cleanup for integration tests
 */

import { configure, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, afterAll } from '@jest/globals';

// Configure Testing Library
configure({
  // Async utilities timeout (5 seconds)
  asyncUtilTimeout: 5000,
  
  // Wait for DOM mutations
  waitForElementTimeout: 3000,
  
  // Custom test ID attribute
  testIdAttribute: 'data-testid',
  
  // Disable suggestions for integration tests
  throwSuggestions: false,
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    // Mock implementation
  }
  
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    // Mock implementation
  }
  
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
};

// Mock MatchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock window.scrollBy
Object.defineProperty(window, 'scrollBy', {
  writable: true,
  value: jest.fn(),
});

// Mock HTMLElement.scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: jest.fn(),
});

// Mock URL.createObjectURL and URL.revokeObjectURL for file handling
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock FileReader for file upload testing
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  error: DOMException | null = null;
  readyState: number = 0;
  
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
  
  readAsText = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = 'mock file content';
    if (this.onload) {
      this.onload({} as ProgressEvent<FileReader>);
    }
  });
  
  readAsDataURL = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
    if (this.onload) {
      this.onload({} as ProgressEvent<FileReader>);
    }
  });
  
  readAsArrayBuffer = jest.fn().mockImplementation(() => {
    this.readyState = 2;
    this.result = new ArrayBuffer(16);
    if (this.onload) {
      this.onload({} as ProgressEvent<FileReader>);
    }
  });
  
  abort = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
} as any;

// Mock Blob constructor
global.Blob = class Blob {
  size: number;
  type: string;
  
  constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
    this.size = parts?.reduce((total, part) => {
      if (typeof part === 'string') {
        return total + part.length;
      }
      return total + (part as any).byteLength || 0;
    }, 0) || 0;
    this.type = options?.type || '';
  }
  
  slice = jest.fn().mockReturnValue(new Blob());
  stream = jest.fn();
  text = jest.fn().mockResolvedValue('mock blob text');
  arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(16));
} as any;

// Mock DragEvent for drag and drop testing
global.DragEvent = class DragEvent extends Event {
  dataTransfer: DataTransfer | null = null;
  
  constructor(type: string, eventInitDict?: DragEventInit) {
    super(type, eventInitDict);
    this.dataTransfer = {
      dropEffect: 'none',
      effectAllowed: 'uninitialized',
      files: [] as any,
      items: [] as any,
      types: [],
      clearData: jest.fn(),
      getData: jest.fn().mockReturnValue(''),
      setData: jest.fn(),
      setDragImage: jest.fn(),
    } as any;
  }
} as any;

// Mock DataTransfer for file upload testing
global.DataTransfer = class DataTransfer {
  dropEffect: string = 'none';
  effectAllowed: string = 'uninitialized';
  files: FileList = [] as any;
  items: DataTransferItemList = [] as any;
  types: string[] = [];
  
  clearData = jest.fn();
  getData = jest.fn().mockReturnValue('');
  setData = jest.fn();
  setDragImage = jest.fn();
} as any;

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
    readText: jest.fn().mockResolvedValue(''),
    write: jest.fn().mockResolvedValue(undefined),
    read: jest.fn().mockResolvedValue([]),
  },
});

// Mock geolocation API (if needed for future features)
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: jest.fn().mockImplementation((success) =>
      Promise.resolve(success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
      }))
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([]),
    getEntriesByType: jest.fn().mockReturnValue([]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    navigation: {
      type: 0,
    },
    timing: {
      navigationStart: Date.now(),
      loadEventEnd: Date.now() + 1000,
    },
  },
});

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

// Suppress specific console methods during tests
const consoleMethods = ['log', 'info', 'warn', 'error'] as const;
consoleMethods.forEach(method => {
  global.console[method] = jest.fn();
});

// Memory leak detection utilities
const openHandles = new Set<any>();

export const trackHandle = (handle: any) => {
  openHandles.add(handle);
  return handle;
};

export const untrackHandle = (handle: any) => {
  openHandles.delete(handle);
};

export const getOpenHandles = () => Array.from(openHandles);

// Cleanup function to be called after each test
const performCleanup = () => {
  // Clean up React Testing Library
  cleanup();
  
  // Clear all timers
  jest.clearAllTimers();
  jest.useRealTimers();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset modules cache
  jest.resetModules();
  
  // Clear any pending async operations
  return new Promise<void>((resolve) => {
    // Use setTimeout instead of setImmediate for browser compatibility
    setTimeout(() => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      resolve();
    }, 0);
  });
};

// Memory usage tracking
let initialMemoryUsage: NodeJS.MemoryUsage | null = null;

const trackMemoryUsage = () => {
  if (process.memoryUsage && !initialMemoryUsage) {
    initialMemoryUsage = process.memoryUsage();
  }
};

const checkMemoryLeaks = () => {
  if (process.memoryUsage && initialMemoryUsage) {
    const currentMemory = process.memoryUsage();
    const memoryIncrease = currentMemory.heapUsed - initialMemoryUsage.heapUsed;
    
    // Warn if memory increased significantly (>50MB)
    if (memoryIncrease > 50 * 1024 * 1024) {
      console.warn(`Potential memory leak detected: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`);
    }
  }
};

// Setup and teardown hooks
beforeEach(async () => {
  // Track memory usage at start of each test
  trackMemoryUsage();
  
  // Reset DOM state
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Reset location
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    },
  });
});

afterEach(async () => {
  // Perform comprehensive cleanup
  await performCleanup();
  
  // Check for memory leaks
  checkMemoryLeaks();
  
  // Reset console methods
  consoleMethods.forEach(method => {
    global.console[method] = originalConsole[method];
  });
});

// Global teardown
afterAll(() => {
  // Final cleanup
  openHandles.clear();
  
  // Reset all mocked APIs
  jest.restoreAllMocks();
  
  // Final memory check
  checkMemoryLeaks();
});

// Export cleanup utilities for manual use in tests
export const manualCleanup = {
  performCleanup,
  trackMemoryUsage,
  checkMemoryLeaks,
  getOpenHandles,
  trackHandle,
  untrackHandle,
};

// DOM testing utilities
export const domUtils = {
  // Wait for element to be removed from DOM
  waitForElementToBeRemoved: async (element: Element, timeout: number = 1000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        if (!document.contains(element)) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element still in DOM after ${timeout}ms`));
        } else {
          setTimeout(checkElement, 50);
        }
      };
      
      checkElement();
    });
  },
  
  // Create mock event
  createMockEvent: (type: string, eventInit: EventInit = {}) => {
    return new Event(type, {
      bubbles: true,
      cancelable: true,
      ...eventInit,
    });
  },
  
  // Create mock keyboard event
  createMockKeyboardEvent: (key: string, eventInit: KeyboardEventInit = {}) => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...eventInit,
    });
  },
  
  // Create mock mouse event
  createMockMouseEvent: (type: string, eventInit: MouseEventInit = {}) => {
    return new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      ...eventInit,
    });
  },
};