"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { sanitizeErrorMessage } from "@/lib/utils/errorSanitization";

interface MockupErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const MockupErrorFallback: React.FC<MockupErrorFallbackProps> = ({ error, retry }) => (
  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 h-80 flex flex-col items-center justify-center text-center">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-semibold text-red-800 mb-2">
      Demo Unavailable
    </h3>
    <p className="text-red-600 text-sm mb-4 max-w-xs">
      We're having trouble loading this feature demonstration.
    </p>
    <button
      onClick={retry}
      className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
    >
      <RefreshCw className="h-4 w-4" />
      Try Again
    </button>
    {process.env.NODE_ENV === 'development' && (
      <details className="mt-4 text-xs text-red-600">
        <summary className="cursor-pointer">Error Details</summary>
        <pre className="mt-2 p-2 bg-red-50 rounded text-left overflow-auto">
          {error.message}
        </pre>
      </details>
    )}
  </div>
);

interface SectionErrorFallbackProps {
  error: Error;
  retry: () => void;
}

const SectionErrorFallback: React.FC<SectionErrorFallbackProps> = ({ error, retry }) => (
  <div className="py-20 bg-gradient-to-b from-background to-muted/20">
    <div className="mx-auto max-w-7xl px-4 md:px-6">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Features Section Unavailable</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          We're experiencing technical difficulties loading the features showcase.
          Please try refreshing the page.
        </p>
        <button
          onClick={retry}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg mx-auto hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
          Reload Features
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-sm text-muted-foreground">
            <summary className="cursor-pointer">Technical Details</summary>
            <pre className="mt-3 p-3 bg-muted rounded text-left overflow-auto max-w-2xl mx-auto">
              {error.stack}
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
  sectionTitle = "Feature Demo" 
}) => {
  return (
    <ErrorBoundary
      fallback={MockupErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`Mockup error in ${sectionTitle}:`, error, errorInfo);
        // In production, send to monitoring service with sanitized data
        if (typeof window !== 'undefined' && window.gtag) {
          const sanitizedMessage = sanitizeErrorMessage(error.message);
          window.gtag('event', 'exception', {
            description: `Mockup error: ${sanitizedMessage}`,
            fatal: false,
            custom_parameters: {
              section: sectionTitle,
              component: 'MockupErrorBoundary'
            }
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

export const BenefitErrorBoundary: React.FC<BenefitSectionWrapperProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={SectionErrorFallback}
      onError={(error, errorInfo) => {
        console.error('BenefitZipperList section error:', error, errorInfo);
        // In production, send to monitoring service with sanitized data
        if (typeof window !== 'undefined' && window.gtag) {
          const sanitizedMessage = sanitizeErrorMessage(error.message);
          window.gtag('event', 'exception', {
            description: `BenefitZipper section error: ${sanitizedMessage}`,
            fatal: false,
            custom_parameters: {
              component: 'BenefitZipperList',
              errorBoundary: 'SectionLevel'
            }
          });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
};