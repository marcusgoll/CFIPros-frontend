'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-destructive/20 bg-destructive/5 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            We encountered an error while loading this component. Please try refreshing or contact support if the problem persists.
          </p>
          <button
            onClick={this.resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    // Could send to error tracking service here
  }, []);
}

// Specific fallback for feature comparison table
export const FeatureTableErrorFallback: React.FC<{ 
  error?: Error; 
  resetError: () => void; 
}> = ({ resetError }) => (
  <div className="flex flex-col items-center justify-center p-12 border border-border bg-muted/20 rounded-lg">
    <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
    <h4 className="text-base font-medium mb-2">Feature Comparison Unavailable</h4>
    <p className="text-sm text-muted-foreground mb-4 text-center">
      We're having trouble loading the feature comparison table. 
    </p>
    <button
      onClick={resetError}
      className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
    >
      <RefreshCw className="h-3 w-3" />
      Retry
    </button>
  </div>
);

export default ErrorBoundary;