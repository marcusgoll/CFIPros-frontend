"use client";

import React from "react";
import { logError } from "@/lib/utils/logger";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error | undefined;
    retry: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError("Error caught by ErrorBoundary:", error, errorInfo);

    this.setState({ error, errorInfo });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // In a real app, send to monitoring service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  retry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent error={this.state.error} retry={this.retry} />
        );
      }

      // Default error UI
      return (
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mb-4 text-muted-foreground">
              We encountered an unexpected error. Please try again or refresh
              the page.
            </p>
            <button
              onClick={this.retry}
              className="hover:bg-primary/90 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
              Try Again
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Development Only)
                </summary>
                <pre className="bg-destructive/5 mt-2 max-h-32 overflow-auto rounded border p-3 text-xs text-destructive">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
        // In production, send to monitoring service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function UploadErrorFallback({
  retry,
}: {
  error: Error | undefined;
  retry: () => void;
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
        onClick={retry}
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
