"use client";

import React, { memo, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileCheck,
  TrendingUp,
  BookOpen,
  Users,
  Award,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { prefersReducedMotion } from "@/lib/utils";
import { useIntersectionObserver } from "@/lib/hooks/useIntersectionObserver";
import { useResponsive } from "@/lib/hooks/useMediaQuery";
import {
  BenefitErrorBoundary,
  MockupErrorBoundary,
} from "./BenefitErrorBoundary";
import {
  BENEFIT_CONFIG,
  BENEFIT_ANIMATION_VARIANTS,
  BENEFIT_CLASSES,
} from "@/lib/config/benefitZipper";
import type {
  BenefitZipperListProps,
  FeatureSection,
  Feature,
  MockupComponentProps,
} from "@/lib/types/benefitZipper";

// Memoized Mockup Components with Error Handling
const LogbookMockup = memo<MockupComponentProps>(
  ({ height = "h-80", className = "" }) => (
    <MockupErrorBoundary sectionTitle="Logbook Analysis Demo">
      <div
        className={`rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 ${height} flex flex-col ${className}`}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-400"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
          <div className="h-3 w-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/80 p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span className="text-sm font-medium">Cross Country Flight</span>
            </div>
            <span className="text-xs text-muted-foreground">2.5 hrs</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/80 p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-sm font-medium">Night Flying</span>
            </div>
            <span className="text-xs text-muted-foreground">1.8 hrs</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/80 p-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Instrument Training</span>
            </div>
            <span className="text-xs text-muted-foreground">3.2 hrs</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-2xl font-bold text-primary">94%</div>
          <div className="text-xs text-muted-foreground">Compliance Score</div>
        </div>
      </div>
    </MockupErrorBoundary>
  )
);

const AnalyticsMockup = memo<MockupComponentProps>(
  ({ height = "h-80", className = "" }) => (
    <MockupErrorBoundary sectionTitle="Analytics Demo">
      <div
        className={`rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 ${height} flex flex-col ${className}`}
      >
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold">Progress Analytics</h3>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">156</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">92%</div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">23</div>
              <div className="text-xs text-muted-foreground">Weak Areas</div>
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-end justify-between rounded-lg bg-white/80 p-4">
          <div className="bg-primary/30 h-16 w-8 rounded"></div>
          <div className="bg-primary/50 h-24 w-8 rounded"></div>
          <div className="bg-primary/40 h-20 w-8 rounded"></div>
          <div className="h-32 w-8 rounded bg-primary"></div>
          <div className="bg-primary/60 h-28 w-8 rounded"></div>
          <div className="bg-primary/20 h-12 w-8 rounded"></div>
        </div>
      </div>
    </MockupErrorBoundary>
  )
);

const TrainingMockup = memo<MockupComponentProps>(
  ({ height = "h-80", className = "" }) => (
    <MockupErrorBoundary sectionTitle="Training Management Demo">
      <div
        className={`rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-6 ${height} flex flex-col ${className}`}
      >
        <div className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Training Schedule</h3>
            <div className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
              On Track
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="rounded-lg bg-white/80 p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-full">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Private Pilot</span>
            </div>
            <div className="ml-10 text-xs text-muted-foreground">
              Complete - Checkride passed
            </div>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Instrument Rating</span>
            </div>
            <div className="ml-10 text-xs text-muted-foreground">
              In Progress - 35% complete
            </div>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <Award className="h-4 w-4 text-gray-400" />
              </div>
              <span className="text-sm font-medium">Commercial Pilot</span>
            </div>
            <div className="ml-10 text-xs text-muted-foreground">
              Planned - Prerequisites needed
            </div>
          </div>
        </div>
      </div>
    </MockupErrorBoundary>
  )
);

// Default feature sections with improved mockups
const defaultFeatureSections: FeatureSection[] = [
  {
    id: "logbook-analysis",
    title: "Smart Logbook Analysis",
    subtitle:
      "Track compliance, identify weaknesses, and stay checkride-ready with automated logbook analysis.",
    features: [
      {
        icon: <FileCheck className="h-5 w-5" />,
        title: "Automated Compliance Check",
        description:
          "Scan your logbook for FAR compliance and missing requirements.",
      },
      {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Weakness Detection",
        description: "AI identifies your weakest ACS areas for focused study.",
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: "Checkride Readiness",
        description:
          "Get your confidence score and know exactly what to review.",
      },
    ],
    mockup: <LogbookMockup id="logbook" />,
  },
  {
    id: "progress-analytics",
    title: "Progress Analytics",
    subtitle:
      "See your training progress with detailed analytics and performance tracking.",
    features: [
      {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Performance Metrics",
        description: "Track your improvement over time with detailed charts.",
      },
      {
        icon: <Clock className="h-5 w-5" />,
        title: "Time Analysis",
        description: "Optimize your training schedule with smart insights.",
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: "Goal Tracking",
        description: "Set and achieve your aviation milestones systematically.",
      },
    ],
    mockup: <AnalyticsMockup id="analytics" />,
  },
  {
    id: "training-management",
    title: "Training Management",
    subtitle:
      "Manage your entire aviation training journey from private pilot to ATP.",
    features: [
      {
        icon: <BookOpen className="h-5 w-5" />,
        title: "Curriculum Planning",
        description: "Structured learning paths for all certificate levels.",
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: "Instructor Coordination",
        description: "Connect with CFIs and track your training progress.",
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: "Certification Tracking",
        description: "Monitor requirements and deadlines for all ratings.",
      },
    ],
    mockup: <TrainingMockup id="training" />,
  },
];

// Memoized feature item component
const FeatureItem = memo<{
  feature: Feature;
  index: number;
  isVisible: boolean;
  config: typeof BENEFIT_CONFIG;
  reducedMotion: boolean;
  onInteraction?: () => void;
}>(({ feature, index, isVisible, config, reducedMotion, onInteraction }) => {
  const { isMobile } = useResponsive();
  const variants = isMobile
    ? BENEFIT_ANIMATION_VARIANTS.mobile
    : BENEFIT_ANIMATION_VARIANTS.desktop;

  const handleClick = useCallback(() => {
    onInteraction?.();
  }, [onInteraction]);

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : variants.hiddenLeft}
      animate={
        isVisible ? (reducedMotion ? { opacity: 1 } : variants.visibleX) : {}
      }
      transition={{
        duration: isMobile
          ? config.MOBILE_ANIMATION_DURATION
          : config.ANIMATION_DURATION,
        delay: index * config.STAGGER_DELAY,
      }}
      className={BENEFIT_CLASSES.featureItem}
      onClick={handleClick}
      role={onInteraction ? "button" : undefined}
      tabIndex={onInteraction ? 0 : undefined}
    >
      <div className={BENEFIT_CLASSES.iconContainer}>{feature.icon}</div>
      <div className="space-y-1">
        <h4 className="text-lg font-semibold">{feature.title}</h4>
        <p className="leading-relaxed text-muted-foreground">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
});

// Main component with all improvements
export const BenefitZipperList: React.FC<BenefitZipperListProps> = memo(
  ({
    sections = defaultFeatureSections,
    config = {},
    className = "",
    onSectionView,
    onFeatureInteraction,
    forceReducedMotion = false,
  }) => {
    const reducedMotion = forceReducedMotion || prefersReducedMotion();
    const mergedConfig = useMemo(
      () => ({ ...BENEFIT_CONFIG, ...config }),
      [config]
    );

    // Intersection observer for header
    const { ref: headerRef, isInView: headerInView } = useIntersectionObserver({
      threshold: mergedConfig.INTERSECTION_THRESHOLD,
      rootMargin: mergedConfig.INTERSECTION_ROOT_MARGIN,
      triggerOnce: true,
      fallbackInView: false,
    });

    const handleSectionView = useCallback(
      (sectionId: string) => {
        onSectionView?.(sectionId);
      },
      [onSectionView]
    );

    const handleFeatureInteraction = useCallback(
      (sectionId: string, featureIndex: number) => {
        onFeatureInteraction?.(sectionId, featureIndex);
      },
      [onFeatureInteraction]
    );

    return (
      <BenefitErrorBoundary>
        <section className={`${BENEFIT_CLASSES.section} ${className}`}>
          <div className={BENEFIT_CLASSES.container}>
            {/* Section Header */}
            <motion.div
              ref={headerRef as React.RefObject<HTMLDivElement>}
              initial={
                reducedMotion
                  ? { opacity: 0 }
                  : BENEFIT_ANIMATION_VARIANTS.desktop.hidden
              }
              animate={
                headerInView
                  ? reducedMotion
                    ? { opacity: 1 }
                    : BENEFIT_ANIMATION_VARIANTS.desktop.visible
                  : {}
              }
              transition={{ duration: mergedConfig.ANIMATION_DURATION }}
              className={BENEFIT_CLASSES.headerContainer}
            >
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Everything You Need to Succeed
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Professional aviation training tools designed by CFIs, for CFIs
                and their students
              </p>
            </motion.div>

            {/* Feature Sections */}
            <div style={{ marginBottom: `${mergedConfig.SECTION_SPACING}px` }}>
              {sections.map((section, sectionIndex) => {
                const isEven = sectionIndex % 2 === 0;

                return (
                  <FeatureSectionComponent
                    key={section.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    isEven={isEven}
                    config={mergedConfig}
                    reducedMotion={reducedMotion}
                    onSectionView={handleSectionView}
                    onFeatureInteraction={handleFeatureInteraction}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </BenefitErrorBoundary>
    );
  }
);

// Memoized section component
const FeatureSectionComponent = memo<{
  section: FeatureSection;
  sectionIndex: number;
  isEven: boolean;
  config: typeof BENEFIT_CONFIG;
  reducedMotion: boolean;
  onSectionView: (sectionId: string) => void;
  onFeatureInteraction: (sectionId: string, featureIndex: number) => void;
}>(
  ({
    section,
    sectionIndex,
    isEven,
    config,
    reducedMotion,
    onSectionView,
    onFeatureInteraction,
  }) => {
    // Intersection observer for each section
    const { ref: sectionRef, isInView } = useIntersectionObserver({
      threshold: config.INTERSECTION_THRESHOLD,
      rootMargin: config.INTERSECTION_ROOT_MARGIN,
      triggerOnce: true,
      fallbackInView: false,
    });

    // Track section view
    React.useEffect(() => {
      if (isInView) {
        onSectionView(section.id);
      }
    }, [isInView, section.id, onSectionView]);

    const { isMobile } = useResponsive();
    const variants = isMobile
      ? BENEFIT_ANIMATION_VARIANTS.mobile
      : BENEFIT_ANIMATION_VARIANTS.desktop;

    return (
      <motion.div
        ref={sectionRef as React.RefObject<HTMLDivElement>}
        initial={reducedMotion ? { opacity: 0 } : variants.hidden}
        animate={
          isInView ? (reducedMotion ? { opacity: 1 } : variants.visible) : {}
        }
        transition={{
          duration: isMobile
            ? config.MOBILE_ANIMATION_DURATION
            : config.ANIMATION_DURATION,
          delay: 0.2,
        }}
        className={`${BENEFIT_CLASSES.sectionGrid} ${
          isEven ? "" : "md:grid-flow-col-dense"
        }`}
        style={{
          marginBottom: sectionIndex < 2 ? `${config.SECTION_SPACING}px` : 0,
        }}
      >
        {/* Content Side */}
        <div
          className={`${BENEFIT_CLASSES.contentContainer} ${isEven ? "" : "md:col-start-2"}`}
        >
          <div className="space-y-4">
            <h3 className="text-2xl font-bold md:text-3xl">{section.title}</h3>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {section.subtitle}
            </p>
          </div>

          {/* Feature List */}
          <div className={BENEFIT_CLASSES.featureList}>
            {section.features.map((feature, featureIndex) => (
              <FeatureItem
                key={featureIndex}
                feature={feature}
                index={featureIndex}
                isVisible={isInView}
                config={config}
                reducedMotion={reducedMotion}
                onInteraction={() =>
                  onFeatureInteraction(section.id, featureIndex)
                }
              />
            ))}
          </div>
        </div>

        {/* Mockup Side */}
        <motion.div
          className={`${isEven ? "" : "md:col-start-1"}`}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  scale: 0.9,
                  x: isEven ? config.INITIAL_OFFSET : -config.INITIAL_OFFSET,
                }
          }
          animate={
            isInView
              ? reducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    scale: 1,
                    x: 0,
                  }
              : {}
          }
          transition={{
            duration: isMobile
              ? config.MOBILE_ANIMATION_DURATION
              : config.ANIMATION_DURATION,
            delay: 0.3,
            ease: "easeOut",
          }}
        >
          {section.mockup}
        </motion.div>
      </motion.div>
    );
  }
);

BenefitZipperList.displayName = "BenefitZipperList";
FeatureItem.displayName = "FeatureItem";
FeatureSectionComponent.displayName = "FeatureSectionComponent";
LogbookMockup.displayName = "LogbookMockup";
AnalyticsMockup.displayName = "AnalyticsMockup";
TrainingMockup.displayName = "TrainingMockup";
