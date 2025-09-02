"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ArrowRightCircle,
  Info,
  Sparkles,
  Users,
  CreditCard,
  Building2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/telemetry";
import { cn } from "@/lib/utils";
import ErrorBoundary, {
  FeatureTableErrorFallback,
} from "@/components/common/ErrorBoundary";
import {
  PRICING_TIERS,
  CREDIT_SERVICES,
  WHITE_LABEL_ADDON,
  FEATURE_COMPARISON_DATA,
  ANIMATION_CONSTANTS,
  type PricingTier,
} from "@/lib/data/pricingData";
import styles from "./PricingSection.module.css";

// All data imports are now handled via the pricingData module

// Icon mapping utility
const iconMap = {
  Sparkles,
  Users,
  CreditCard,
  Building2,
  Zap,
};

const renderIcon = (iconName?: string, className = "h-5 w-5") => {
  if (!iconName) {
    return null;
  }
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className={className} /> : null;
};

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showComparison, setShowComparison] = useState(false);

  const handlePlanSelect = useCallback((planId: string, billing: string) => {
    trackEvent("pricing_plan_select", {
      plan: planId,
      billing_period: billing,
      section: "pricing",
    });
  }, []);

  const handleToggleBilling = useCallback(
    (period: "monthly" | "yearly") => {
      if (period !== billingPeriod) {
        setBillingPeriod(period);
        trackEvent("pricing_toggle_billing", {
          from: billingPeriod,
          to: period,
        });
      }
    },
    [billingPeriod]
  );

  const calculatePrice = (tier: PricingTier) => {
    if (billingPeriod === "yearly" && tier.yearlyPrice !== undefined) {
      return typeof tier.yearlyPrice === "number"
        ? `$${tier.yearlyPrice}`
        : tier.yearlyPrice;
    }
    return typeof tier.monthlyPrice === "number" && tier.monthlyPrice > 0
      ? `$${tier.monthlyPrice}`
      : tier.monthlyPrice === 0
        ? "$0"
        : tier.monthlyPrice;
  };

  // Memoize calculateSavings function result to prevent unnecessary recalculations
  const calculateSavings = useCallback((tier: PricingTier) => {
    if (
      typeof tier.monthlyPrice === "number" &&
      typeof tier.yearlyPrice === "number" &&
      tier.monthlyPrice > 0
    ) {
      const monthlyCost = tier.monthlyPrice * 12;
      const savings = monthlyCost - tier.yearlyPrice;
      const percentage = Math.round((savings / monthlyCost) * 100);
      return { amount: savings, percentage };
    }
    return null;
  }, []);

  // Memoize savings calculations for all tiers
  const tierSavings = useMemo(() => {
    return PRICING_TIERS.reduce(
      (acc, tier) => {
        acc[tier.id] = calculateSavings(tier);
        return acc;
      },
      {} as Record<string, { amount: number; percentage: number } | null>
    );
  }, [calculateSavings]);

  return (
    <section id="pricing" className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Choose Your Flight Training Plan
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            From free tools to comprehensive school management - we have the
            perfect plan for every pilot and flight training organization
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-lg border bg-background p-1">
            <Button
              variant={billingPeriod === "monthly" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleToggleBilling("monthly")}
              className="relative"
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === "yearly" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleToggleBilling("yearly")}
              className="relative"
            >
              Yearly
              {billingPeriod === "yearly" && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">
                  Save up to 45%
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Pricing Tiers */}
        <div className="mb-16 mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="wait">
            {PRICING_TIERS.map((tier, i) => {
              const savings = tierSavings[tier.id];
              return (
                <motion.div
                  key={`${tier.id}-${billingPeriod}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * ANIMATION_CONSTANTS.STAGGER_DELAY }}
                  className={cn(
                    "relative",
                    tier.highlight && "z-10 lg:scale-105"
                  )}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute -top-4 left-0 right-0 z-20 flex justify-center">
                      <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground shadow-sm">
                        {renderIcon(tier.icon, "h-3 w-3")}
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "h-full rounded-xl p-6 transition-all hover:shadow-lg",
                      tier.highlight
                        ? "glass from-primary/5 to-accent/5 border-primary bg-gradient-to-br shadow-xl"
                        : "card-premium"
                    )}
                  >
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="mb-2 flex items-center gap-2">
                          {renderIcon(tier.icon)}
                          <h3 className="text-xl font-semibold">{tier.name}</h3>
                        </div>
                        {tier.subtitle && (
                          <p className="text-sm text-muted-foreground">
                            {tier.subtitle}
                          </p>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {calculatePrice(tier)}
                        </span>
                        {tier.monthlyPrice !== 0 && (
                          <span className="text-muted-foreground">
                            {billingPeriod === "yearly" ? "/year" : tier.period}
                          </span>
                        )}
                      </div>

                      {/* Savings indicator */}
                      {billingPeriod === "yearly" && savings && (
                        <p className="mt-2 text-sm text-primary">
                          Save ${savings.amount} ({savings.percentage}%)
                        </p>
                      )}

                      <p className="mt-3 text-xs text-muted-foreground">
                        {tier.description}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mb-6 space-y-3">
                      {tier.features.slice(0, 6).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      {tier.features.length > 6 && (
                        <li className="text-sm text-muted-foreground">
                          +{tier.features.length - 6} more features
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <Link href={tier.ctaLink || "#"}>
                      <Button
                        variant={tier.highlight ? "primary" : "outline"}
                        className="w-full"
                        onClick={() => handlePlanSelect(tier.id, billingPeriod)}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">Pay-as-you-go Credits</h3>
            </div>
            <p className="text-muted-foreground">
              For one-time services that require specialized processing
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CREDIT_SERVICES.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * ANIMATION_CONSTANTS.STAGGER_DELAY }}
                viewport={{ once: true }}
                className={cn(
                  "card-premium relative p-5 text-center",
                  service.popular && "border-primary/50"
                )}
              >
                {service.popular && (
                  <div className="absolute -top-2 right-4">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                )}
                <h4 className="mb-2 text-base font-semibold">{service.name}</h4>
                {service.description && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {service.description}
                  </p>
                )}
                <div className="mb-2 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold">{service.price}</span>
                  <span className="text-sm text-muted-foreground">
                    / {service.unit}
                  </span>
                </div>
                {service.margin && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    {service.margin}
                  </p>
                )}
                {service.addon && (
                  <p className="text-xs font-medium text-primary">
                    {service.addon}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* White Label Add-On */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex justify-center"
        >
          <div className="w-full max-w-4xl">
            <div className="from-primary/10 to-accent/10 rounded-xl bg-gradient-to-r p-8">
              <div className="flex items-start gap-4">
                <Building2 className="mt-1 h-8 w-8 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-bold">
                    {WHITE_LABEL_ADDON.name}
                  </h3>
                  <p className="mb-4 text-muted-foreground">
                    Perfect for flight schools wanting their own branded
                    platform
                  </p>

                  <div className="mb-6 grid gap-4 md:grid-cols-2">
                    {WHITE_LABEL_ADDON.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-2xl font-bold">
                        $
                        {billingPeriod === "yearly"
                          ? WHITE_LABEL_ADDON.yearlyPrice
                          : WHITE_LABEL_ADDON.monthlyPrice}
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        /{billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    <Link href="/contact-sales?addon=white-label">
                      <Button variant="outline" size="sm">
                        Learn More
                        <ArrowRightCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comparison Table Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="hover:text-primary/80 inline-flex items-center gap-2 text-primary transition-colors"
          >
            <Info className="h-4 w-4" />
            {showComparison ? "Hide" : "Show"} detailed feature comparison
          </button>
        </motion.div>

        {/* Feature Comparison Table (Optional) */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: ANIMATION_CONSTANTS.DURATION_SLOW / 1000,
              }}
              className="mt-12"
            >
              <ErrorBoundary fallback={FeatureTableErrorFallback}>
                <FeatureComparisonTable tiers={PRICING_TIERS} />
              </ErrorBoundary>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FeatureComparisonTable({ tiers }: { tiers: PricingTier[] }) {
  const allFeatures = FEATURE_COMPARISON_DATA;

  const renderValue = (value: unknown) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="mx-auto h-5 w-5 text-primary" />
      ) : (
        <X className="mx-auto h-5 w-5 text-muted-foreground" />
      );
    }
    return <span className="text-sm">{String(value)}</span>;
  };

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Info className="mr-1 inline h-3 w-3" />
          Hover over feature names for detailed descriptions
        </p>
      </div>
      <div className="w-full">
        <table
          className={cn(styles["comparisonTable"], "w-full border-collapse")}
        >
          <thead>
            <tr>
              <th className="p-4 text-left font-semibold" id="features-column">
                Features
              </th>
              {tiers.map((tier) => (
                <th key={tier.id} className="p-4 text-center font-semibold">
                  <div>
                    {tier.name}
                    {tier.subtitle && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {tier.subtitle}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allFeatures.map((category) => (
              <React.Fragment key={category.category}>
                <tr className={styles["categoryHeader"]}>
                  <td
                    colSpan={5}
                    className="border-b border-t p-4 text-lg font-semibold text-foreground"
                  >
                    {category.category}
                  </td>
                </tr>
                {category.features.map((feature) => (
                  <tr key={feature.name} className="border-border/50 border-b">
                    <td className="p-3 text-sm">
                      <div
                        className={styles["featureCell"]}
                        aria-describedby={`tooltip-${feature.name.replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        <span>{feature.name}</span>
                        <Info className="h-3 w-3 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                        <div
                          id={`tooltip-${feature.name.replace(/\s+/g, "-").toLowerCase()}`}
                          className={cn(styles["featureTooltip"])}
                          role="tooltip"
                          aria-hidden="true"
                        >
                          {feature.description}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {renderValue(feature.free)}
                    </td>
                    <td className="p-3 text-center">
                      {renderValue(feature.pro)}
                    </td>
                    <td className="p-3 text-center">
                      {renderValue(feature.cfi)}
                    </td>
                    <td className="p-3 text-center">
                      {renderValue(feature.school)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
