"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeroVersionAProps {
  opacity: any;
  scale: any;
}

export function HeroVersionA({ opacity, scale }: HeroVersionAProps) {
  return (
    <section 
      className="relative min-h-screen bg-slate-50 overflow-hidden"
      aria-label="Hero section with modern clean design"
      data-testid="hero-version-a"
    >
      {/* Hero Content */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-10 container mx-auto px-4 py-12 max-w-6xl"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Column - Text Content */}
          <div className="space-y-8 text-left">
            
            {/* Dream Outcome - Clear Desired Result */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-slate-900"
            >
              Stop Failing Checkrides Due to{' '}
              <span className="bg-blue-500 text-white px-4 py-2 rounded-xl inline-block">
                Poor Preparation
              </span>
            </motion.h1>

            {/* Time Delay + Effort Reduction */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-slate-600 leading-relaxed max-w-xl"
            >
              <strong>Get a targeted study plan in 2 minutes</strong> by uploading your FAA test results. 
              Stop wasting time on topics you already know.
            </motion.p>

            {/* Risk Reduction Elements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 text-sm text-slate-600"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Used by 50+ Students</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>100% Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Instant Results</span>
              </div>
            </motion.div>

            {/* Strong CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="pt-4"
            >
              <Button
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-10 py-4 h-auto text-xl rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                tabIndex={0}
              >
                <GraduationCap className="h-6 w-6 mr-2" />
                Analyze My Test Results
              </Button>
              <p className="text-sm text-slate-500 mt-2">No credit card required • Get results instantly</p>
            </motion.div>

          </div>

          {/* Right Column - Upload Interface */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative"
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21V7M5 14l7-7 7 7" />
                  </svg>
                </div>
                <p className="font-medium text-slate-900 mb-1">Drop your FAA test report here</p>
                <p className="text-sm text-slate-500">or click to browse files</p>
                <p className="text-xs text-slate-400 mt-2">Supports PDF and photo formats</p>
              </div>

              {/* Features List */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">Auto-extract ACS codes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">Identify weak knowledge areas</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700">Generate targeted study plan</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Bottom transition section */}
      <div className="w-full h-24 bg-slate-900 relative">
        <div 
          className="absolute inset-0 bg-slate-50"
          style={{
            clipPath: 'ellipse(120% 100% at 50% 0%)',
          }}
        />
      </div>
    </section>
  );
}