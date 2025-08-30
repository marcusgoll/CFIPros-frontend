"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ScreenshotPreviewProps {
  featureId: string;
  featureName: string;
  screenshotUrl: string;
  isVisible: boolean;
  onPlayClick: (featureId: string) => void;
  onClose: () => void;
  className?: string;
}

export const ScreenshotPreview: React.FC<ScreenshotPreviewProps> = ({
  featureId,
  featureName,
  screenshotUrl,
  isVisible,
  onPlayClick,
  onClose,
  className,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, onClose]);

  // Focus management
  useEffect(() => {
    if (isVisible && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isVisible]);

  // Focus trap
  useEffect(() => {
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") {
        return;
      }

      const dialog = dialogRef.current;
      if (!dialog) {
        return;
      }

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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

    if (isVisible) {
      document.addEventListener("keydown", handleTab);
    }
    return () => {
      document.removeEventListener("keydown", handleTab);
    };
  }, [isVisible]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-label={`${featureName} feature preview`}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleOverlayClick}
        data-testid="screenshot-overlay"
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content container */}
        <motion.div
          className="relative mx-4 w-full max-w-7xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={(e) => e.stopPropagation()}
          data-testid="screenshot-content"
        >
          {/* Header */}
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              {featureName}
            </h2>
          </div>

          {/* Screenshot container */}
          <div className="relative overflow-hidden rounded-lg bg-gray-900 shadow-2xl">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div
                className="flex aspect-[16/9] w-full items-center justify-center bg-gray-800"
                data-testid="screenshot-loading"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-gray-400">Loading screenshot...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-gray-800">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-red-500/10 p-3">
                    <X className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Failed to load screenshot
                    </p>
                    <p className="text-xs text-gray-400">
                      Please try again later
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Screenshot image */}
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={screenshotUrl}
                alt={`${featureName} feature screenshot`}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={handleImageLoad}
                onError={handleImageError}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />

              {/* Play button overlay */}
              {imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => onPlayClick(featureId)}
                    className="group flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-all hover:h-24 hover:w-24 hover:bg-black/70 focus:h-24 focus:w-24 focus:bg-black/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black/50 md:h-24 md:w-24"
                    aria-label="Play video for this feature"
                    aria-describedby={`play-description-${featureId}`}
                  >
                    <Play className="ml-1 h-8 w-8 fill-white text-white transition-transform group-hover:scale-110 md:h-10 md:w-10" />
                  </button>
                  <div
                    id={`play-description-${featureId}`}
                    className="sr-only"
                  >
                    Click to watch a demo video of the {featureName} feature
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer hint */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Click the play button to watch a demo, or press Escape to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
