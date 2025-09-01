"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/telemetry";

export function DashboardAnalyticsClient() {
  useEffect(() => {
    trackEvent("dashboard_viewed");
  }, []);
  return null;
}
