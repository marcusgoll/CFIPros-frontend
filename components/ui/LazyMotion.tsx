"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";
import { ReactNode } from "react";

interface LazyMotionWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Optimized motion wrapper using LazyMotion for reduced bundle size
 * Only loads animations when needed, reducing initial bundle size
 */
export function LazyMotionWrapper({
  children,
  className,
}: LazyMotionWrapperProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <div className={className}>{children}</div>
    </LazyMotion>
  );
}

/**
 * Lightweight motion component using LazyMotion
 * Use this instead of motion.div for better performance
 */
export const OptimizedMotion = {
  div: m.div,
  section: m.section,
  button: m.button,
  span: m.span,
  h1: m.h1,
  h2: m.h2,
  h3: m.h3,
  p: m.p,
};

/**
 * Common animation variants for consistent motion across the app
 */
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 },
  },
  stagger: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
} as const;

export type AnimationVariant = keyof typeof animationVariants;
