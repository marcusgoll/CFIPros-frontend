"use client";

import { useEffect, useState, useRef } from 'react';

interface PerformanceMetrics {
  searchResponseTime: number;
  pageLoadTime: number;
  filterApplyTime: number;
  renderTime: number;
  memoryUsage: number;
  apiCallCount: number;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugPanel?: boolean;
  thresholds?: {
    searchResponse: number;
    pageLoad: number;
    filterApply: number;
  };
}

export default function AcsPerformanceMonitor({
  onMetricsUpdate,
  showDebugPanel = false,
  thresholds = {
    searchResponse: 500,
    pageLoad: 2000,
    filterApply: 300,
  },
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    searchResponseTime: 0,
    pageLoadTime: 0,
    filterApplyTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    apiCallCount: 0,
  });

  const [isVisible, setIsVisible] = useState(false);
  const metricsRef = useRef<PerformanceMetrics>(metrics);
  const apiCallStartTimes = useRef<Map<string, number>>(new Map());
  const renderStartTime = useRef<number>(0);

  // Update ref when metrics change
  useEffect(() => {
    metricsRef.current = metrics;
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  // Measure page load time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pageLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, pageLoadTime }));
    }
  }, []);

  // Monitor memory usage
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Intercept fetch requests to measure API response times
  useEffect(() => {
    if (typeof window === 'undefined') {return;}

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const startTime = performance.now();
      const requestId = `${Date.now()}-${Math.random()}`;

      apiCallStartTimes.current.set(requestId, startTime);

      try {
        const response = await originalFetch(input, init);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Update metrics based on request type
        setMetrics(prev => {
          const newMetrics = { ...prev };
          
          if (url.includes('/acs-codes')) {
            if (url.includes('q=')) {
              newMetrics.searchResponseTime = responseTime;
            } else {
              newMetrics.filterApplyTime = responseTime;
            }
          }
          
          newMetrics.apiCallCount = prev.apiCallCount + 1;
          return newMetrics;
        });

        apiCallStartTimes.current.delete(requestId);
        return response;
      } catch (error) {
        apiCallStartTimes.current.delete(requestId);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Measure render time
  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    if (renderTime > 0) {
      setMetrics(prev => ({ ...prev, renderTime }));
    }
  });

  // Web Vitals integration
  useEffect(() => {
    if (typeof window === 'undefined') {return;}

    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => setMetrics(prev => ({ ...prev, searchResponseTime: metric.value })));
      getFID((metric) => setMetrics(prev => ({ ...prev, filterApplyTime: metric.value })));
      getFCP((metric) => setMetrics(prev => ({ ...prev, pageLoadTime: metric.value })));
      getLCP((metric) => setMetrics(prev => ({ ...prev, renderTime: metric.value })));
      getTTFB((metric) => setMetrics(prev => ({ ...prev, apiCallCount: metric.value })));
    }).catch(() => {
      // web-vitals not available
    });
  }, []);

  const getStatusColor = (value: number, threshold: number) => {
    if (value === 0) {return 'text-gray-500';}
    return value <= threshold ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (value: number, threshold: number) => {
    if (value === 0) {return '⏱️';}
    return value <= threshold ? '✅' : '❌';
  };

  if (!showDebugPanel) {return null;}

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700"
        title="Performance Monitor"
      >
        📊
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 w-80 rounded-lg bg-white border border-gray-300 shadow-xl">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3 text-sm">
            {/* Search Response Time */}
            <div className="flex items-center justify-between">
              <span>Search Response</span>
              <span className={`font-mono ${getStatusColor(metrics.searchResponseTime, thresholds.searchResponse)}`}>
                {getStatusIcon(metrics.searchResponseTime, thresholds.searchResponse)}{' '}
                {metrics.searchResponseTime.toFixed(0)}ms
              </span>
            </div>

            {/* Page Load Time */}
            <div className="flex items-center justify-between">
              <span>Page Load</span>
              <span className={`font-mono ${getStatusColor(metrics.pageLoadTime, thresholds.pageLoad)}`}>
                {getStatusIcon(metrics.pageLoadTime, thresholds.pageLoad)}{' '}
                {metrics.pageLoadTime.toFixed(0)}ms
              </span>
            </div>

            {/* Filter Apply Time */}
            <div className="flex items-center justify-between">
              <span>Filter Apply</span>
              <span className={`font-mono ${getStatusColor(metrics.filterApplyTime, thresholds.filterApply)}`}>
                {getStatusIcon(metrics.filterApplyTime, thresholds.filterApply)}{' '}
                {metrics.filterApplyTime.toFixed(0)}ms
              </span>
            </div>

            {/* Render Time */}
            <div className="flex items-center justify-between">
              <span>Last Render</span>
              <span className="font-mono text-gray-600">
                {metrics.renderTime.toFixed(1)}ms
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <span>Memory Usage</span>
              <span className="font-mono text-gray-600">
                {metrics.memoryUsage}MB
              </span>
            </div>

            {/* API Call Count */}
            <div className="flex items-center justify-between">
              <span>API Calls</span>
              <span className="font-mono text-gray-600">
                {metrics.apiCallCount}
              </span>
            </div>

            {/* Performance Score */}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Performance Score</span>
                <span className={`font-bold ${
                  getPerformanceScore(metrics, thresholds) >= 80 ? 'text-green-600' :
                  getPerformanceScore(metrics, thresholds) >= 60 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getPerformanceScore(metrics, thresholds)}/100
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <button
                onClick={() => {
                  setMetrics({
                    searchResponseTime: 0,
                    pageLoadTime: 0,
                    filterApplyTime: 0,
                    renderTime: 0,
                    memoryUsage: 0,
                    apiCallCount: 0,
                  });
                }}
                className="w-full rounded bg-gray-100 px-3 py-1 text-xs hover:bg-gray-200"
              >
                Reset Metrics
              </button>
              
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'gc' in window) {
                    (window as unknown as { gc: () => void }).gc();
                  }
                }}
                className="w-full rounded bg-blue-100 px-3 py-1 text-xs hover:bg-blue-200"
              >
                Force GC
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getPerformanceScore(metrics: PerformanceMetrics, thresholds: { searchResponse: number; pageLoad: number; filterApply: number }): number {
  let score = 100;
  
  // Search response time (40% weight)
  if (metrics.searchResponseTime > thresholds.searchResponse) {
    score -= 40 * Math.min(1, (metrics.searchResponseTime - thresholds.searchResponse) / thresholds.searchResponse);
  }
  
  // Page load time (30% weight)
  if (metrics.pageLoadTime > thresholds.pageLoad) {
    score -= 30 * Math.min(1, (metrics.pageLoadTime - thresholds.pageLoad) / thresholds.pageLoad);
  }
  
  // Filter apply time (20% weight)
  if (metrics.filterApplyTime > thresholds.filterApply) {
    score -= 20 * Math.min(1, (metrics.filterApplyTime - thresholds.filterApply) / thresholds.filterApply);
  }
  
  // Memory usage penalty (10% weight) - above 100MB
  if (metrics.memoryUsage > 100) {
    score -= 10 * Math.min(1, (metrics.memoryUsage - 100) / 100);
  }
  
  return Math.round(Math.max(0, score));
}