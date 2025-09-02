/**
 * Simple Performance Monitor
 * Lightweight Web Vitals tracking for development
 */

"use client";

import React, { useEffect, useState } from "react";
import {
  trackWebVitals,
  logWebVital,
  type WebVital,
} from "@/lib/utils/webVitals";

interface SimplePerformanceMonitorProps {
  enabled?: boolean;
  showDevOverlay?: boolean;
}

export function SimplePerformanceMonitor({
  enabled = process.env.NODE_ENV === "development",
  showDevOverlay = false,
}: SimplePerformanceMonitorProps) {
  const [vitals, setVitals] = useState<WebVital[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    trackWebVitals((vital) => {
      logWebVital(vital);
      if (showDevOverlay) {
        setVitals((prev) => {
          const existing = prev.find((v) => v.name === vital.name);
          if (existing) {
            return prev.map((v) => (v.name === vital.name ? vital : v));
          }
          return [...prev, vital];
        });
      }
    });
  }, [enabled, showDevOverlay]);

  // Only show overlay in development with showDevOverlay enabled
  if (
    !showDevOverlay ||
    process.env.NODE_ENV !== "development" ||
    vitals.length === 0
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-border bg-popover p-3 font-mono text-xs text-popover-foreground shadow-lg">
      <h3 className="mb-2 font-bold">Web Vitals</h3>
      {vitals.map((vital) => (
        <div
          key={vital.name}
          className="mb-1 flex items-center justify-between"
        >
          <span>{vital.name}:</span>
          <span
            className={`ml-2 ${
              vital.rating === "good"
                ? "text-green-400"
                : vital.rating === "needs-improvement"
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            {Math.round(vital.value)}
            {vital.name === "CLS" ? "" : "ms"}
          </span>
        </div>
      ))}
    </div>
  );
}
