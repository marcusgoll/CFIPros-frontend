"use client";

import React from "react";
import { logError } from "@/lib/utils/logger";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/utils/errorSanitization";

interface BoundaryFallbackProps {
  error: Error | undefined;
  retry: () => void;
}

const MockupErrorFallback: React.FC<BoundaryFallbackProps> = ({
  error,
  retry,
}) => (
  <div className="flex h-80 flex-col items-center justify-center rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-6 text-center">
    <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
    <h3 className="mb-2 text-lg font-semibold text-red-800">
      Demo Unavailable
    </h3>
    <p className="mb-4 max-w-xs text-sm text-red-600">
      We're having trouble loading this feature demonstration.
    </p>
    <button
      onClick={retry}
      className="flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-red-700 transition-colors hover:bg-red-200"
    >
      <RefreshCw className="h-4 w-4" />
      Try Again
    </button>
    {process.env.NODE_ENV === "development" && (
      <details className="mt-4 text-xs text-red-600">
        <summary className="cursor-pointer">Error Details</summary>
        <pre className="mt-2 overflow-auto rounded bg-red-50 p-2 text-left">
          {error?.message}
        </pre>
      </details>
    )}
  </div>
);

const SectionErrorFallback: React.FC<BoundaryFallbackProps> = ({
  error,
  retry,
}) => (
  <div className="to-muted/20 bg-gradient-to-b from-background py-20">
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="text-center">
        <AlertTriangle className="mx-auto mb-6 h-16 w-16 text-orange-500" />
        <h2 className="mb-4 text-2xl font-bold">
          Features Section Unavailable
        </h2>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          We're experiencing technical difficulties loading the features
          showcase. Please try refreshing the page.
        </p>
        <button
          onClick={retry}
          className="hover:bg-primary/90 mx-auto flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Reload Features
        </button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-sm text-muted-foreground">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mx-auto mt-3 max-w-2xl overflow-auto rounded bg-muted p-3 text-left">
              {error?.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  </div>
);

interface MockupWrapperProps {
  children: React.ReactNode;
  sectionTitle?: string;
}

export const MockupErrorBoundary: React.FC<MockupWrapperProps> = ({
  children,
  sectionTitle = "Feature Demo",
}) => {
  return (
    <ErrorBoundary
      fallback={MockupErrorFallback}
      onError={(error, errorInfo) => {
        logError(`Mockup error in ${sectionTitle}:`, error, errorInfo);
        // In production, send to monitoring service with sanitized data
        if (typeof window !== "undefined" && window.gtag) {
          const sanitizedMessage = sanitizeErrorMessage(error.message);
          window.gtag("event", "exception", {
            description: `Mockup error: ${sanitizedMessage}`,
            fatal: false,
            custom_parameters: {
              section: sectionTitle,
              component: "MockupErrorBoundary",
            },
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

interface BenefitSectionWrapperProps {
  children: React.ReactNode;
}

export const BenefitErrorBoundary: React.FC<BenefitSectionWrapperProps> = ({
  children,
}) => {
  return (
    <ErrorBoundary
      fallback={SectionErrorFallback}
      onError={(error, errorInfo) => {
        logError("BenefitZipperList section error:", error, errorInfo);
        // In production, send to monitoring service with sanitized data
        if (typeof window !== "undefined" && window.gtag) {
          const sanitizedMessage = sanitizeErrorMessage(error.message);
          window.gtag("event", "exception", {
            description: `BenefitZipper section error: ${sanitizedMessage}`,
            fatal: false,
            custom_parameters: {
              component: "BenefitZipperList",
              errorBoundary: "SectionLevel",
            },
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
