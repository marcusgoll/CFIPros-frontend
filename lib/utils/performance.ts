/**
 * Performance monitoring utilities
 * Provides tools for measuring and monitoring application performance
 */

import React from "react";

// Performance observer for measuring web vitals
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

// Performance tracking class
export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeObservers();
  }

  public static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  private initializeObservers(): void {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    try {
      // Observe layout shifts (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "layout-shift") {
            const layoutShift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput?: boolean;
            };
            if (!layoutShift.hadRecentInput) {
              this.recordMetric({
                name: "CLS",
                value: layoutShift.value,
                unit: "score",
                timestamp: Date.now(),
              });
            }
          }
        }
      });

      clsObserver.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(clsObserver);

      // Observe largest contentful paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            this.recordMetric({
              name: "LCP",
              value: entry.startTime,
              unit: "ms",
              timestamp: Date.now(),
            });
          }
        }
      });

      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(lcpObserver);

      // Observe first input delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "first-input") {
            const firstInput = entry as PerformanceEntry & {
              processingStart: number;
            };
            this.recordMetric({
              name: "FID",
              value: firstInput.processingStart - entry.startTime,
              unit: "ms",
              timestamp: Date.now(),
            });
          }
        }
      });

      fidObserver.observe({ entryTypes: ["first-input"] });
      this.observers.push(fidObserver);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to initialize performance observers:", error);
    }
  }

  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(
        `Performance: ${metric.name} = ${metric.value}${metric.unit}`
      );
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((metric) => metric.name === name);
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Performance measurement utilities
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  const tracker = PerformanceTracker.getInstance();

  const finish = (result: T) => {
    const end = performance.now();
    tracker.recordMetric({
      name,
      value: end - start,
      unit: "ms",
      timestamp: Date.now(),
    });
    return result;
  };

  try {
    const result = fn();

    if (result instanceof Promise) {
      return result.then(finish).catch((error) => {
        finish(error);
        throw error;
      });
    }

    return finish(result);
  } catch (error) {
    finish(error as T);
    throw error;
  }
}

// Web Vitals measurement
export function measureWebVitals(): void {
  const tracker = PerformanceTracker.getInstance();

  // Measure First Contentful Paint (FCP)
  if (typeof window !== "undefined") {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          tracker.recordMetric({
            name: "FCP",
            value: entry.startTime,
            unit: "ms",
            timestamp: Date.now(),
          });
        }
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ["paint"] });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to observe paint entries:", error);
    }

    // Measure Time to Interactive (TTI) approximation
    window.addEventListener("load", () => {
      setTimeout(() => {
        const loadTime =
          performance.timing.loadEventEnd - performance.timing.navigationStart;
        tracker.recordMetric({
          name: "Load Time",
          value: loadTime,
          unit: "ms",
          timestamp: Date.now(),
        });
      }, 0);
    });
  }
}

// Memory usage monitoring
export function measureMemoryUsage(): void {
  if (typeof window !== "undefined" && "memory" in performance) {
    const memory = (
      performance as Performance & { memory?: { usedJSHeapSize: number } }
    ).memory;
    const tracker = PerformanceTracker.getInstance();

    tracker.recordMetric({
      name: "Memory Used",
      value: Math.round((memory?.usedJSHeapSize ?? 0) / 1024 / 1024),
      unit: "MB",
      timestamp: Date.now(),
    });

    // jsHeapSizeLimit not in our narrowed type; skip if not present
  }
}

// Bundle size reporting
export function reportBundleSize(): void {
  if (typeof window !== "undefined") {
    const tracker = PerformanceTracker.getInstance();

    // Get navigation timing data
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      tracker.recordMetric({
        name: "DOM Content Loaded",
        value:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        unit: "ms",
        timestamp: Date.now(),
      });

      tracker.recordMetric({
        name: "Load Complete",
        value: navigation.loadEventEnd - navigation.loadEventStart,
        unit: "ms",
        timestamp: Date.now(),
      });
    }

    // Get resource timing data
    const resources = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    const jsResources = resources.filter(
      (resource) =>
        resource.name.includes(".js") && !resource.name.includes("node_modules")
    );

    let totalJSSize = 0;
    jsResources.forEach((resource) => {
      if (resource.transferSize) {
        totalJSSize += resource.transferSize;
      }
    });

    if (totalJSSize > 0) {
      tracker.recordMetric({
        name: "Total JS Bundle Size",
        value: Math.round(totalJSSize / 1024),
        unit: "KB",
        timestamp: Date.now(),
      });
    }
  }
}

// Performance report generation
export function generatePerformanceReport(): {
  webVitals: Record<string, number>;
  customMetrics: Record<string, number>;
  summary: string;
} {
  const tracker = PerformanceTracker.getInstance();
  const metrics = tracker.getMetrics();

  const webVitals: Record<string, number> = {};
  const customMetrics: Record<string, number> = {};

  const vitalMetrics = ["FCP", "LCP", "FID", "CLS"];

  metrics.forEach((metric) => {
    if (vitalMetrics.includes(metric.name)) {
      webVitals[metric.name] = metric.value;
    } else {
      customMetrics[metric.name] = metric.value;
    }
  });

  // Generate summary
  let summary = "Performance Summary:\n";

  // Web Vitals thresholds
  const thresholds = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
  };

  Object.entries(webVitals).forEach(([name, value]) => {
    const threshold = thresholds[name as keyof typeof thresholds];
    if (threshold) {
      let status = "Good";
      if (value > threshold.poor) {
        status = "Poor";
      } else if (value > threshold.good) {
        status = "Needs Improvement";
      }
      summary += `- ${name}: ${value} (${status})\n`;
    }
  });

  return { webVitals, customMetrics, summary };
}

// Initialize performance monitoring
export function initializePerformanceMonitoring(): void {
  if (typeof window !== "undefined") {
    // Start tracking web vitals
    measureWebVitals();

    // Report bundle size after load
    window.addEventListener("load", () => {
      setTimeout(() => {
        reportBundleSize();
        measureMemoryUsage();
      }, 1000);
    });

    // Periodic memory monitoring
    setInterval(measureMemoryUsage, 30000); // Every 30 seconds
  }
}

// Cleanup function
export function cleanupPerformanceMonitoring(): void {
  const tracker = PerformanceTracker.getInstance();
  tracker.disconnect();
}

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const WithPerformanceComponent = (props: P) => {
    React.useEffect(() => {
      const start = performance.now();
      const tracker = PerformanceTracker.getInstance();

      return () => {
        const end = performance.now();
        tracker.recordMetric({
          name: `${componentName} Render Time`,
          value: end - start,
          unit: "ms",
          timestamp: Date.now(),
        });
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };

  WithPerformanceComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return WithPerformanceComponent;
}
