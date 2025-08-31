"use client";

import { useState } from "react";
import { ErrorMessage, Button } from "@/components/ui";
import { Copy } from "lucide-react";

type ProblemDetails = {
  type?: string;
  title?: string;
  detail?: string;
  status?: number;
  instance?: string;
};

export function ErrorAlert({ problem, requestId, onRetry }: { problem: ProblemDetails; requestId?: string | null; onRetry: () => void }) {
  const [copied, setCopied] = useState(false);
  const title = problem.title || 'Request failed';
  const detail = problem.detail || 'An error occurred while loading data.';

  const copy = async () => {
    if (!requestId) return;
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <ErrorMessage error={detail} title={title} onRetry={onRetry} />
      {requestId && (
        <Button size="sm" variant="ghost" aria-label="Copy request id" onClick={copy} title={copied ? 'Copied' : 'Copy x-request-id'}>
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

