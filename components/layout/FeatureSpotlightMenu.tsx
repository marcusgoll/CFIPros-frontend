"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Search, BookOpen, BarChart3, Target, Award, Calendar, Layers, Building } from "lucide-react";
import { cn } from "@/lib/utils";

// TypeScript interfaces as specified in tasks.md
export interface FeatureItem {
  id: string;
  label: string;
  Icon: React.ComponentType<any>;
}

export interface FeatureSpotlightMenuProps {
  features?: FeatureItem[];
  onSelect?: (featureId: string) => void;
  className?: string;
}

// Export feature screenshot mapping for use in other components
export const FEATURE_SCREENSHOTS: Record<string, string> = {
  upload: "https://picsum.photos/800/450?random=1",
  analyzer: "https://picsum.photos/800/450?random=2",
  planner: "https://picsum.photos/800/450?random=3",
  lessons: "https://picsum.photos/800/450?random=4",
  quizzes: "https://picsum.photos/800/450?random=5",
  "acs-lib": "https://picsum.photos/800/450?random=6",
  dashboard: "https://picsum.photos/800/450?random=7",
  schools: "https://picsum.photos/800/450?random=8",
  reports: "https://picsum.photos/800/450?random=9",
};

// Default features for CFIPros aviation platform
export const DEFAULT_FEATURES: FeatureItem[] = [
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
    id: "planner",
    label: "Planner", 
    Icon: Calendar,
  },
  {
    id: "lessons",
    label: "Lessons",
    Icon: BookOpen,
  },
  {
    id: "quizzes",
    label: "Quizzes",
    Icon: Target,
  },
  {
    id: "acs-lib",
    label: "ACS Lib",
    Icon: Layers,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: BarChart3,
  },
  {
    id: "schools",
    label: "Schools",
    Icon: Building,
  },
  {
    id: "reports",
    label: "Reports",
    Icon: Award,
  },
];

// Custom hook for overflow detection
export function useOverflow(ref: React.RefObject<HTMLElement>) {
  const [state, setState] = useState({ canLeft: false, canRight: false });
  
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScrollLeft = scrollWidth - clientWidth;
    setState({
      canLeft: scrollLeft > 0,
      canRight: Math.ceil(scrollLeft) < maxScrollLeft,
    });
  }, [ref]);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) {
      return;
    }
    
    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (ro) {ro.disconnect();}
    };
  }, [update]);
  
  return state;
}

export const FeatureSpotlightMenu: React.FC<FeatureSpotlightMenuProps> = ({
  features = DEFAULT_FEATURES,
  onSelect,
  className,
}) => {
  const listRef = useRef<HTMLUListElement>(null);
  const defaultIndex = Math.floor(features.length / 2);
  const [active, setActive] = useState<string>(features[defaultIndex]?.id || "");
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const { canLeft, canRight } = useOverflow(listRef);

  const select = useCallback((id: string) => {
    setActive(id);
    if (onSelect) {onSelect(id);}
    const idx = features.findIndex(f => f.id === id);
    if (idx >= 0) {centerItem(idx, true);}
  }, [features, onSelect]);

  const scrollByAmount = useCallback((dir: number) => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % features.length;
      select(features[next]?.id || '');
      requestAnimationFrame(() => {
        const nextElement = listRef.current?.children[next] as HTMLElement;
        nextElement?.focus();
      });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + features.length) % features.length;
      select(features[prev]?.id || '');
      requestAnimationFrame(() => {
        const prevElement = listRef.current?.children[prev] as HTMLElement;
        prevElement?.focus();
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(features[idx]?.id || '');
    }
  }, [features, select]);

  // Center a tab within the scroll container
  const centerItem = useCallback((index: number, smooth = false) => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    const child = el.children[index] as HTMLElement;
    if (!child) {return;}
    const childRect = child.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const childCenter = childRect.left - elRect.left + childRect.width / 2;
    const target = childCenter - el.clientWidth / 2;
    el.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // On mount, center the default (middle) feature
  useEffect(() => {
    // Next frame so widths are measured
    requestAnimationFrame(() => centerItem(defaultIndex, false));
  }, [defaultIndex, centerItem]);

  // Hide swipe hint after user interaction or timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Hide swipe hint on user interaction
  const handleUserInteraction = useCallback(() => {
    setShowSwipeHint(false);
  }, []);

  // If no features, render empty state
  if (features.length === 0) {
    return (
      <div className={cn(
        "relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-background p-4",
        className
      )}>
        <div role="tablist" className="flex justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No features available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative pb-4 sm:pb-0", className)}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Scroll container with border */}
      <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-background">
        
        {/* Mobile swipe gradient indicators */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 rounded-l-2xl sm:hidden" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 rounded-r-2xl sm:hidden" />
        
        {/* Mobile swipe hint */}
        {showSwipeHint && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 sm:hidden">
            <div className="flex items-center gap-1 text-xs text-gray-400 animate-pulse">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <path d="M10 17l5-5-5-5"/>
                <path d="M14 12H3"/>
              </svg>
              <span>Swipe to explore</span>
            </div>
          </div>
        )}
        {/* Left scroll arrow (only on desktop when overflow) */}
        {canLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-background shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        )}

        {/* Right scroll arrow (only on desktop when overflow) */}
        {canRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-background shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        )}

        {/* Feature tabs */}
        <ul
          ref={listRef}
          role="tablist"
          className="flex justify-center gap-0.5 sm:gap-1 overflow-x-auto scroll-smooth px-4 sm:px-6 py-2 sm:py-3 items-center select-none snap-x snap-mandatory no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
          onTouchStart={handleUserInteraction}
          onScroll={handleUserInteraction}
        >
          {features.map(({ id, label, Icon }, idx) => {
            const isActive = id === active;
            return (
              <li key={id} className="snap-start first:ml-10 last:mr-10 sm:first:ml-12 sm:last:mr-12">
                <button
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => select(id)}
                  onKeyDown={(e) => onKeyDown(e, idx)}
                  className={cn(
                    "group relative flex h-full min-w-[92px] sm:min-w-[108px] flex-col items-center justify-center gap-1 rounded-xl bg-transparent px-2.5 py-3 text-sm sm:text-base cursor-pointer transition-colors",
                    isActive 
                      ? 'text-[#1e9df1]' 
                      : 'text-foreground hover:text-[#1e9df1]'
                  )}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </span>
                  <span className="font-medium">{label}</span>
                  
                  {/* Bottom primary indicator */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-4 bottom-0 h-1 origin-center rounded-full transition-transform bg-[#1e9df1]",
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};