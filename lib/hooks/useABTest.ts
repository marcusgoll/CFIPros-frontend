/**
 * React hook for A/B testing
 * Manages variant assignment and tracking
 */

import { useState, useEffect, useMemo } from "react";
import { telemetry, ABTest, ABTestVariant } from "@/lib/analytics/telemetry";
import { logWarn } from "@/lib/utils/logger";

export interface UseABTestResult {
  variant: ABTestVariant | null;
  isLoading: boolean;
  trackConversion: (conversionType: string) => void;
}

/**
 * Hook for managing A/B tests in components
 * @param test - The A/B test configuration
 * @returns The assigned variant and helper functions
 */
export function useABTest(test: ABTest): UseABTestResult {
  // Use fallback variant (control) to prevent hydration mismatch
  const fallbackVariant: ABTestVariant = useMemo(
    () => test.variants[0] ?? { id: "control", name: "Control", weight: 1 },
    [test.variants]
  );
  const [variant, setVariant] = useState<ABTestVariant | null>(fallbackVariant);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true);

    // Only run on client side after hydration
    if (typeof window === "undefined") {
      setVariant(fallbackVariant);
      setIsLoading(false);
      return;
    }

    // Check if test is active
    if (!test.isActive) {
      setVariant(fallbackVariant);
      setIsLoading(false);
      return;
    }

    // Check date range if specified
    const now = new Date();
    if (test.startDate && now < test.startDate) {
      setVariant(fallbackVariant);
      setIsLoading(false);
      return;
    }
    if (test.endDate && now > test.endDate) {
      setVariant(fallbackVariant);
      setIsLoading(false);
      return;
    }

    // Get assigned variant only after hydration
    try {
      const assignedVariant = telemetry.getABTestVariant(test);
      setVariant(assignedVariant);
    } catch (error) {
      logWarn("A/B test variant assignment failed:", error);
      setVariant(fallbackVariant);
    } finally {
      setIsLoading(false);
    }
  }, [test, fallbackVariant]);

  const trackConversion = (conversionType: string) => {
    if (isHydrated && variant) {
      telemetry.trackABTestConversion(test.id, variant.id, conversionType);
    }
  };

  return {
    variant: isHydrated ? variant : fallbackVariant,
    isLoading,
    trackConversion,
  };
}

/**
 * Hook for simple boolean A/B tests
 * @param testId - Unique identifier for the test
 * @param trafficSplit - Percentage of traffic for variant B (0-100)
 * @returns true for variant B, false for variant A (control)
 */
export function useSimpleABTest(
  testId: string,
  trafficSplit: number = 50
): boolean {
  const test: ABTest = {
    id: testId,
    name: testId,
    isActive: true,
    variants: [
      { id: "control", name: "Control", weight: (100 - trafficSplit) / 100 },
      { id: "variant", name: "Variant", weight: trafficSplit / 100 },
    ],
  };

  const { variant } = useABTest(test);
  return variant?.id === "variant";
}

/**
 * Predefined A/B tests for hero section
 */
export const heroABTests = {
  headline: {
    id: "hero_headline_test",
    name: "Hero Headline Test",
    isActive: true,
    variants: [
      {
        id: "pass_first_try",
        name: "Pass Your Checkride on the First Try",
        weight: 0.5,
      },
      {
        id: "stop_failing",
        name: "Stop Failing Checkrides Due to Poor Preparation",
        weight: 0.5,
      },
    ],
  },
  cta: {
    id: "hero_cta_test",
    name: "Hero CTA Test",
    isActive: true,
    variants: [
      {
        id: "get_study_plan",
        name: "Get My Study Plan Now",
        weight: 0.33,
      },
      {
        id: "analyze_results",
        name: "Analyze My Test Results",
        weight: 0.33,
      },
      {
        id: "start_free",
        name: "Start Free Analysis",
        weight: 0.34,
      },
    ],
  },
  social_proof: {
    id: "hero_social_proof_test",
    name: "Hero Social Proof Test",
    isActive: true,
    variants: [
      {
        id: "with_users",
        name: "Show user count",
        weight: 0.5,
      },
      {
        id: "without_users",
        name: "Hide user count",
        weight: 0.5,
      },
    ],
  },
};
