"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, GraduationCap, ArrowRight, Plane, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BackgroundShapes } from "@/components/ui/BackgroundShapes";

interface HeroVersionBProps {
  opacity: any;
  scale: any;
}

export function HeroVersionB({ opacity, scale }: HeroVersionBProps) {
  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      aria-label="Hero section with video background"
      data-testid="hero-version-b"
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/6739601-hd_1920_1080_24fps.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Floating Plus Icons */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Floating plus icons like in reference */}
        <motion.div
          className="absolute top-20 left-20 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="w-6 h-6 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="absolute top-32 right-32 w-10 h-10 bg-white/15 rounded-full flex items-center justify-center"
          animate={{
            y: [0, 15, 0],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <div className="w-5 h-5 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-20 right-20 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
          animate={{
            y: [0, -20, 0],
            rotate: [0, 90, 180]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <div className="w-4 h-4 text-white">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30"
      >
        <div className="bg-black/20 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
          The Future Of Flight Training Is Here ✈️
        </div>
      </motion.div>

      {/* Hero Content */}
      <motion.div
        style={{ opacity, scale }}
        className="relative z-30 container mx-auto px-4 py-20"
      >
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white"
          >
            Experience seamless flight training<br />
            with smart tools made for<br />
            <span className="bg-black/20 px-4 py-2 rounded-xl inline-block mt-2">
              modern pilots
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
          >
            Analyze your test results, track progress, and improve pass rates — all from one powerful 
            platform designed for aviation training success.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              size="lg"
              className="bg-black/20 hover:bg-black/30 text-white border border-white/20 backdrop-blur-sm font-medium px-8 py-3 h-auto text-lg rounded-full min-w-[160px]"
              tabIndex={0}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm font-medium px-8 py-3 h-auto text-lg rounded-full min-w-[160px]"
              tabIndex={0}
            >
              Learn More
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating Cards */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Left floating card */}
        <motion.div
          className="absolute bottom-32 left-8 sm:left-16"
          initial={{ opacity: 0, x: -50, rotate: -15 }}
          animate={{ opacity: 1, x: 0, rotate: -12 }}
          transition={{ duration: 1, delay: 1 }}
          whileHover={{ rotate: -8, scale: 1.05 }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-48 transform rotate-12">
            <div className="space-y-2">
              <h3 className="font-bold text-black text-sm">Knowledge Analysis</h3>
              <div className="text-3xl font-black text-primary">87%</div>
              <div className="flex items-center gap-1 text-xs text-black/70">
                <TrendingUp className="h-3 w-3" />
                <span>+15% improvement</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right floating card */}
        <motion.div
          className="absolute bottom-40 right-8 sm:right-16"
          initial={{ opacity: 0, x: 50, rotate: 15 }}
          animate={{ opacity: 1, x: 0, rotate: 12 }}
          transition={{ duration: 1, delay: 1.2 }}
          whileHover={{ rotate: 8, scale: 1.05 }}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-48 transform -rotate-12">
            <div className="space-y-2">
              <h3 className="font-bold text-black text-sm">Pass Rate</h3>
              <div className="text-3xl font-black text-accent">92%</div>
              <div className="flex items-center gap-1 text-xs text-black/70">
                <Award className="h-3 w-3" />
                <span>First attempt success</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm py-6 z-30"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Active Users */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/30" />
                <div className="w-8 h-8 bg-white/25 rounded-full border-2 border-white/30" />
                <div className="w-8 h-8 bg-white/20 rounded-full border-2 border-white/30" />
              </div>
              <div className="text-white">
                <div className="font-bold text-lg">50+</div>
                <div className="text-xs text-white/70">Active Users</div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Plane className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <div className="font-medium">Built for pilots, by pilots</div>
                <div className="text-xs text-white/70">Aviation training expertise</div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 text-center text-white">
              <div>
                <div className="font-bold text-lg">15+</div>
                <div className="text-xs text-white/70">Beta Testing</div>
              </div>
              <div>
                <div className="font-bold text-lg">1.2K</div>
                <div className="text-xs text-white/70">Analysis Run</div>
              </div>
              <div>
                <div className="font-bold text-lg">5+</div>
                <div className="text-xs text-white/70">Weeks Available</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}