/**
 * Performance Monitor Component
 * Provides performance monitoring and debugging tools for development
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  PerformanceTracker,
  generatePerformanceReport,
  initializePerformanceMonitoring,
  type PerformanceMetric,
} from '@/lib/utils/performance';

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = false,
  position = 'bottom-right',
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(showOverlay);
  const [report, setReport] = useState<ReturnType<typeof generatePerformanceReport> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
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
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
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
      return 'text-gray-600';
    }

    if (value <= threshold.good) {
      return 'text-green-600';
    }
    if (value <= threshold.poor) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed ${positionClasses[position]} z-50 bg-gray-800 text-white px-3 py-2 rounded-full text-xs font-mono hover:bg-gray-700 transition-colors`}
        title="Toggle Performance Monitor"
      >
        ⚡ {metrics.length}
      </button>

      {/* Performance Overlay */}
      {isVisible && (
        <div
          className={`fixed ${positionClasses[position]} z-40 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto`}
          style={{ marginTop: position.startsWith('top') ? '40px' : 'auto', marginBottom: position.startsWith('bottom') ? '40px' : 'auto' }}
        >
          <div className="flex justify-between items-center mb-3">
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
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Web Vitals</h4>
              <div className="space-y-1">
                {Object.entries(report.webVitals).map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center text-xs">
                    <span className="font-mono">{name}:</span>
                    <span className={`font-mono ${getMetricColor(name, value)}`}>
                      {name === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Metrics */}
          {report && Object.keys(report.customMetrics).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Custom Metrics</h4>
              <div className="space-y-1">
                {Object.entries(report.customMetrics).slice(-10).map(([name, value]) => (
                  <div key={`${name}-${value}`} className="flex justify-between items-center text-xs">
                    <span className="font-mono truncate">{name}:</span>
                    <span className="font-mono text-gray-600">
                      {value < 10 ? value.toFixed(2) : Math.round(value)}
                      {name.includes('Memory') ? 'MB' : 
                       name.includes('Size') ? 'KB' : 'ms'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Metrics */}
          {metrics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Recent</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {metrics.slice(-5).reverse().map((metric, index) => (
                  <div key={`${metric.name}-${index}`} className="flex justify-between items-center text-xs">
                    <span className="font-mono truncate">{metric.name}:</span>
                    <span className="font-mono text-gray-600">
                      {metric.value < 10 ? metric.value.toFixed(2) : Math.round(metric.value)}{metric.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data Message */}
          {metrics.length === 0 && (
            <div className="text-xs text-gray-500 text-center py-4">
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
  const [report, setReport] = useState<ReturnType<typeof generatePerformanceReport> | null>(null);
  
  useEffect(() => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
    
    const interval = setInterval(() => {
      setReport(generatePerformanceReport());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-900 text-white text-xs py-1 hover:bg-gray-800 transition-colors"
      >
        {isOpen ? 'Hide' : 'Show'} Performance Debug
      </button>
      
      {isOpen && (
        <div className="bg-gray-900 text-white p-4 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Web Vitals */}
            {report && Object.keys(report.webVitals).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Web Vitals</h3>
                <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(report.webVitals, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Custom Metrics */}
            {report && Object.keys(report.customMetrics).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Custom Metrics</h3>
                <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto">
                  {JSON.stringify(report.customMetrics, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Summary */}
            {report && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Summary</h3>
                <pre className="text-xs bg-gray-800 p-2 rounded whitespace-pre-wrap">
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
