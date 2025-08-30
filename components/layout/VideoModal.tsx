"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/telemetry";

// Video path from environment configuration with validation
const getValidatedVideoPath = (): string => {
  const envPath = process.env['NEXT_PUBLIC_DEMO_VIDEO_PATH'];
  const defaultPath = "/videos/6739601-hd_1920_1080_24fps.mp4";
  
  if (!envPath) {
    if (process.env['NODE_ENV'] === 'development') {
      console.warn('NEXT_PUBLIC_DEMO_VIDEO_PATH not configured, using default path');
    }
    return defaultPath;
  }
  
  // Basic validation - ensure it's a video file path
  if (!envPath.match(/\.(mp4|webm|mov|avi)$/i)) {
    console.error('Invalid video file extension in NEXT_PUBLIC_DEMO_VIDEO_PATH');
    return defaultPath;
  }
  
  return envPath;
};

const DEMO_VIDEO_PATH = getValidatedVideoPath();

export interface VideoModalProps {
  featureId: string;
  featureName: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  featureId,
  featureName,
  isOpen,
  onClose,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoPreloaded, setVideoPreloaded] = useState(false);
  const reducedMotion = prefersReducedMotion();

  // Network-aware video preloading
  useEffect(() => {
    const shouldPreloadVideo = () => {
      // Don't preload on slow connections to save bandwidth
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        
        if (!connection) return true; // Default to preload if no connection info
        
        // Check for slow connection types
        const slowTypes = ['slow-2g', '2g'];
        if (slowTypes.includes(connection.effectiveType)) {
          return false;
        }
        
        // Check for limited data plans (save data mode)
        if (connection.saveData === true) {
          return false;
        }
        
        // Check for very slow connections based on downlink
        if (typeof connection.downlink === 'number' && connection.downlink < 0.5) {
          return false; // Less than 500 kbps
        }
        
        // Check round trip time (high latency)
        if (typeof connection.rtt === 'number' && connection.rtt > 2000) {
          return false; // More than 2 seconds RTT
        }
      }
      
      // Also check for reduced motion preference as indicator of performance needs
      if (prefersReducedMotion()) {
        return false; // Users with motion sensitivity likely prefer minimal resource usage
      }
      
      return true;
    };

    const preloadVideo = () => {
      if (!shouldPreloadVideo()) return;
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = DEMO_VIDEO_PATH;
      
      video.addEventListener('loadedmetadata', () => {
        setVideoPreloaded(true);
      });
      
      video.addEventListener('error', () => {
        setVideoError(true);
        trackEvent('video_preload_failed', {
          videoPath: DEMO_VIDEO_PATH,
          component: 'VideoModal_preload',
        });
      });
      
      video.load();
    };

    if (!videoPreloaded && !videoError) {
      preloadVideo();
    }
  }, [videoPreloaded, videoError]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), iframe'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${featureName} demo video`}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3 }}
        onClick={handleOverlayClick}
        data-testid="video-modal-overlay"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white transition-all hover:bg-black/90 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close video"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Video container */}
        <motion.div
          className="relative mx-4 w-full max-w-6xl"
          initial={reducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 50 }}
          animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 50 }}
          transition={{ duration: reducedMotion ? 0.1 : 0.4, delay: reducedMotion ? 0 : 0.1, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {featureName} Demo
            </h2>
            <p className="mt-2 text-gray-300">
              Watch how {featureName.toLowerCase()} works in action
            </p>
          </div>

          {/* Video container with skeleton loader */}
          <div className="relative overflow-hidden rounded-lg shadow-2xl bg-gray-900">
            <div className="aspect-video w-full relative">
              {/* Skeleton loader */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 animate-pulse">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full animate-pulse"></div>
                    <div className="h-4 w-32 mx-auto bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              )}
              
              {/* Video player */}
              <video
                ref={videoRef}
                src={DEMO_VIDEO_PATH}
                className="h-full w-full object-cover"
                controls
                autoPlay={!reducedMotion}
                preload="metadata"
                onLoadedData={() => {
                  setIsLoading(false);
                  setIsPlaying(true);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => {
                  setIsLoading(false);
                  setVideoError(true);
                  trackEvent('video_load_failed', {
                    featureId,
                    featureName,
                    videoPath: DEMO_VIDEO_PATH,
                    component: 'VideoModal_player',
                  });
                }}
                data-testid="video-player"
              >
                Your browser does not support the video tag.
              </video>
              
              {/* Error state */}
              {videoError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <X className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <p className="text-white">Failed to load video</p>
                    <p className="text-gray-400 text-sm mt-2">Please try again later</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Decorative border */}
            <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Press Escape or click outside to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
