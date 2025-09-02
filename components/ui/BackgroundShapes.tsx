"use client";

import React from "react";
import { motion } from "framer-motion";

interface BackgroundShapesProps {
  variant?: "gradient" | "geometric" | "bold";
  className?: string;
}

export function BackgroundShapes({
  variant = "gradient",
  className = "",
}: BackgroundShapesProps) {
  const baseClass = `absolute inset-0 pointer-events-none overflow-hidden ${className}`;

  if (variant === "gradient") {
    return (
      <div className={baseClass}>
        {/* Floating geometric shapes with gradients */}
        <motion.svg
          className="text-primary/10 absolute right-10 top-10 h-32 w-32"
          initial={{ rotate: 0, scale: 0.8 }}
          animate={{
            rotate: 360,
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          }}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" opacity="0.6" />
        </motion.svg>

        <motion.svg
          className="text-accent/10 absolute bottom-20 left-16 h-24 w-24"
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <circle cx="50" cy="50" r="40" opacity="0.5" />
          <circle cx="50" cy="50" r="20" opacity="0.8" />
        </motion.svg>

        <motion.svg
          className="text-primary/8 absolute left-8 top-1/3 h-16 w-16"
          initial={{ y: 0 }}
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <rect x="20" y="20" width="60" height="60" rx="8" opacity="0.7" />
        </motion.svg>

        <motion.svg
          className="text-accent/8 absolute bottom-1/4 right-8 h-20 w-20"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <path d="M50 10 L90 90 L10 90 Z" opacity="0.6" />
        </motion.svg>

        {/* Subtle gradient overlay lines */}
        <motion.div
          className="via-primary/5 absolute left-1/4 top-0 h-full w-px bg-gradient-to-b from-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="via-accent/5 absolute right-1/3 top-0 h-full w-px bg-gradient-to-b from-transparent to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>
    );
  }

  if (variant === "geometric") {
    return (
      <div className={baseClass}>
        {/* Clean geometric patterns */}
        <motion.svg
          className="absolute right-20 top-16 h-40 w-40 text-border"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <rect x="20" y="20" width="160" height="160" rx="8" />
          <rect x="50" y="50" width="100" height="100" rx="4" />
          <rect x="75" y="75" width="50" height="50" rx="2" />
        </motion.svg>

        <motion.svg
          className="absolute bottom-24 left-16 h-32 w-32 text-border"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="10" />
          <line x1="50" y1="20" x2="50" y2="80" />
          <line x1="20" y1="50" x2="80" y2="50" />
        </motion.svg>

        <motion.svg
          className="text-border/50 absolute left-4 top-1/2 h-24 w-24"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="50,15 85,75 15,75" />
        </motion.svg>

        <motion.svg
          className="text-border/50 absolute bottom-1/3 right-12 h-28 w-28"
          initial={{ rotate: 0 }}
          animate={{ rotate: -180 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect
            x="25"
            y="25"
            width="50"
            height="50"
            transform="rotate(45 50 50)"
          />
          <rect
            x="35"
            y="35"
            width="30"
            height="30"
            transform="rotate(45 50 50)"
          />
        </motion.svg>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="h-full w-full" viewBox="0 0 100 100" fill="none">
            <defs>
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === "bold") {
    return (
      <div className={baseClass}>
        {/* Subtle static background elements - no floating SVGs */}
        <div className="bg-primary/5 absolute right-1/4 top-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-accent/5 absolute bottom-1/3 left-1/4 h-24 w-24 rounded-full blur-2xl" />

        {/* Clean geometric accents */}
        <div className="left-1/5 via-primary/8 absolute top-0 h-full w-px bg-gradient-to-b from-transparent to-transparent" />
        <div className="via-accent/6 absolute right-1/4 top-0 h-full w-px bg-gradient-to-b from-transparent to-transparent" />
      </div>
    );
  }

  return null;
}
