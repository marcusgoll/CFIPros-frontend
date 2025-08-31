/**
 * Tests for performance optimization utilities
 */

import {
  createLazyComponent,
  createLazyNamedComponent,
  preloadComponent,
  debounce,
  throttle,
  createIntersectionObserver,
} from '@/lib/utils/performance-optimizations';
import { ComponentType } from 'react';

// Mock React.lazy
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: jest.fn((importFn) => {
    const MockComponent = () => null;
    MockComponent.$$typeof = Symbol.for('react.lazy');
    return MockComponent;
  }),
}));

describe('createLazyComponent', () => {
  it('should create a lazy component with proper displayName', () => {
    const mockImport = () => Promise.resolve({ default: () => null });
    const LazyComponent = createLazyComponent(mockImport, 'TestComponent');
    
    expect((LazyComponent as unknown as { displayName?: string }).displayName).toBe('Lazy(TestComponent)');
  });

  it('should use default displayName when name is not provided', () => {
    const mockImport = () => Promise.resolve({ default: () => null });
    const LazyComponent = createLazyComponent(mockImport);
    
    expect((LazyComponent as unknown as { displayName?: string }).displayName).toBe('Lazy(Component)');
  });
});

describe('createLazyNamedComponent', () => {
  it('should create a lazy component from named export', () => {
    const mockImport = () => Promise.resolve({ NamedComponent: () => null });
    const LazyComponent = createLazyNamedComponent(mockImport, 'NamedComponent', 'CustomName');
    
    expect((LazyComponent as unknown as { displayName?: string }).displayName).toBe('Lazy(CustomName)');
  });

  it('should use exportName as displayName when displayName is not provided', () => {
    const mockImport = () => Promise.resolve({ NamedComponent: () => null });
    const LazyComponent = createLazyNamedComponent(mockImport, 'NamedComponent');
    
    expect((LazyComponent as unknown as { displayName?: string }).displayName).toBe('Lazy(NamedComponent)');
  });
});

describe('preloadComponent', () => {
  it('should start loading component immediately', () => {
    const mockImport = jest.fn(() => Promise.resolve({ default: () => null }));
    const preloadFn = preloadComponent(mockImport);
    
    expect(mockImport).toHaveBeenCalledTimes(1);
    expect(typeof preloadFn).toBe('function');
  });

  it('should return function that resolves to component promise', async () => {
    const mockComponent = { default: () => null };
    const mockImport = () => Promise.resolve(mockComponent);
    const preloadFn = preloadComponent(mockImport);
    
    const result = await preloadFn();
    expect(result).toBe(mockComponent);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should delay function execution', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous calls', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should limit function execution rate', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(mockFn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments correctly', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn('arg1', 'arg2');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('createIntersectionObserver', () => {
  const mockIntersectionObserver = jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));

  beforeEach(() => {
    global.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create IntersectionObserver with default options', () => {
    const callback = jest.fn();
    createIntersectionObserver(callback);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(callback, {
      rootMargin: '50px',
      threshold: 0.1,
    });
  });

  it('should merge custom options with defaults', () => {
    const callback = jest.fn();
    const customOptions = { threshold: 0.5, root: null };
    
    createIntersectionObserver(callback, customOptions);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(callback, {
      rootMargin: '50px',
      threshold: 0.5,
      root: null,
    });
  });

  it('should return null in non-browser environment', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Simulating server-side environment
    delete global.window;

    const callback = jest.fn();
    const result = createIntersectionObserver(callback);

    expect(result).toBeNull();
    
    global.window = originalWindow;
  });
});