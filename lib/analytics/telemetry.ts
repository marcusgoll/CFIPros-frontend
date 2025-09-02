/**
 * Telemetry and Analytics System for CFIPros
 * Integrated with PostHog for tracking user interactions, conversions, and A/B test performance
 */

import posthog from "posthog-js";
import { logError, logInfo, logWarn } from "@/lib/utils/logger";

export type EventName =
  | "hero_view"
  | "hero_cta_click"
  | "hero_scroll_depth"
  | "hero_time_on_page"
  | "conversion_start"
  | "conversion_complete"
  | "ab_test_impression"
  | "ab_test_conversion"
  | "feature_spotlight_click"
  | "feature_preview_video"
  | "benefit_section_view"
  | "benefit_feature_interaction"
  | "pricing_plan_select"
  | "pricing_toggle_billing"
  | "image_load_failed"
  | "video_preload_failed"
  | "video_load_failed"
  | "upload_started"
  | "upload_completed"
  | "upload_failed"
  | "upload_file_added"
  | "upload_file_removed"
  | "upload_validation_error"
  | "extractor_validation_error"
  | "extractor_upload_started"
  | "batch_upload_started"
  | "batch_upload_accepted"
  | "batch_upload_failed"
  | "batch_status_requested"
  | "batch_status_success"
  | "batch_status_failed"
  | "batch_export_requested"
  | "batch_export_success"
  | "batch_export_failed"
  | "batch_audit_requested"
  | "batch_audit_success"
  | "batch_audit_failed"
  | "batch_audit_export_requested"
  | "batch_audit_export_success"
  | "batch_audit_export_failed"
  | "batch_sharing_list_requested"
  | "batch_sharing_update_requested"
  | "batch_sharing_revoke_requested"
  | "batch_sharing_success"
  | "batch_sharing_failed"
  | "batch_consent_list_requested"
  | "batch_consent_granted"
  | "batch_consent_revoked"
  | "batch_consent_success"
  | "batch_consent_failed"
  | "extractor_upload_success"
  | "extractor_upload_failed"
  | "extractor_results_viewed"
  | "extractor_results_error"
  | "result_claim_attempted"
  | "result_claimed"
  | "result_claim_failed"
  | "results_viewed"
  | "results_shared"
  | "email_captured"
  | "email_capture_success"
  | "email_capture_failed"
  // Dashboard events
  | "dashboard_viewed"
  | "click_quick_tool"
  | "open_report"
  | "start_flashcards"
  | "start_lesson"
  | "upgrade_click"
  | "buy_credits_click"
  | "open_student_folder";

export interface TelemetryEvent {
  name: EventName;
  properties?: Record<string, unknown>;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-1 for traffic split
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

class TelemetryService {
  private static instance: TelemetryService;
  private events: TelemetryEvent[] = [];
  private sessionId: string;
  private isInitialized = false;
  private debugMode = process.env["NODE_ENV"] === "development";

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  initialize(config?: { debugMode?: boolean; apiKey?: string; apiHost?: string }) {
    if (this.isInitialized) {
      return;
    }

    this.debugMode = config?.debugMode ?? this.debugMode;

    if (typeof window !== "undefined") {
      const apiKey = config?.apiKey || process.env["NEXT_PUBLIC_POSTHOG_KEY"];
      const apiHost =
        config?.apiHost || process.env["NEXT_PUBLIC_POSTHOG_HOST"] || "https://app.posthog.com";

      if (apiKey && apiKey !== "your_posthog_api_key_here") {
        try {
          posthog.init(apiKey, {
            api_host: apiHost,
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: false,
            persistence: "localStorage",
            loaded: (ph) => {
              if (this.debugMode) {
                logInfo("PostHog initialized successfully", {
                  sessionId: ph.get_session_id(),
                  distinctId: ph.get_distinct_id(),
                });
              }
            },
          });
          this.sessionId = posthog.get_session_id() || this.sessionId;
        } catch (error) {
          if (this.debugMode) {
            logError("PostHog initialization failed:", error);
          }
        }
      } else {
        if (this.debugMode) {
          logWarn("PostHog API key not configured. Add NEXT_PUBLIC_POSTHOG_KEY to .env.local");
          logInfo('Instructions: Replace "your_posthog_api_key_here" with your actual PostHog API key');
        }
      }
    }

    this.isInitialized = true;
    this.setupVisibilityTracking();
    this.setupScrollTracking();

    if (this.debugMode) {
      logInfo("Telemetry initialized", {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  track(name: EventName, properties?: Record<string, unknown>) {
    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };
    const uid = this.getUserId();
    if (uid) {
      event.userId = uid;
    }
    if (properties) {
      event.properties = properties;
    }

    this.events.push(event);

    if (this.isPostHogReady()) {
      try {
        posthog.capture(name, {
          ...properties,
          sessionId: this.sessionId,
          timestamp: event.timestamp,
        });
      } catch (error) {
        if (this.debugMode) {
          logWarn("Failed to send event to PostHog:", error);
        }
      }
    }

    if (this.debugMode) {
      logInfo("Event tracked:", event);
    }
  }

  trackHeroCTAClick(ctaText: string, variant?: string) {
    this.track("hero_cta_click", {
      ctaText,
      variant: variant || "default",
      pageUrl: window.location.href,
      referrer: document.referrer,
      timeOnPage: this.getTimeOnPage(),
      scrollDepth: this.getScrollDepth(),
    });
  }

  trackUploadStarted(files: File[]) {
    const fileTypes = [...new Set(files.map((f) => f.type))];
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    this.track("upload_started", {
      fileCount: files.length,
      totalSize,
      fileTypes,
      averageFileSize: totalSize / files.length,
    });
  }

  trackUploadCompleted(files: File[], processingTime: number) {
    this.track("upload_completed", { fileCount: files.length, processingTime, success: true });
  }

  trackUploadFailed(files: File[], error: string) {
    this.track("upload_failed", { fileCount: files.length, error, success: false });
  }

  trackFileAdded(file: File) {
    this.track("upload_file_added", { fileName: file.name, fileSize: file.size, fileType: file.type });
  }

  trackFileRemoved(file: File) {
    this.track("upload_file_removed", { fileName: file.name, fileSize: file.size, fileType: file.type });
  }

  trackValidationError(error: string, files?: File[]) {
    this.track("upload_validation_error", {
      error,
      fileCount: files?.length || 0,
      fileTypes: files ? [...new Set(files.map((f) => f.type))] : [],
    });
  }

  trackABTestImpression(testId: string, variantId: string) {
    this.track("ab_test_impression", { testId, variantId, timestamp: Date.now() });
  }

  trackABTestConversion(testId: string, variantId: string, conversionType: string) {
    this.track("ab_test_conversion", { testId, variantId, conversionType, timestamp: Date.now() });
  }

  getABTestVariant(test: ABTest): ABTestVariant {
    if (typeof window !== "undefined" && posthog) {
      const flagValue = posthog.getFeatureFlag(test.id);
      if (flagValue) {
        const variant = test.variants.find((v) => v.id === flagValue);
        if (variant) {
          this.trackABTestImpression(test.id, variant.id);
          return variant;
        }
      }
    }
    const storedVariant = this.getStoredVariant(test.id);
    if (storedVariant) {
      return storedVariant;
    }

    const random = Math.random();
    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        this.storeVariant(test.id, variant);
        this.trackABTestImpression(test.id, variant.id);
        if (typeof window !== "undefined" && posthog) {
          posthog.people.set({ [`ab_test_${test.id}`]: variant.id });
        }
        return variant;
      }
    }
    const fallback: ABTestVariant = test.variants[0] ?? { id: "control", name: "Control", weight: 1 };
    this.storeVariant(test.id, fallback);
    return fallback;
  }

  private isPostHogReady(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof posthog !== "undefined" &&
      ((posthog as unknown as { __loaded?: boolean }).__loaded === true) &&
      this.isInitialized
    );
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    return undefined;
  }

  private getTimeOnPage(): number {
    return Date.now() - (window.performance?.timing?.navigationStart || Date.now());
  }

  private getScrollDepth(): number {
    const scrolled = window.scrollY;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    return Math.round((scrolled / (documentHeight - viewportHeight)) * 100);
  }

  private setupVisibilityTracking() {
    let startTime = Date.now();
    let totalTime = 0;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        totalTime += Date.now() - startTime;
        startTime = Date.now();
      } else {
        startTime = Date.now();
      }
    });
    window.addEventListener("beforeunload", () => {
      if (!document.hidden) {
        totalTime += Date.now() - startTime;
      }
      this.track("hero_time_on_page", { duration: totalTime });
    });
  }

  private setupScrollTracking() {
    let maxScroll = 0;
    const trackScroll = () => {
      const currentScroll = this.getScrollDepth();
      if (currentScroll > maxScroll) {
        maxScroll = currentScroll;
        if (maxScroll >= 25 && maxScroll < 50) {
          this.track("hero_scroll_depth", { depth: 25 });
        } else if (maxScroll >= 50 && maxScroll < 75) {
          this.track("hero_scroll_depth", { depth: 50 });
        } else if (maxScroll >= 75 && maxScroll < 100) {
          this.track("hero_scroll_depth", { depth: 75 });
        } else if (maxScroll >= 100) {
          this.track("hero_scroll_depth", { depth: 100 });
        }
      }
    };
    window.addEventListener("scroll", trackScroll, { passive: true });
  }

  identify(userId: string, traits?: Record<string, unknown>) {
    if (typeof window !== "undefined" && posthog) {
      posthog.identify(userId, traits);
    }
  }

  reset() {
    if (typeof window !== "undefined" && posthog) {
      posthog.reset();
    }
    this.sessionId = this.generateSessionId();
  }

  private getStoredVariant(testId: string): ABTestVariant | null {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = localStorage.getItem(`ab_test_${testId}`);
    return stored ? JSON.parse(stored) : null;
  }

  private storeVariant(testId: string, variant: ABTestVariant) {
    if (typeof window !== "undefined") {
      localStorage.setItem(`ab_test_${testId}`, JSON.stringify(variant));
    }
  }

  getEvents(): TelemetryEvent[] {
    return this.events;
  }

  clearEvents() {
    this.events = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("telemetry_events");
    }
  }
}

export const telemetry = TelemetryService.getInstance();

export const trackEvent = (name: EventName, properties?: Record<string, unknown>) => {
  telemetry.track(name, properties);
};

export const trackHeroCTA = (ctaText: string, variant?: string) => {
  telemetry.trackHeroCTAClick(ctaText, variant);
};

export const trackUploadStarted = (files: File[]) => {
  telemetry.trackUploadStarted(files);
};

export const trackUploadCompleted = (files: File[], processingTime: number) => {
  telemetry.trackUploadCompleted(files, processingTime);
};

export const trackUploadFailed = (files: File[], error: string) => {
  telemetry.trackUploadFailed(files, error);
};

export const trackFileAdded = (file: File) => {
  telemetry.trackFileAdded(file);
};

export const trackFileRemoved = (file: File) => {
  telemetry.trackFileRemoved(file);
};

export const trackValidationError = (error: string, files?: File[]) => {
  telemetry.trackValidationError(error, files);
};

export const initTelemetry = (config?: { debugMode?: boolean }) => {
  telemetry.initialize(config);
};
