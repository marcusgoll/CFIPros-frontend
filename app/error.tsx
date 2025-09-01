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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex justify-center">
            <AlertCircle className="text-error-500 h-12 w-12" />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Something went wrong!
          </h1>

          <p className="mb-6 text-gray-600">
            We apologize for the inconvenience. An unexpected error occurred
            while loading this page.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 rounded-md bg-gray-50 p-4 text-left">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Error details:
              </p>
              <p className="break-all font-mono text-xs text-gray-600">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              onClick={reset}
              variant="primary"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go home
            </Button>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          If this problem persists, please{" "}
          <a
            href="/contact"
            className="text-primary-600 hover:text-primary-700"
          >
            contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
