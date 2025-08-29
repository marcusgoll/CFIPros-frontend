"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  ArrowRightCircle, 
  Sparkles, 
  Info,
  Building2,
  CreditCard,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics/telemetry";
import { cn } from "@/lib/utils";

interface PricingTier {
  id: string;
  name: string;
  subtitle?: string;
  monthlyPrice: string | number;
  yearlyPrice?: string | number;
  period: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  ctaLink?: string;
  highlight?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

interface CreditService {
  name: string;
  price: string;
  unit: string;
  description?: string;
  margin?: string;
  addon?: string;
  popular?: boolean;
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    period: "forever",
    description: "Perfect for trying out our tools",
    features: [
      "Try all mini tools (daily limits)",
      "Preview personalized study plans",
      "Save up to 3 analysis results",
      "Basic logbook compliance checks",
      "ACS reference database access",
      "Community support forum"
    ],
    limitations: [
      "Daily usage limits",
      "No advanced features",
      "Limited storage"
    ],
    cta: "Get Started Free",
    ctaLink: "/signup?plan=free",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Individual Pilot",
    monthlyPrice: 15,
    yearlyPrice: 99,
    period: "/month",
    description: "Everything you need to pass your checkride",
    features: [
      "Unlimited daily tools (W&B, Crosswind, AKTR→ACS)",
      "Currency tracking (Night/IFR requirements)",
      "8710 eligibility checker & hour reconciliation",
      "Adaptive flashcards & unlimited practice tests",
      "CFI-AI tutor with official ACS citations",
      "Credits for OCR & audit services",
      "Professional exports (no watermarks)",
      "Priority email support"
    ],
    cta: "Start 14-Day Free Trial",
    ctaLink: "/signup?plan=pro",
    highlight: true,
    badge: "Most Popular",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: "cfi",
    name: "CFI",
    subtitle: "Instructor",
    monthlyPrice: 39,
    yearlyPrice: 399,
    period: "/month",
    description: "Manage students & grow your instruction business",
    features: [
      "Everything in Pro, plus:",
      "Student progress dashboards & readiness scores",
      "Complete endorsement library (FAR 61.x)",
      "3 comprehensive logbook audits included/month",
      "Weather-backup lesson plan generator",
      "CFI billing tracker & timesheet export",
      "Stage check & progress check tools",
      "Student portfolio management",
      "Customizable lesson templates",
      "Priority phone & email support"
    ],
    cta: "Start CFI Free Trial",
    ctaLink: "/signup?plan=cfi",
    highlight: false,
    icon: <Users className="h-5 w-5" />
  },
  {
    id: "school",
    name: "School",
    subtitle: "Part 61/141",
    monthlyPrice: 299,
    yearlyPrice: 2999,
    period: "/month",
    description: "Complete training management for flight schools",
    features: [
      "Everything in CFI, plus:",
      "Up to 10 instructor accounts included",
      "Cohort analytics & fleet readiness tracking",
      "DPE scheduling alerts & examiner insights",
      "Insurance compliance & currency tracking",
      "Multi-instructor coordination dashboard",
      "White-label branding available (+$199/mo)",
      "API access for school management systems",
      "Personalized onboarding & training",
      "Dedicated customer success manager"
    ],
    cta: "Schedule Demo",
    ctaLink: "/contact-sales?plan=school",
    highlight: false,
    badge: "Enterprise",
    icon: <Building2 className="h-5 w-5" />
  },
];

const CREDIT_SERVICES: CreditService[] = [
  {
    name: "Logbook OCR Processing",
    price: "$15",
    unit: "50 pages",
    description: "Convert paper logbooks to digital format instantly",
    margin: "≥70% accuracy guaranteed",
    popular: true
  },
  {
    name: "Complete Checkride Audit",
    price: "$49",
    unit: "comprehensive review",
    description: "Full IACRA readiness & compliance verification",
    addon: "Human CFI Review +$49",
    popular: true
  },
  {
    name: "Bulk Import Service",
    price: "$25",
    unit: "100 flight entries",
    description: "Import from ForeFlight, LogTen Pro, or any CSV"
  },
  {
    name: "Custom Training Reports",
    price: "$35",
    unit: "detailed report",
    description: "School analytics, progress tracking, & insights"
  }
];

const WHITE_LABEL_ADDON = {
  name: "White-Label Add-On",
  monthlyPrice: 199,
  yearlyPrice: 1999,
  features: [
    "Your school's branding",
    "Custom domain (school.cfipros.com)",
    "Branded student portal",
    "Custom color scheme",
    "Remove CFIPros branding",
    "Marketing materials included"
  ],
  availableFor: ["school"]
};

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showComparison, setShowComparison] = useState(false);

  const handlePlanSelect = useCallback((planId: string, billing: string) => {
    trackEvent("pricing_plan_select", {
      plan: planId,
      billing_period: billing,
      section: "pricing"
    });
  }, []);

  const handleToggleBilling = useCallback((period: "monthly" | "yearly") => {
    if (period !== billingPeriod) {
      setBillingPeriod(period);
      trackEvent("pricing_toggle_billing", {
        from: billingPeriod,
        to: period
      });
    }
  }, [billingPeriod]);

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

  const calculateSavings = (tier: PricingTier) => {
    if (typeof tier.monthlyPrice === "number" && 
        typeof tier.yearlyPrice === "number" && 
        tier.monthlyPrice > 0) {
      const monthlyCost = tier.monthlyPrice * 12;
      const savings = monthlyCost - tier.yearlyPrice;
      const percentage = Math.round((savings / monthlyCost) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  return (
    <section id="pricing" className="py-20 relative">
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
            From free tools to comprehensive school management - we have the perfect plan for every pilot and flight training organization
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-2 p-1 rounded-lg border bg-background">
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
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full whitespace-nowrap">
                  Save up to 45%
                </span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Pricing Tiers */}
        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2 mb-16 mt-8">
          <AnimatePresence mode="wait">
            {PRICING_TIERS.map((tier, i) => {
              const savings = calculateSavings(tier);
              return (
                <motion.div
                  key={`${tier.id}-${billingPeriod}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative",
                    tier.highlight && "lg:scale-105 z-10"
                  )}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground flex items-center gap-1 shadow-sm">
                        {tier.icon}
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "h-full rounded-xl p-6 transition-all hover:shadow-lg",
                      tier.highlight
                        ? "glass border-primary shadow-xl bg-gradient-to-br from-primary/5 to-accent/5"
                        : "card-premium"
                    )}
                  >
                    <div className="mb-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {tier.icon}
                          <h3 className="text-xl font-semibold">{tier.name}</h3>
                        </div>
                        {tier.subtitle && (
                          <p className="text-sm text-muted-foreground">{tier.subtitle}</p>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{calculatePrice(tier)}</span>
                        {tier.monthlyPrice !== 0 && (
                          <span className="text-muted-foreground">
                            {billingPeriod === "yearly" ? "/year" : tier.period}
                          </span>
                        )}
                      </div>

                      {/* Savings indicator */}
                      {billingPeriod === "yearly" && savings && (
                        <p className="text-sm text-primary mt-2">
                          Save ${savings.amount} ({savings.percentage}%)
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-3">
                        {tier.description}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="mb-6 space-y-3">
                      {tier.features.slice(0, 6).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
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
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CreditCard className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold">Pay-as-you-go Credits</h3>
            </div>
            <p className="text-muted-foreground">
              For one-time services that require specialized processing
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {CREDIT_SERVICES.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={cn(
                  "card-premium p-5 text-center relative",
                  service.popular && "border-primary/50"
                )}
              >
                {service.popular && (
                  <div className="absolute -top-2 right-4">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                )}
                <h4 className="font-semibold text-base mb-2">{service.name}</h4>
                {service.description && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {service.description}
                  </p>
                )}
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-2xl font-bold">{service.price}</span>
                  <span className="text-sm text-muted-foreground">/ {service.unit}</span>
                </div>
                {service.margin && (
                  <p className="text-xs text-muted-foreground mb-2">{service.margin}</p>
                )}
                {service.addon && (
                  <p className="text-xs text-primary font-medium">{service.addon}</p>
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
            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 p-8">
              <div className="flex items-start gap-4">
                <Building2 className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {WHITE_LABEL_ADDON.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Perfect for flight schools wanting their own branded platform
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {WHITE_LABEL_ADDON.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-2xl font-bold">
                        ${billingPeriod === "yearly" ? WHITE_LABEL_ADDON.yearlyPrice : WHITE_LABEL_ADDON.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground ml-1">
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
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
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
              transition={{ duration: 0.3 }}
              className="mt-12"
            >
              <FeatureComparisonTable tiers={PRICING_TIERS} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FeatureComparisonTable({ tiers }: { tiers: PricingTier[] }) {
  const allFeatures = [
    { category: "Core Tools", features: [
      { name: "AKTR→ACS Mapper", description: "Map FAA test questions to specific ACS areas for targeted study", free: "3/day", pro: "Unlimited", cfi: "Unlimited", school: "Unlimited" },
      { name: "Crosswind Calculator", description: "Calculate crosswind components for runway planning and training", free: "5/day", pro: "Unlimited", cfi: "Unlimited", school: "Unlimited" },
      { name: "Weight & Balance", description: "Compute aircraft weight, CG, and loading for different configurations", free: "3/day", pro: "Unlimited", cfi: "Unlimited", school: "Unlimited" },
      { name: "Currency Trackers", description: "Track night, passenger, and instrument currency requirements automatically", free: false, pro: true, cfi: true, school: true },
      { name: "8710 Eligibility", description: "Verify eligibility requirements and totals reconciliation for certificates and ratings", free: false, pro: true, cfi: true, school: true },
    ]},
    { category: "Study Tools", features: [
      { name: "Practice Tests", description: "FAA-style practice exams with detailed explanations and ACS references", free: "Preview only", pro: "Full access", cfi: "Full access", school: "Full access" },
      { name: "SRS Flashcards", description: "Spaced repetition system flashcards that adapt to your learning progress", free: false, pro: true, cfi: true, school: true },
      { name: "CFI-AI Tutor", description: "AI-powered tutor with official ACS citations and personalized explanations", free: false, pro: true, cfi: true, school: true },
      { name: "Study Plans", description: "Personalized study plans based on your test results and weak areas", free: "Preview only", pro: "Customizable", cfi: "Customizable", school: "Customizable" },
    ]},
    { category: "Instructor Tools", features: [
      { name: "Student Management", description: "Organize student folders with progress tracking and readiness scores", free: false, pro: false, cfi: true, school: true },
      { name: "Endorsement Library", description: "Complete FAR 61.x endorsement library with customizable templates", free: false, pro: false, cfi: true, school: true },
      { name: "Lesson Builder", description: "Create weather-backup lesson plans and structured training curricula", free: false, pro: false, cfi: true, school: true },
      { name: "Progress Tracking", description: "Monitor individual student progress with detailed analytics and insights", free: false, pro: false, cfi: true, school: true },
      { name: "Full Audits Included", description: "Comprehensive logbook audits with IACRA readiness verification", free: false, pro: false, cfi: "3/month", school: "10/month" },
    ]},
    { category: "School Features", features: [
      { name: "Instructor Seats", description: "Number of instructor accounts included in your subscription", free: false, pro: false, cfi: "1", school: "10+" },
      { name: "Cohort Analytics", description: "Track fleet-wide student progress and aggregate readiness metrics", free: false, pro: false, cfi: false, school: true },
      { name: "DPE Radar", description: "Get alerts for DPE scheduling opportunities and examiner insights", free: false, pro: false, cfi: false, school: true },
      { name: "Compliance Tracker", description: "Monitor insurance requirements and regulatory compliance across your fleet", free: false, pro: false, cfi: false, school: true },
      { name: "API Access", description: "Integrate with your existing school management systems via REST API", free: false, pro: false, cfi: false, school: true },
      { name: "White-Label Option", description: "Custom branding and domain for your school's personalized platform", free: false, pro: false, cfi: false, school: "Add-on" },
    ]},
    { category: "Support", features: [
      { name: "Community Support", description: "Access to community forums and peer-to-peer assistance", free: true, pro: true, cfi: true, school: true },
      { name: "Email Support", description: "Priority email support with faster response times", free: false, pro: "Priority", cfi: "Priority", school: "Priority" },
      { name: "Phone Support", description: "Direct phone access to our support team for urgent issues", free: false, pro: false, cfi: true, school: true },
      { name: "Dedicated Manager", description: "Assigned customer success manager for personalized onboarding and support", free: false, pro: false, cfi: false, school: true },
    ]},
  ];

  const renderValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-primary mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="w-full">
      <div className="mb-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Info className="inline h-3 w-3 mr-1" />
          Hover over feature names for detailed descriptions
        </p>
      </div>
      <div className="w-full">
        <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
        <thead>
          <tr>
            <th className="text-left p-4 font-semibold">Features</th>
            {tiers.map((tier) => (
              <th key={tier.id} className="text-center p-4 font-semibold">
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
              <tr className="bg-muted/40">
                <td colSpan={5} className="p-4 font-semibold text-base text-foreground border-t border-b">
                  {category.category}
                </td>
              </tr>
              {category.features.map((feature) => (
                <tr key={feature.name} className="border-b border-border/50">
                  <td className="p-3 text-sm">
                    <div className="relative group cursor-help flex items-center gap-2">
                      <span>{feature.name}</span>
                      <Info className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute left-0 top-full mt-2 w-64 p-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-100 z-50">
                        {feature.description}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">{renderValue(feature.free)}</td>
                  <td className="p-3 text-center">{renderValue(feature.pro)}</td>
                  <td className="p-3 text-center">{renderValue(feature.cfi)}</td>
                  <td className="p-3 text-center">{renderValue(feature.school)}</td>
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