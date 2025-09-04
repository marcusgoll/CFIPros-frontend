"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class AcsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("ACS Error Boundary caught an error:", error, errorInfo);
    }
    
    // Report error to monitoring service if available
    if (typeof window !== "undefined" && "gtag" in window && typeof window["gtag"] === "function") {
      window["gtag"]("event", "exception", {
        description: error.message,
        fatal: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800">
                Something went wrong
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  An error occurred while loading the ACS database. This might be
                  a temporary issue.
                </p>
                {this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium hover:text-red-800">
                      Technical details
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Try again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-900 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50"
                >
                  Reload page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}