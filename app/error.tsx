"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui";
import { logError } from "@/lib/utils/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to monitoring service (dev only)
    logError("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-error-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong!
          </h1>
          
          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. An unexpected error occurred while 
            loading this page.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Error details:</p>
              <p className="text-xs text-gray-600 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              variant="primary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go home
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          If this problem persists, please{" "}
          <a href="/contact" className="text-primary-600 hover:text-primary-700">
            contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
