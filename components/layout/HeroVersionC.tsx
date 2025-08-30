"use client";

import React from "react";
import { motion, type MotionValue } from "framer-motion";
import { Zap, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BackgroundShapes } from "@/components/ui/BackgroundShapes";
import { trackHeroCTA } from "@/lib/analytics/telemetry";

interface HeroVersionCProps {
  opacity: number | MotionValue<number>;
  scale: number | MotionValue<number>;
}

export function HeroVersionC({ opacity, scale }: HeroVersionCProps) {
  return (
    <section
      className="relative flex items-start justify-start overflow-hidden bg-background pt-16 sm:pt-24"
      aria-label="Hero section with clean value proposition"
      data-testid="hero-version-c"
    >
      {/* Background Shapes */}
      <BackgroundShapes variant="bold" />

      {/* Hero Content */}
      <motion.div
        style={{ opacity, scale }}
        className="container relative z-10 mx-auto px-4 pt-8"
      >
        <div className="mx-auto max-w-4xl space-y-6 text-center">
          {/* Dream Outcome Headline - Clear Desired Result */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Pass Your Checkride on the{" "}
            <span className="relative whitespace-nowrap text-primary">
              <svg 
                aria-hidden="true" 
                viewBox="0 0 418 42" 
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-primary opacity-50" 
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
              </svg>
              <span className="relative">First Try</span>
            </span>
          </motion.h1>

          {/* Time Delay + Effort/Sacrifice - Quantified Benefits */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            <strong>
              Upload your FAA test results, get a personalized study plan in under 2 minutes.
            </strong>
            <br />
            No more guessing what to study - our AI identifies your exact weak areas so you can focus on what matters most.
          </motion.p>

          {/* Perceived Likelihood - Risk Reduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-6 flex items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>100% Free to Try</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>Used by 50+ Student Pilots</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>2-Minute Setup</span>
            </div>
          </motion.div>

          {/* Strong CTA with Urgency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col items-center gap-4"
          >
            <Button
              size="lg"
              className="hover:bg-primary/90 h-auto rounded-md bg-primary px-12 py-4 text-xl font-bold text-primary-foreground shadow-lg transition-all hover:shadow-xl"
              tabIndex={0}
              onClick={() => trackHeroCTA("Get My Study Plan Now", "version_c")}
            >
              <GraduationCap className="mr-3 h-6 w-6" />
              Get My Study Plan Now
            </Button>

            {/* Secondary benefit reinforcement */}
            <p className="text-center text-sm text-muted-foreground">
              Join student pilots who stopped wasting time on topics they
              already know
            </p>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
