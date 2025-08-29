'use client';

import { useEffect } from 'react';
import { initTelemetry } from '@/lib/analytics/telemetry';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize telemetry when the app loads
    initTelemetry({
      debugMode: process.env.NODE_ENV === 'development'
    });
  }, []);

  return <>{children}</>;
}