"use client";

import React, { useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import {
  FileSearch,
  LineChart,
  GraduationCap,
  Check,
  Award,
  TrendingUp,
  Clock,
  Globe,
  Zap,
  Shield,
  Star,
  ArrowRightCircle,
} from "lucide-react";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HeroVersionC } from "@/components/layout/HeroVersionC";
import {
  FeatureSpotlightMenu,
  FEATURE_SCREENSHOTS,
  DEFAULT_FEATURES,
} from "@/components/layout/FeatureSpotlightMenu";
import { FeatureScreenshotDisplay } from "@/components/layout/FeatureScreenshotDisplay";
import { VideoModal } from "@/components/layout/VideoModal";
import { BenefitZipperList } from "@/components/sections/BenefitZipperList";
import { trackEvent } from "@/lib/analytics/telemetry";
import { prefersReducedMotion } from "@/lib/utils";

export default function CFIProsHomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Feature selection state - match FeatureSpotlightMenu default
  const defaultIndex = Math.floor(DEFAULT_FEATURES.length / 2);
  const defaultFeature = DEFAULT_FEATURES[defaultIndex]?.id || "upload";
  const [selectedFeature, setSelectedFeature] = useState(defaultFeature);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const reducedMotion = prefersReducedMotion();

  // Helper function to format feature names
  const getFeatureName = (featureId: string) => {
    const nameMap: Record<string, string> = {
      upload: "Upload",
      analyzer: "Analyzer",
      planner: "Planner",
      lessons: "Lessons",
      quizzes: "Quizzes",
      "acs-lib": "ACS Library",
      dashboard: "Dashboard",
      schools: "Schools",
      reports: "Reports",
    };
    return (
      nameMap[featureId] ||
      featureId.charAt(0).toUpperCase() + featureId.slice(1)
    );
  };

  // Track hero view on mount
  useEffect(() => {
    trackEvent("hero_view", {
      variant: "version_C",
      url: window.location.href,
      referrer: document.referrer,
    });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main id="main">
        <HeroVersionC opacity={opacity} scale={scale} />

        {/* Feature Spotlight Menu */}
        <section className="to-muted/20 bg-gradient-to-b from-background pb-8 pt-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reducedMotion ? 0 : 0.2 }}
            >
              <FeatureSpotlightMenu
                onSelect={(featureId) => {
                  trackEvent("feature_spotlight_click", {
                    feature: featureId,
                    section: "landing_page",
                  });
                  setSelectedFeature(featureId);
                }}
              />
            </motion.div>
          </div>
        </section>

        {/* Feature Screenshot Display */}
        <section className="bg-muted/20 pb-6">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <FeatureScreenshotDisplay
              featureId={selectedFeature}
              featureName={getFeatureName(selectedFeature)}
              screenshotUrl={
                FEATURE_SCREENSHOTS[selectedFeature] ||
                FEATURE_SCREENSHOTS.upload
              }
              onPlayClick={(featureId) => {
                trackEvent("feature_preview_video", {
                  feature: featureId,
                  section: "landing_page",
                });
                setVideoModalOpen(true);
              }}
            />
          </div>
        </section>

        <BenefitZipperList 
          onSectionView={(sectionId) => {
            trackEvent("benefit_section_view", {
              section: sectionId,
              page: "landing_page",
            });
          }}
          onFeatureInteraction={(sectionId, featureIndex) => {
            trackEvent("benefit_feature_interaction", {
              section: sectionId,
              feature_index: featureIndex,
              page: "landing_page",
            });
          }}
        />
        {/* <Testimonials /> */}
        <Pricing />
        <CallToAction />
      </main>

      {/* Video Modal */}
      <VideoModal
        featureId={selectedFeature}
        featureName={getFeatureName(selectedFeature)}
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />
    </div>
  );
}






// Testimonials Section
function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "ATP, CFII",
      content:
        "CFIPros cut my checkride prep time in half. The ACS analysis is incredibly accurate.",
      rating: 5,
    },
    {
      name: "Mike Johnson",
      role: "Part 141 Chief Instructor",
      content:
        "We've integrated CFIPros into our entire program. Student pass rates are up 23%.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Commercial Pilot",
      content:
        "The logbook auditor found issues I never knew existed. Saved me from a checkride bust!",
      rating: 5,
    },
  ];

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Loved by pilots everywhere
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-premium p-6"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                "{testimonial.content}"
              </p>
              <div>
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Premium Pricing Section
function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Basic ACS lookup",
        "2 uploads per month",
        "Community support",
        "Basic study plans",
      ],
      cta: "Start free",
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: [
        "Unlimited uploads",
        "AI-powered analysis",
        "Priority support",
        "Advanced study plans",
        "Progress tracking",
        "Export reports",
      ],
      cta: "Start Pro trial",
      popular: true,
    },
    {
      name: "School",
      price: "Custom",
      period: "",
      features: [
        "Everything in Pro",
        "White-label options",
        "Cohort analytics",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      cta: "Contact sales",
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${tier.popular ? "scale-105" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-gradient-premium px-3 py-1 text-xs text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div
                className={`h-full rounded-xl p-6 ${
                  tier.popular
                    ? "glass border-primary shadow-xl"
                    : "card-premium"
                }`}
              >
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <PremiumButton
                  variant={tier.popular ? "gradient" : "outline"}
                  className="w-full"
                  glow={true}
                >
                  {tier.cta}
                </PremiumButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Premium CTA Section
function CallToAction() {
  return (
    <section className="from-muted/30 bg-gradient-to-b to-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-premium p-12 text-center md:p-16"
        >
          <div className="from-primary/20 to-accent/20 absolute inset-0 bg-gradient-to-br" />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to accelerate your training?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90">
              Join thousands of pilots who are training smarter, not harder
            </p>
            <Link href="/upload">
              <PremiumButton
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightCircle className="h-5 w-5" />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Start your free analysis
              </PremiumButton>
            </Link>
            <p className="mt-4 text-sm text-white/70">
              No credit card required • 5-minute setup
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
