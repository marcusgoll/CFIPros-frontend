"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "glass" | "gradient";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  pill?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      glow = false,
      pill = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
      outline: "border border-border bg-background hover:bg-muted",
      ghost: "hover:bg-muted hover:text-foreground",
      glass: "glass glass-hover text-foreground",
      gradient: "bg-gradient-premium text-white shadow-lg hover:shadow-xl",
    };

    const sizes = {
      xs: "h-7 px-2.5 text-xs font-medium",
      sm: "h-9 px-3 text-sm font-medium",
      md: "h-11 px-4 text-base font-medium",
      lg: "h-12 px-6 text-lg font-semibold",
      xl: "h-14 px-8 text-xl font-semibold",
    };

    const glowStyles = glow
      ? variant === "primary" || variant === "gradient"
        ? "glow-md"
        : "glow-sm"
      : "";

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className={cn(
          "btn-base inline-flex items-center justify-center gap-2",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          pill ? "rounded-full" : "rounded-lg",
          variants[variant],
          sizes[size],
          glowStyles,
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
          />
        ) : (
          <>
            {leftIcon && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {leftIcon}
              </motion.span>
            )}
            {children}
            {rightIcon && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {rightIcon}
              </motion.span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";