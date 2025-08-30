"use client";

import React, { useState, useEffect, Suspense, lazy } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import {
  Check,
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

// Loading component
const SectionLoading = ({ height = "h-64" }: { height?: string }) => (
  <div className={`${height} w-full animate-pulse bg-muted rounded-lg flex items-center justify-center`}>
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

export default function Home() {
  // State for hero scroll effects
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // State for feature selection
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  
  // Reduced motion preference
  const reducedMotion = prefersReducedMotion();

  // Helper to get feature name from ID
  const getFeatureName = (featureId: string | null) => {
    if (!featureId) {
      return '';
    }
    const feature = DEFAULT_FEATURES.find(f => f.id === featureId);
    return feature?.name || featureId;
  };

  // Handle feature selection from spotlight menu
  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeature(featureId);
    
    // Track feature selection event
    trackEvent('feature_spotlight_click', {
      feature_id: featureId,
      feature_name: getFeatureName(featureId),
      page: "landing_page",
    });
  };

  // Handle play button click on screenshot
  const handlePlayClick = (featureId: string) => {
    setVideoModalOpen(true);
    
    // Track video modal open event
    trackEvent('feature_preview_video', {
      feature_id: featureId,
      feature_name: getFeatureName(featureId),
      action: 'open_modal',
      page: "landing_page",
    });
  };

  // Handle video modal close
  const handleVideoModalClose = () => {
    setVideoModalOpen(false);
    
    if (selectedFeature) {
      trackEvent('feature_preview_video', {
        feature_id: selectedFeature,
        feature_name: getFeatureName(selectedFeature),
        action: 'close_modal',
        page: "landing_page",
      });
    }
  };

  return (
    <>
      <main className="min-h-screen bg-background">
        {/* Hero Section with Motion */}
        <motion.div
          style={reducedMotion ? {} : { y: heroY, opacity: heroOpacity }}
          className="relative"
        >
          <HeroVersionC />
        </motion.div>

        {/* Feature Spotlight Section */}
        <Suspense fallback={<SectionLoading height="h-96" />}>
          <FeatureSpotlightMenu
            onFeatureSelect={handleFeatureSelect}
            className="py-16 md:py-24"
          />
        </Suspense>

        {/* Feature Screenshot Display - Only show when feature is selected */}
        {selectedFeature && (
          <section className="py-8 md:py-12">
            <div className="container px-4 md:px-6">
              <Suspense fallback={<SectionLoading height="h-96" />}>
                <FeatureScreenshotDisplay
                  featureId={selectedFeature}
                  featureName={getFeatureName(selectedFeature)}
                  screenshotUrl={FEATURE_SCREENSHOTS[selectedFeature] || 'https://picsum.photos/800/450?random=1'}
                  onPlayClick={handlePlayClick}
                />
              </Suspense>
            </div>
          </section>
        )}

        {/* Benefits Section */}
        <Suspense fallback={<SectionLoading height="h-screen" />}>
          <BenefitZipperList 
            onSectionView={(sectionId: string, featureIndex?: number) => {
              trackEvent('benefit_section_view', {
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
          onClose={handleVideoModalClose}
        />
      </Suspense>
    </>
  );
}
