"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface FeatureScreenshotDisplayProps {
  featureId: string;
  featureName: string;
  screenshotUrl: string;
  onPlayClick: (featureId: string) => void;
  className?: string;
}

export const FeatureScreenshotDisplay: React.FC<FeatureScreenshotDisplayProps> = ({
  featureId,
  featureName,
  screenshotUrl,
  onPlayClick,
  className,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    console.log("Image loaded for feature:", featureId);
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error("Image failed to load for feature:", featureId);
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <motion.div
      key={featureId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("w-full", className)}
    >

      {/* Screenshot container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl shadow-2xl border-4 border-border/20"
      >
        {/* Skeleton loader for loading state */}
        <AnimatePresence>
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="aspect-[16/9] w-full bg-gray-200 dark:bg-gray-800 animate-pulse"
              data-testid="screenshot-skeleton"
            >
              <div className="h-full w-full flex items-center justify-center">
                <div className="space-y-3">
                  {/* Animated skeleton elements */}
                  <div className="h-12 w-12 mx-auto bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="h-2 w-24 mx-auto bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {imageError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex aspect-[16/9] w-full items-center justify-center bg-muted"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <Play className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Failed to load screenshot
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please try again later
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Screenshot image */}
        <div className="relative aspect-[16/9] w-full">
          <img
            src={screenshotUrl}
            alt={`${featureName} feature screenshot`}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Play button overlay */}
          <AnimatePresence>
            {imageLoaded && !imageError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.button
                  onClick={() => {
                    console.log("Play button clicked for feature:", featureId);
                    onPlayClick(featureId);
                  }}
                  className="group flex h-20 w-20 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-all hover:h-24 hover:w-24 hover:bg-black/80 focus:h-24 focus:w-24 focus:bg-black/80 focus:outline-none focus:ring-4 focus:ring-primary/50 md:h-24 md:w-24 cursor-pointer"
                  aria-label={`Play demo video for ${featureName}`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="ml-1 h-8 w-8 fill-white text-white transition-transform group-hover:scale-110 md:h-10 md:w-10" />
                </motion.button>
                
                {/* Tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none"
                >
                  See how our Interactive {featureName} Work (3:43)
                </motion.div>
                
                {/* Pulsing ring effect */}
                <motion.div
                  className="absolute h-20 w-20 rounded-full border-2 border-white/30 md:h-24 md:w-24 pointer-events-none"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Decorative overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/30" />
      </motion.div>
    </motion.div>
  );
};