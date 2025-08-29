/**
 * Telemetry and Analytics System for CFIPros
 * Integrated with PostHog for tracking user interactions, conversions, and A/B test performance
 */

import posthog from 'posthog-js';

export type EventName = 
  | 'hero_view'
  | 'hero_cta_click'
  | 'hero_scroll_depth'
  | 'hero_time_on_page'
  | 'conversion_start'
  | 'conversion_complete'
  | 'ab_test_impression'
  | 'ab_test_conversion'
  | 'feature_spotlight_click'
  | 'feature_preview_video'
  | 'benefit_section_view'
  | 'benefit_feature_interaction'
  | 'pricing_plan_select'
  | 'pricing_toggle_billing';

export interface TelemetryEvent {
  name: EventName;
  properties?: Record<string, any>;
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
  private debugMode = process.env.NODE_ENV === 'development';

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Initialize telemetry with PostHog configuration
   */
  initialize(config?: { 
    debugMode?: boolean;
    apiKey?: string;
    apiHost?: string;
  }) {
    if (this.isInitialized) return;
    
    this.debugMode = config?.debugMode ?? this.debugMode;
    
    // Initialize PostHog
    if (typeof window !== 'undefined') {
      const apiKey = config?.apiKey || process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const apiHost = config?.apiHost || process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
      
      if (apiKey && apiKey !== 'your_posthog_api_key_here') {
        try {
          posthog.init(apiKey, {
            api_host: apiHost,
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: false, // We'll manually track specific events
            session_recording: {
              enabled: false, // Enable when needed
            },
            persistence: 'localStorage',
            loaded: (posthog) => {
              if (this.debugMode) {
                console.log('🔍 PostHog initialized successfully', {
                  sessionId: posthog.get_session_id(),
                  distinctId: posthog.get_distinct_id()
                });
              }
            }
          });
          
          // Set session ID from PostHog
          this.sessionId = posthog.get_session_id() || this.sessionId;
        } catch (error) {
          if (this.debugMode) {
            console.error('❌ PostHog initialization failed:', error);
          }
        }
      } else {
        if (this.debugMode) {
          console.warn('⚠️ PostHog API key not configured. Add NEXT_PUBLIC_POSTHOG_KEY to .env.local');
          console.log('📝 Instructions: Replace "your_posthog_api_key_here" with your actual PostHog API key');
        }
      }
    }
    
    this.isInitialized = true;
    
    // Set up page visibility tracking
    this.setupVisibilityTracking();
    
    // Set up scroll depth tracking
    this.setupScrollTracking();
    
    if (this.debugMode) {
      console.log('🔍 Telemetry initialized', {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track a telemetry event with PostHog
   */
  track(name: EventName, properties?: Record<string, any>) {
    const event: TelemetryEvent = {
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.getUserId()
    };

    this.events.push(event);
    
    // Send to PostHog with proper safety checks
    if (this.isPostHogReady()) {
      try {
        posthog.capture(name, {
          ...properties,
          sessionId: this.sessionId,
          timestamp: event.timestamp
        });
      } catch (error) {
        if (this.debugMode) {
          console.warn('Failed to send event to PostHog:', error);
        }
      }
    }
    
    if (this.debugMode) {
      console.log('📊 Event tracked:', event);
    }
  }

  /**
   * Track hero CTA click with conversion intent
   */
  trackHeroCTAClick(ctaText: string, variant?: string) {
    this.track('hero_cta_click', {
      ctaText,
      variant: variant || 'default',
      pageUrl: window.location.href,
      referrer: document.referrer,
      timeOnPage: this.getTimeOnPage(),
      scrollDepth: this.getScrollDepth()
    });
  }

  /**
   * Track A/B test impression
   */
  trackABTestImpression(testId: string, variantId: string) {
    this.track('ab_test_impression', {
      testId,
      variantId,
      timestamp: Date.now()
    });
  }

  /**
   * Track A/B test conversion
   */
  trackABTestConversion(testId: string, variantId: string, conversionType: string) {
    this.track('ab_test_conversion', {
      testId,
      variantId,
      conversionType,
      timestamp: Date.now()
    });
  }

  /**
   * Get user's assigned variant for an A/B test
   * Uses PostHog's feature flags if available, falls back to local assignment
   */
  getABTestVariant(test: ABTest): ABTestVariant {
    // Check if PostHog feature flag exists for this test
    if (typeof window !== 'undefined' && posthog) {
      const flagValue = posthog.getFeatureFlag(test.id);
      if (flagValue) {
        const variant = test.variants.find(v => v.id === flagValue);
        if (variant) {
          this.trackABTestImpression(test.id, variant.id);
          return variant;
        }
      }
    }
    
    // Check if user already has a variant assigned locally
    const storedVariant = this.getStoredVariant(test.id);
    if (storedVariant) {
      return storedVariant;
    }

    // Assign variant based on weights
    const random = Math.random();
    let cumulative = 0;
    
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        this.storeVariant(test.id, variant);
        this.trackABTestImpression(test.id, variant.id);
        
        // Set as PostHog property for future tracking
        if (typeof window !== 'undefined' && posthog) {
          posthog.people.set({ [`ab_test_${test.id}`]: variant.id });
        }
        
        return variant;
      }
    }

    // Fallback to first variant
    const fallback = test.variants[0];
    this.storeVariant(test.id, fallback);
    return fallback;
  }

  /**
   * Check if PostHog is ready and available
   */
  private isPostHogReady(): boolean {
    return typeof window !== 'undefined' && 
           typeof posthog !== 'undefined' && 
           posthog.__loaded === true &&
           this.isInitialized;
  }

  /**
   * Private helper methods
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    // Implement user ID retrieval from auth system
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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        totalTime += Date.now() - startTime;
      } else {
        startTime = Date.now();
      }
    });

    // Track time on page when user leaves
    window.addEventListener('beforeunload', () => {
      if (!document.hidden) {
        totalTime += Date.now() - startTime;
      }
      this.track('hero_time_on_page', { duration: totalTime });
    });
  }

  private setupScrollTracking() {
    let maxScroll = 0;
    
    const trackScroll = () => {
      const currentScroll = this.getScrollDepth();
      if (currentScroll > maxScroll) {
        maxScroll = currentScroll;
        
        // Track milestone scroll depths
        if (maxScroll >= 25 && maxScroll < 50) {
          this.track('hero_scroll_depth', { depth: 25 });
        } else if (maxScroll >= 50 && maxScroll < 75) {
          this.track('hero_scroll_depth', { depth: 50 });
        } else if (maxScroll >= 75 && maxScroll < 100) {
          this.track('hero_scroll_depth', { depth: 75 });
        } else if (maxScroll >= 100) {
          this.track('hero_scroll_depth', { depth: 100 });
        }
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });
  }

  /**
   * Set user identity for tracking
   */
  identify(userId: string, traits?: Record<string, any>) {
    if (typeof window !== 'undefined' && posthog) {
      posthog.identify(userId, traits);
    }
  }

  /**
   * Reset user identity (for logout)
   */
  reset() {
    if (typeof window !== 'undefined' && posthog) {
      posthog.reset();
    }
    this.sessionId = this.generateSessionId();
  }

  private getStoredVariant(testId: string): ABTestVariant | null {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(`ab_test_${testId}`);
    return stored ? JSON.parse(stored) : null;
  }

  private storeVariant(testId: string, variant: ABTestVariant) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ab_test_${testId}`, JSON.stringify(variant));
    }
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): TelemetryEvent[] {
    return this.events;
  }

  /**
   * Clear all events (for debugging)
   */
  clearEvents() {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('telemetry_events');
    }
  }
}

// Export singleton instance
export const telemetry = TelemetryService.getInstance();

// Export convenience functions
export const trackEvent = (name: EventName, properties?: Record<string, any>) => {
  telemetry.track(name, properties);
};

export const trackHeroCTA = (ctaText: string, variant?: string) => {
  telemetry.trackHeroCTAClick(ctaText, variant);
};

export const initTelemetry = (config?: { debugMode?: boolean }) => {
  telemetry.initialize(config);
};