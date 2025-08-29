"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BackgroundShapes } from "@/components/ui/BackgroundShapes";
import { trackHeroCTA } from "@/lib/analytics/telemetry";

interface HeroVersionCProps {
  opacity: any;
  scale: any;
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
            <span className="inline-block rounded-xl bg-primary px-4 py-2 text-primary-foreground">
              First Try
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
              Upload your FAA test results, get a personalized study plan in
              under 2 minutes.
            </strong>
            <br />
            No more guessing what to study - our AI identifies your exact weak
            areas so you can focus on what matters most.
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
