"use client";

import React, { useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import { HeroVersionC } from "@/components/layout/HeroVersionC";
import {
  FeatureSpotlightMenu,
  FEATURE_SCREENSHOTS,
  DEFAULT_FEATURES,
} from "@/components/layout/FeatureSpotlightMenu";
import { FeatureScreenshotDisplay } from "@/components/layout/FeatureScreenshotDisplay";
import { VideoModal } from "@/components/layout/VideoModal";
import { BenefitZipperList } from "@/components/sections/BenefitZipperList";
import { PricingSection } from "@/components/sections/PricingSection";
import { PremiumCTA } from "@/components/sections/PremiumCTA";
import { trackEvent } from "@/lib/analytics/telemetry";
import { prefersReducedMotion } from "@/lib/utils";

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
                FEATURE_SCREENSHOTS[selectedFeature] ??
                FEATURE_SCREENSHOTS['upload'] ??
                ""
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
        {/* Testimonials intentionally omitted for brevity */}
        <PricingSection />
        <PremiumCTA />
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
 
