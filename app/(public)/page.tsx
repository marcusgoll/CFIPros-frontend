"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import {
  Star,
} from "lucide-react";
import { HeroVersionC } from "@/components/layout/HeroVersionC";
import {
  FEATURE_SCREENSHOTS,
  DEFAULT_FEATURES,
} from "@/components/layout/FeatureSpotlightMenu";
import { trackEvent } from "@/lib/analytics/telemetry";
import { prefersReducedMotion } from "@/lib/utils";

// Dynamic imports for heavy components
const FeatureSpotlightMenu = lazy(() => import("@/components/layout/FeatureSpotlightMenu").then(m => ({ default: m.FeatureSpotlightMenu })));
const FeatureScreenshotDisplay = lazy(() => import("@/components/layout/FeatureScreenshotDisplay").then(m => ({ default: m.FeatureScreenshotDisplay })));
const VideoModal = lazy(() => import("@/components/layout/VideoModal").then(m => ({ default: m.VideoModal })));
const BenefitZipperList = lazy(() => import("@/components/sections/BenefitZipperList").then(m => ({ default: m.BenefitZipperList })));
const PricingSection = lazy(() => import("@/components/sections/PricingSection").then(m => ({ default: m.PricingSection })));
const PremiumCTA = lazy(() => import("@/components/sections/PremiumCTA").then(m => ({ default: m.PremiumCTA })));

// Loading fallback component
const SectionLoading = ({ height = "h-64" }: { height?: string }) => (
  <div className={`${height} flex items-center justify-center bg-muted/20 animate-pulse`}>
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
  </div>
);

export default function CFIProsHomePage() {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Ensure component is mounted before using scroll-based animations
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Feature selection state - match FeatureSpotlightMenu default
  const [selectedFeature, setSelectedFeature] = useState("upload");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Initialize feature selection and reduced motion after component mounts
  useEffect(() => {
    if (DEFAULT_FEATURES && DEFAULT_FEATURES.length > 0) {
      const defaultIndex = Math.floor(DEFAULT_FEATURES.length / 2);
      const defaultFeature = DEFAULT_FEATURES[defaultIndex]?.id || "upload";
      setSelectedFeature(defaultFeature);
    }
    setReducedMotion(prefersReducedMotion());
  }, []);

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

  // Track hero view on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      trackEvent("hero_view", {
        variant: "version_C",
        url: window.location.href,
        referrer: document.referrer,
      });
    }
  }, []);

  // Show loading state briefly to prevent white screen flash
  if (!isMounted) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
        <main id="main" className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main id="main">
        <HeroVersionC 
          opacity={isMounted ? opacity : 1} 
          scale={isMounted ? scale : 1} 
        />

        {/* Feature Spotlight Menu */}
        <section className="to-muted/20 bg-gradient-to-b from-background pb-8 pt-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reducedMotion ? 0 : 0.2 }}
            >
              <Suspense fallback={<SectionLoading height="h-32" />}>
                <FeatureSpotlightMenu
                  onSelect={(featureId) => {
                    trackEvent("feature_spotlight_click", {
                      feature: featureId,
                      section: "landing_page",
                    });
                    setSelectedFeature(featureId);
                  }}
                />
              </Suspense>
            </motion.div>
          </div>
        </section>

        {/* Feature Screenshot Display */}
        <section className="bg-muted/20 pb-6">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <Suspense fallback={<SectionLoading height="h-96" />}>
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
            </Suspense>
          </div>
        </section>

        <Suspense fallback={<SectionLoading height="h-screen" />}>
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
        </Suspense>
        {/* <Testimonials /> */}
        <Suspense fallback={<SectionLoading height="h-96" />}>
          <PricingSection />
        </Suspense>
        <Suspense fallback={<SectionLoading height="h-64" />}>
          <PremiumCTA />
        </Suspense>
      </main>

      {/* Video Modal */}
      <Suspense fallback={null}>
        <VideoModal
          featureId={selectedFeature}
          featureName={getFeatureName(selectedFeature)}
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
        />
      </Suspense>
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


