"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ErrorRetryProps {
  problem?: string;
  requestId?: string | undefined;
}

export function ErrorRetry({ problem, requestId }: ErrorRetryProps) {
  const router = useRouter();

  const handleRetry = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      {problem && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          {problem}
        </p>
      )}
      {requestId && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Request ID: {requestId}
        </p>
      )}
      <Button 
        onClick={handleRetry}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}