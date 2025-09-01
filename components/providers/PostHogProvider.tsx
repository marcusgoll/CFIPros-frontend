"use client";

import { useEffect, ReactNode, useState } from "react";
import { initTelemetry } from "@/lib/analytics/telemetry";
import { quickHealthCheck } from "@/lib/analytics/healthTest";
import { AnalyticsErrorBoundary } from "./AnalyticsErrorBoundary";
import { logError, logInfo, logWarn } from "@/lib/utils/logger";

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        // Only initialize on client side
        if (typeof window === "undefined") {
          return;
        }

        // Check for required environment variables
        const apiKey = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
        if (!apiKey || apiKey === "your_posthog_api_key_here") {
          if (process.env.NODE_ENV === "development") {
            logWarn(
              "⚠️ PostHog API key not configured. Add NEXT_PUBLIC_POSTHOG_KEY to .env.local"
            );
          }
          // Do not block the app
          return;
        }

        // Initialize telemetry
        initTelemetry({
          debugMode: process.env.NODE_ENV === "development",
        });

        // Run health check in development only
        if (process.env.NODE_ENV === "development") {
          // Wait for PostHog to initialize before health check
          setTimeout(async () => {
            try {
              const isHealthy = await quickHealthCheck();
              if (isHealthy) {
                logInfo("🎉 PostHog Health Check: All systems operational");
              } else {
                logWarn(
                  "⚠️ PostHog Health Check: Issues detected. Visit /health for details"
                );
              }
            } catch (error) {
              logWarn("⚠️ PostHog Health Check failed:", error);
            }
          }, 1000);
        }

        // Initialization finished
      } catch (error) {
        logError("❌ Failed to initialize PostHog:", error);
        setHasError(true);
        // Don't block the app
      }
    };

    initializeAnalytics();
  }, []);

  // Don't block rendering while initializing
  if (hasError && process.env.NODE_ENV === "development") {
    logWarn("PostHog encountered an error but app will continue");
  }

  return <AnalyticsErrorBoundary>{children}</AnalyticsErrorBoundary>;
}
