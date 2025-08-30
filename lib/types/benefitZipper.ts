import React from "react";
import { BENEFIT_CONFIG } from "@/lib/config/benefitZipper";

export interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface FeatureSection {
  id: string;
  title: string;
  subtitle: string;
  features: Feature[];
  mockup: React.ReactNode;
}

export interface BenefitZipperListProps {
  /**
   * Array of feature sections to display.
   * If not provided, uses default sections.
   */
  sections?: FeatureSection[];
  
  /**
   * Configuration overrides for animations and layout.
   */
  config?: Partial<typeof BENEFIT_CONFIG>;
  
  /**
   * Additional CSS classes for the container.
   */
  className?: string;
  
  /**
   * Called when a feature section becomes visible.
   * Useful for analytics tracking.
   */
  onSectionView?: (sectionId: string) => void;
  
  /**
   * Called when a feature item is interacted with.
   * Useful for engagement tracking.
   */
  onFeatureInteraction?: (sectionId: string, featureIndex: number) => void;
  
  /**
   * Whether to show the bottom CTA section.
   * @default true
   */
  showCTA?: boolean;
  
  /**
   * Custom CTA content to replace the default.
   */
  customCTA?: React.ReactNode;
  
  /**
   * Whether to enable reduced motion globally.
   * Overrides user preference detection.
   */
  forceReducedMotion?: boolean;
}

export interface MockupComponentProps {
  /**
   * Unique identifier for the mockup (for error tracking)
   */
  id: string;
  
  /**
   * Height of the mockup container
   * @default "h-80"
   */
  height?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export interface BenefitAnimationState {
  isVisible: boolean;
  hasAnimated: boolean;
  animationDelay: number;
}

export interface IntersectionObserverConfig {
  threshold: number;
  rootMargin: string;
  triggerOnce: boolean;
  fallbackInView: boolean;
}