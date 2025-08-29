"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Search, BookOpen, BarChart3, Target, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript interfaces as specified in tasks.md
export interface FeatureItem {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}

export interface FeatureSpotlightMenuProps {
  features?: FeatureItem[];
  onSelect?: (featureId: string) => void;
  className?: string;
}

// Default features for CFIPros aviation platform
const DEFAULT_FEATURES: FeatureItem[] = [
  {
    id: "upload",
    label: "Upload",
    Icon: Upload,
  },
  {
    id: "analyzer", 
    label: "Analyzer",
    Icon: Search,
  },
  {
    id: "study-plans",
    label: "Study Plans", 
    Icon: BookOpen,
  },
  {
    id: "analytics",
    label: "Analytics",
    Icon: BarChart3,
  },
  {
    id: "practice",
    label: "Practice",
    Icon: Target,
  },
  {
    id: "certification",
    label: "Certification",
    Icon: Award,
  },
];

export const FeatureSpotlightMenu: React.FC<FeatureSpotlightMenuProps> = ({
  features = DEFAULT_FEATURES,
  onSelect,
  className,
}) => {
  // State management for active selection and scroll indicators
  const [activeId, setActiveId] = useState<string>(() => {
    if (features.length === 0) return "";
    // Set middle feature as active by default
    const middleIndex = Math.floor(features.length / 2);
    return features[middleIndex]?.id || features[0]?.id || "";
  });

  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Refs for scroll management
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update scroll indicators based on scroll position
  const updateScrollIndicators = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // Handle scroll events with throttling
  const handleScroll = useCallback(() => {
    updateScrollIndicators();
  }, [updateScrollIndicators]);

  // Handle feature selection
  const handleFeatureSelect = useCallback((featureId: string) => {
    setActiveId(featureId);
    onSelect?.(featureId);
  }, [onSelect]);

  // Scroll to specific position
  const scrollTo = useCallback((direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.6; // Scroll 60% of container width
    container.scrollBy({
      left: direction === "right" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  }, []);

  // Keyboard navigation support
  const handleKeyDown = useCallback((event: React.KeyboardEvent, featureId: string) => {
    const currentIndex = features.findIndex(f => f.id === featureId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    let handled = false;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : features.length - 1;
        handled = true;
        break;
      case "ArrowRight":
        event.preventDefault();
        nextIndex = currentIndex < features.length - 1 ? currentIndex + 1 : 0;
        handled = true;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        handled = true;
        break;
      case "End":
        event.preventDefault();
        nextIndex = features.length - 1;
        handled = true;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        handleFeatureSelect(featureId);
        return;
      default:
        break;
    }

    if (handled) {
      const nextFeature = features[nextIndex];
      if (nextFeature) {
        handleFeatureSelect(nextFeature.id);
        // Focus the next tab - try both approaches for reliability
        setTimeout(() => {
          const nextTab = document.querySelector(`[data-feature-id="${nextFeature.id}"]`) as HTMLElement;
          if (nextTab) {
            nextTab.focus();
          }
        }, 0);
      }
    }
  }, [features, handleFeatureSelect]);

  // Setup scroll listener and initial scroll indicator state
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Add scroll listener
    container.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial update
    updateScrollIndicators();
    
    // Setup ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(() => {
      updateScrollIndicators();
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [handleScroll, updateScrollIndicators]);

  // If no features, render empty state
  if (features.length === 0) {
    return (
      <div className={cn("relative rounded-2xl border border-gray-200 bg-white p-4", className)}>
        <div role="tablist" className="flex justify-center">
          <p className="text-gray-500 text-sm">No features available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
      {/* Left scroll arrow */}
      {showLeftArrow && (
        <button
          type="button"
          onClick={() => scrollTo("left")}
          aria-label="Scroll left"
          className="
            absolute left-2 top-1/2 z-10 -translate-y-1/2
            flex h-8 w-8 items-center justify-center
            rounded-full bg-white shadow-md border border-gray-200
            text-gray-600 hover:text-gray-900 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200
          "
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right scroll arrow */}
      {showRightArrow && (
        <button
          type="button"
          onClick={() => scrollTo("right")}
          aria-label="Scroll right"
          className="
            absolute right-2 top-1/2 z-10 -translate-y-1/2
            flex h-8 w-8 items-center justify-center
            rounded-full bg-white shadow-md border border-gray-200
            text-gray-600 hover:text-gray-900 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200
          "
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Scrollable features container */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Feature selection"
        className="
          flex overflow-x-auto scroll-smooth py-6 px-4
          scrollbar-hide
          gap-6
          sm:gap-8 sm:px-6
          md:gap-10 md:px-8
          min-w-fit
        "
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {features.map((feature) => {
            const isActive = activeId === feature.id;
            const IconComponent = feature.Icon;
            
            return (
              <button
                key={feature.id}
                type="button"
                role="tab"
                data-feature-id={feature.id}
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                onClick={() => handleFeatureSelect(feature.id)}
                onKeyDown={(e) => handleKeyDown(e, feature.id)}
                aria-label={feature.label}
                className={cn(
                  "flex flex-col items-center gap-3 min-w-fit transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2",
                  isActive
                    ? "text-[#1e9df1]"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {/* Feature icon */}
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-blue-50 border-2 border-[#1e9df1]/20"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                )}>
                  {IconComponent ? (
                    <IconComponent className="h-6 w-6" />
                  ) : (
                    <div className="h-6 w-6 bg-gray-300 rounded" />
                  )}
                </div>
                
                {/* Feature label */}
                <span className={cn(
                  "text-sm font-medium whitespace-nowrap transition-colors duration-200",
                  isActive
                    ? "text-[#1e9df1]"
                    : "text-gray-700 hover:text-gray-900"
                )}>
                  {feature.label}
                </span>
              </button>
            );
          })}
      </div>

      {/* Active indicator line */}
      <div className="relative h-1 mx-4">
        <div className="absolute inset-0 bg-gray-100 rounded-full" />
        {activeId && (
          <div
            className="absolute h-full bg-[#1e9df1] rounded-full transition-all duration-300"
            style={{
              width: `${100 / features.length}%`,
              left: `${(features.findIndex(f => f.id === activeId) / features.length) * 100}%`,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
};