/**
 * Performance Monitor Component
 * Provides performance monitoring and debugging tools for development
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  PerformanceTracker,
  generatePerformanceReport,
  initializePerformanceMonitoring,
  type PerformanceMetric,
} from "@/lib/utils/performance";

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === "development",
  showOverlay = false,
  position = "bottom-right",
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(showOverlay);
  const [report, setReport] = useState<ReturnType<
    typeof generatePerformanceReport
  > | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    // Initialize performance monitoring
    initializePerformanceMonitoring();

    // Update metrics periodically
    const interval = setInterval(() => {
      const tracker = PerformanceTracker.getInstance();
      const currentMetrics = tracker.getMetrics();
      setMetrics([...currentMetrics]);

      // Generate report if we have enough data
      if (currentMetrics.length > 0) {
        setReport(generatePerformanceReport());
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const getMetricColor = (name: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
    };

    const threshold = thresholds[name];
    if (!threshold) {
      return "text-gray-600";
    }

    if (value <= threshold.good) {
      return "text-green-600";
    }
    if (value <= threshold.poor) {
      return "text-yellow-600";
    }
    return "text-red-600";
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed ${positionClasses[position]} z-50 rounded-full bg-gray-800 px-3 py-2 font-mono text-xs text-white transition-colors hover:bg-gray-700`}
        title="Toggle Performance Monitor"
      >
        ⚡ {metrics.length}
      </button>

      {/* Performance Overlay */}
      {isVisible && (
        <div
          className={`fixed ${positionClasses[position]} z-40 max-h-96 max-w-sm overflow-auto rounded-lg border border-gray-200 bg-white p-4 shadow-lg`}
          style={{
            marginTop: position.startsWith("top") ? "40px" : "auto",
            marginBottom: position.startsWith("bottom") ? "40px" : "auto",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Performance</h3>
            <button
              onClick={() => {
                PerformanceTracker.getInstance().clearMetrics();
                setMetrics([]);
                setReport(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          {/* Web Vitals */}
          {report && Object.keys(report.webVitals).length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold text-gray-600">
                Web Vitals
              </h4>
              <div className="space-y-1">
                {Object.entries(report.webVitals).map(([name, value]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-mono">{name}:</span>
                    <span
                      className={`font-mono ${getMetricColor(name, value)}`}
                    >
                      {name === "CLS"
                        ? value.toFixed(3)
                        : `${Math.round(value)}ms`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Metrics */}
          {report && Object.keys(report.customMetrics).length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-semibold text-gray-600">
                Custom Metrics
              </h4>
              <div className="space-y-1">
                {Object.entries(report.customMetrics)
                  .slice(-10)
                  .map(([name, value]) => (
                    <div
                      key={`${name}-${value}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate font-mono">{name}:</span>
                      <span className="font-mono text-gray-600">
                        {value < 10 ? value.toFixed(2) : Math.round(value)}
                        {name.includes("Memory")
                          ? "MB"
                          : name.includes("Size")
                            ? "KB"
                            : "ms"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent Metrics */}
          {metrics.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold text-gray-600">
                Recent
              </h4>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {metrics
                  .slice(-5)
                  .reverse()
                  .map((metric, index) => (
                    <div
                      key={`${metric.name}-${index}`}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="truncate font-mono">{metric.name}:</span>
                      <span className="font-mono text-gray-600">
                        {metric.value < 10
                          ? metric.value.toFixed(2)
                          : Math.round(metric.value)}
                        {metric.unit}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Data Message */}
          {metrics.length === 0 && (
            <div className="py-4 text-center text-xs text-gray-500">
              No performance data yet...
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Performance debug panel for development
export function PerformanceDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<ReturnType<
    typeof generatePerformanceReport
  > | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const interval = setInterval(() => {
      setReport(generatePerformanceReport());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-900 py-1 text-xs text-white transition-colors hover:bg-gray-800"
      >
        {isOpen ? "Hide" : "Show"} Performance Debug
      </button>

      {isOpen && (
        <div className="max-h-64 overflow-y-auto bg-gray-900 p-4 text-white">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Web Vitals */}
            {report && Object.keys(report.webVitals).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Web Vitals</h3>
                <pre className="overflow-auto rounded bg-gray-800 p-2 text-xs">
                  {JSON.stringify(report.webVitals, null, 2)}
                </pre>
              </div>
            )}

            {/* Custom Metrics */}
            {report && Object.keys(report.customMetrics).length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Custom Metrics</h3>
                <pre className="overflow-auto rounded bg-gray-800 p-2 text-xs">
                  {JSON.stringify(report.customMetrics, null, 2)}
                </pre>
              </div>
            )}

            {/* Summary */}
            {report && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Summary</h3>
                <pre className="whitespace-pre-wrap rounded bg-gray-800 p-2 text-xs">
                  {report.summary}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
