/**
 * Performance optimizations utilities
 * Central location for performance-related optimizations and utilities
 */

import { lazy, ComponentType } from 'react';

/**
 * Creates a lazy-loaded component with error boundary fallback
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFunction: () => Promise<{ default: T }>,
  name?: string
) {
  const LazyComponent = lazy(importFunction);
  LazyComponent.displayName = `Lazy(${name || 'Component'})`;
  return LazyComponent;
}

/**
 * Creates a lazy-loaded component from a named export
 */
export function createLazyNamedComponent<T extends ComponentType<Record<string, unknown>>>(
  importFunction: () => Promise<Record<string, T>>,
  exportName: string,
  displayName?: string
) {
  const LazyComponent = lazy(() => 
    importFunction().then(module => ({ 
      default: module[exportName] as T 
    }))
  );
  LazyComponent.displayName = `Lazy(${displayName || exportName})`;
  return LazyComponent;
}

/**
 * Preload a component to improve perceived performance
 */
export function preloadComponent(importFunction: () => Promise<unknown>) {
  // Start loading the component
  const componentPromise = importFunction();
  
  // Return a function to get the loaded component
  return () => componentPromise;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Intersection Observer hook for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  });
}

/**
 * Resource hints for critical resources
 */
export function addResourceHints() {
  if (typeof document === 'undefined') {
    return;
  }

  // Preconnect to external domains
  const domains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  });
}

/**
 * Bundle size monitoring for development
 */
export function logBundleSize() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  if (typeof window !== 'undefined' && 'performance' in window) {
    const entries = performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const navigation = entries[0] as PerformanceNavigationTiming;
      // eslint-disable-next-line no-console
      console.info('Bundle Performance:', {
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize,
      });
    }
  }
}