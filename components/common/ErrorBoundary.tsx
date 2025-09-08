"use client";

import React from "react";
import { logError } from "@/lib/utils/logger";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | undefined;
  errorInfo: React.ErrorInfo | undefined;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error | undefined;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: undefined, errorInfo: undefined };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: undefined,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    logError("ErrorBoundary caught an error:", error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      hasError: true,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <div className="border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center rounded-lg border p-8">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-destructive">
            Something went wrong
          </h3>
          <p className="mb-4 max-w-md text-center text-sm text-muted-foreground">
            We encountered an error while loading this component. Please try
            refreshing or contact support if the problem persists.
          </p>
          <button
            onClick={this.resetError}
            className="hover:bg-primary/90 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-sm font-medium">
                Error Details (Development)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">
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
    logError("Error caught by error handler:", error, errorInfo);
    // Could send to error tracking service here
  }, []);
}

// Specific fallback for feature comparison table
export const FeatureTableErrorFallback: React.FC<{
  error: Error | undefined;
  resetError: () => void;
}> = ({ resetError }) => (
  <div className="bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-border p-12">
    <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
    <h4 className="mb-2 text-base font-medium">
      Feature Comparison Unavailable
    </h4>
    <p className="mb-4 text-center text-sm text-muted-foreground">
      We're having trouble loading the feature comparison table.
    </p>
    <button
      onClick={resetError}
      className="hover:bg-secondary/80 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground transition-colors"
    >
      <RefreshCw className="h-3 w-3" />
      Retry
    </button>
  </div>
);

// Specialized error boundary for upload functionality
export function UploadErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={UploadErrorFallback}
      onError={(error, errorInfo) => {
        logError("Upload system error:", error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function UploadErrorFallback({
  resetError,
}: {
  error: Error | undefined;
  resetError: () => void;
}) {
  return (
    <div className="bg-destructive/5 border-destructive/20 rounded-lg border p-6 text-center">
      <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <svg
          className="h-6 w-6 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-destructive-foreground">
        Upload System Error
      </h3>
      <p className="mb-4 text-destructive">
        The upload system encountered an error and needs to be restarted. Your
        files are safe and you can try uploading again.
      </p>
      <button
        onClick={resetError}
        className="hover:bg-destructive/90 inline-flex items-center rounded-md bg-destructive px-4 py-2 text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Restart Upload System
      </button>
    </div>
  );
}

export default ErrorBoundary;
