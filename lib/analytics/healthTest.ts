/**
 * PostHog Health Test Utility
 * Verifies PostHog connection and basic functionality
 */

import { telemetry } from './telemetry';
import posthog from 'posthog-js';

export interface HealthTestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: any;
}

export async function runPostHogHealthTests(): Promise<HealthTestResult[]> {
  const results: HealthTestResult[] = [];

  // Test 1: Environment Variables
  results.push(testEnvironmentVariables());

  // Test 2: PostHog Initialization
  results.push(testPostHogInitialization());

  // Test 3: PostHog Instance
  results.push(testPostHogInstance());

  // Test 4: Basic Event Tracking
  results.push(await testEventTracking());

  // Test 5: Session Management
  results.push(testSessionManagement());

  // Test 6: Feature Flags
  results.push(await testFeatureFlags());

  return results;
}

function testEnvironmentVariables(): HealthTestResult {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey) {
    return {
      test: 'Environment Variables',
      status: 'fail',
      message: 'NEXT_PUBLIC_POSTHOG_KEY is not set',
      data: { apiKey: !!apiKey, apiHost: !!apiHost }
    };
  }

  if (!apiHost) {
    return {
      test: 'Environment Variables',
      status: 'warning',
      message: 'NEXT_PUBLIC_POSTHOG_HOST not set, using default',
      data: { apiKey: !!apiKey, apiHost: apiHost || 'https://app.posthog.com' }
    };
  }

  return {
    test: 'Environment Variables',
    status: 'pass',
    message: 'Environment variables are properly configured',
    data: { apiKey: `${apiKey.substring(0, 8)}...`, apiHost }
  };
}

function testPostHogInitialization(): HealthTestResult {
  try {
    // Try to initialize telemetry
    telemetry.initialize({
      debugMode: true
    });

    return {
      test: 'PostHog Initialization',
      status: 'pass',
      message: 'PostHog telemetry initialized successfully'
    };
  } catch (error) {
    return {
      test: 'PostHog Initialization',
      status: 'fail',
      message: `Failed to initialize PostHog: ${error}`,
      data: { error: String(error) }
    };
  }
}

function testPostHogInstance(): HealthTestResult {
  if (typeof window === 'undefined') {
    return {
      test: 'PostHog Instance',
      status: 'warning',
      message: 'Running on server-side, PostHog not available'
    };
  }

  try {
    if (!posthog.__loaded) {
      return {
        test: 'PostHog Instance',
        status: 'fail',
        message: 'PostHog is not loaded'
      };
    }

    const distinctId = posthog.get_distinct_id();
    const sessionId = posthog.get_session_id();

    return {
      test: 'PostHog Instance',
      status: 'pass',
      message: 'PostHog instance is active and loaded',
      data: { 
        distinctId: distinctId ? `${distinctId.substring(0, 8)}...` : null,
        sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : null,
        loaded: posthog.__loaded
      }
    };
  } catch (error) {
    return {
      test: 'PostHog Instance',
      status: 'fail',
      message: `PostHog instance error: ${error}`,
      data: { error: String(error) }
    };
  }
}

async function testEventTracking(): Promise<HealthTestResult> {
  if (typeof window === 'undefined') {
    return {
      test: 'Event Tracking',
      status: 'warning',
      message: 'Cannot test event tracking on server-side'
    };
  }

  try {
    // Send a test event
    const testEventId = `health_test_${Date.now()}`;
    telemetry.track('hero_view', {
      test: true,
      testId: testEventId,
      timestamp: Date.now()
    });

    // Wait a moment for the event to be processed
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      test: 'Event Tracking',
      status: 'pass',
      message: 'Test event sent successfully',
      data: { testEventId }
    };
  } catch (error) {
    return {
      test: 'Event Tracking',
      status: 'fail',
      message: `Failed to track test event: ${error}`,
      data: { error: String(error) }
    };
  }
}

function testSessionManagement(): HealthTestResult {
  if (typeof window === 'undefined') {
    return {
      test: 'Session Management',
      status: 'warning',
      message: 'Cannot test session management on server-side'
    };
  }

  try {
    const sessionId = posthog.get_session_id();
    const distinctId = posthog.get_distinct_id();

    if (!sessionId || !distinctId) {
      return {
        test: 'Session Management',
        status: 'fail',
        message: 'Session or distinct ID not available'
      };
    }

    return {
      test: 'Session Management',
      status: 'pass',
      message: 'Session management working correctly',
      data: { 
        hasSessionId: !!sessionId,
        hasDistinctId: !!distinctId
      }
    };
  } catch (error) {
    return {
      test: 'Session Management',
      status: 'fail',
      message: `Session management error: ${error}`,
      data: { error: String(error) }
    };
  }
}

async function testFeatureFlags(): Promise<HealthTestResult> {
  if (typeof window === 'undefined') {
    return {
      test: 'Feature Flags',
      status: 'warning',
      message: 'Cannot test feature flags on server-side'
    };
  }

  try {
    // Test feature flag functionality
    const testFlag = posthog.getFeatureFlag('test_flag');
    
    // Also test isFeatureEnabled
    const testEnabled = posthog.isFeatureEnabled('test_flag');

    return {
      test: 'Feature Flags',
      status: 'pass',
      message: 'Feature flag system is functional',
      data: { 
        testFlag: testFlag || 'not_set',
        testEnabled,
        flagsAvailable: typeof posthog.getFeatureFlag === 'function'
      }
    };
  } catch (error) {
    return {
      test: 'Feature Flags',
      status: 'fail',
      message: `Feature flags error: ${error}`,
      data: { error: String(error) }
    };
  }
}

/**
 * Format health test results for console output
 */
export function formatHealthTestResults(results: HealthTestResult[]): void {
  console.log('\n🔍 PostHog Health Test Results\n');
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`${icon} ${result.test}: ${result.message}`);
    
    if (result.data) {
      console.log(`   Data:`, result.data);
    }
  });

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  console.log(`\n📊 Summary: ${passCount} passed, ${warningCount} warnings, ${failCount} failed`);
  
  if (failCount === 0) {
    console.log('🎉 All critical tests passed! PostHog is ready to use.');
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration.');
  }
}

/**
 * Simple health check function for quick testing
 */
export async function quickHealthCheck(): Promise<boolean> {
  const results = await runPostHogHealthTests();
  const criticalFailures = results.filter(r => 
    r.status === 'fail' && 
    !r.test.includes('Feature Flags') // Feature flags are not critical
  );
  
  return criticalFailures.length === 0;
}