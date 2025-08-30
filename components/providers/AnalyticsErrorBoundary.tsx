'use client';

import { Component, ReactNode } from 'react';
import { logWarn } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for analytics/tracking failures
 * Prevents analytics issues from crashing the entire app
 */
export class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log analytics errors without blocking the app
    logWarn('Analytics Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  override render() {
    if (this.state.hasError) {
      // Render fallback UI or just continue with children
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // In production, silently continue without analytics
      if (process.env.NODE_ENV === 'production') {
        return this.props.children;
      }
      
      // In development, show a minimal error indicator
      return (
        <>
          {this.props.children}
          <div 
            style={{
              position: 'fixed',
              bottom: '10px',
              left: '10px',
              background: 'rgba(255, 0, 0, 0.1)',
              color: 'red',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              zIndex: 9999,
              border: '1px solid rgba(255, 0, 0, 0.3)'
            }}
          >
            ⚠️ Analytics Error (Dev Only)
          </div>
        </>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components that use analytics
 */
export function withAnalyticsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function AnalyticsErrorBoundaryWrapper(props: P) {
    return (
      <AnalyticsErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AnalyticsErrorBoundary>
    );
  };
}
