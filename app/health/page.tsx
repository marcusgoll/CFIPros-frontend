'use client';

import { useState, useEffect } from 'react';
import { runPostHogHealthTests, formatHealthTestResults, HealthTestResult } from '@/lib/analytics/healthTest';
import { logError, logInfo } from '@/lib/utils/logger';

export default function HealthTestPage() {
  const [results, setResults] = useState<HealthTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runTests = async () => {
    setLoading(true);
    logInfo('🔍 Running PostHog Health Tests...');
    
    try {
      const testResults = await runPostHogHealthTests();
      setResults(testResults);
      setLastRun(new Date());
      
      // Format results for console
      formatHealthTestResults(testResults);
    } catch (error) {
      logError('Health test error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Run tests on mount
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'warning': return '⚠️';
      case 'fail': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'fail': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PostHog Health Check</h1>
              <p className="text-gray-600 mt-2">Verify PostHog integration and telemetry functionality</p>
            </div>
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          {lastRun && (
            <div className="mb-6 text-sm text-gray-500">
              Last run: {lastRun.toLocaleTimeString()}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Running health tests...</span>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{passCount}</div>
                  <div className="text-sm text-green-600">Passed</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <div className="text-sm text-yellow-600">Warnings</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failCount}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>

              {/* Overall Status */}
              <div className={`rounded-lg p-4 mb-8 ${
                failCount === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {failCount === 0 ? '🎉' : '⚠️'}
                  </span>
                  <div>
                    <div className={`font-medium ${failCount === 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {failCount === 0 ? 'All Systems Operational' : 'Issues Detected'}
                    </div>
                    <div className={`text-sm ${failCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {failCount === 0 
                        ? 'PostHog is configured correctly and ready to use'
                        : 'Some tests failed. Please check the configuration below.'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getStatusColor(result.status)} border-opacity-20`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getStatusIcon(result.status)}</span>
                          <h3 className="font-medium">{result.test}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === 'pass' ? 'bg-green-100 text-green-800' :
                            result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{result.message}</p>
                        {result.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check the browser console for detailed logs</li>
                  <li>• Verify environment variables in .env.local</li>
                  <li>• Check PostHog dashboard for incoming events</li>
                  <li>• Test the hero section CTA button for event tracking</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
