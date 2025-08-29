"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  FileCheck, 
  TrendingUp, 
  BookOpen,
  Users,
  Award,
  Clock,
  CheckCircle2
} from "lucide-react";
import { prefersReducedMotion } from "@/lib/utils";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeatureSection {
  id: string;
  title: string;
  subtitle: string;
  features: Feature[];
  mockup: React.ReactNode;
}

// Mockup Components
const LogbookMockup = () => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 h-80 flex flex-col">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
    </div>
    <div className="flex-1 space-y-3">
      <div className="flex items-center justify-between bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium">Cross Country Flight</span>
        </div>
        <span className="text-xs text-muted-foreground">2.5 hrs</span>
      </div>
      <div className="flex items-center justify-between bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-sm font-medium">Night Flying</span>
        </div>
        <span className="text-xs text-muted-foreground">1.8 hrs</span>
      </div>
      <div className="flex items-center justify-between bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Instrument Training</span>
        </div>
        <span className="text-xs text-muted-foreground">3.2 hrs</span>
      </div>
    </div>
    <div className="mt-4 text-center">
      <div className="text-2xl font-bold text-primary">94%</div>
      <div className="text-xs text-muted-foreground">Compliance Score</div>
    </div>
  </div>
);

const AnalyticsMockup = () => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 h-80 flex flex-col">
    <div className="mb-6">
      <h3 className="font-semibold text-sm mb-2">Progress Analytics</h3>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">156</div>
          <div className="text-xs text-muted-foreground">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">92%</div>
          <div className="text-xs text-muted-foreground">Pass Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">23</div>
          <div className="text-xs text-muted-foreground">Weak Areas</div>
        </div>
      </div>
    </div>
    <div className="flex-1 bg-white/80 rounded-lg p-4 flex items-end justify-between">
      <div className="w-8 h-16 bg-primary/30 rounded"></div>
      <div className="w-8 h-24 bg-primary/50 rounded"></div>
      <div className="w-8 h-20 bg-primary/40 rounded"></div>
      <div className="w-8 h-32 bg-primary rounded"></div>
      <div className="w-8 h-28 bg-primary/60 rounded"></div>
      <div className="w-8 h-12 bg-primary/20 rounded"></div>
    </div>
  </div>
);

const TrainingMockup = () => (
  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 h-80 flex flex-col">
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Training Schedule</h3>
        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">On Track</div>
      </div>
    </div>
    <div className="flex-1 space-y-3">
      <div className="bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium">Private Pilot</span>
        </div>
        <div className="text-xs text-muted-foreground ml-10">Complete - Checkride passed</div>
      </div>
      <div className="bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm font-medium">Instrument Rating</span>
        </div>
        <div className="text-xs text-muted-foreground ml-10">In Progress - 35% complete</div>
      </div>
      <div className="bg-white/80 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <Award className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm font-medium">Commercial Pilot</span>
        </div>
        <div className="text-xs text-muted-foreground ml-10">Planned - Prerequisites needed</div>
      </div>
    </div>
  </div>
);

const featureSections: FeatureSection[] = [
  {
    id: "logbook-analysis",
    title: "Smart Logbook Analysis",
    subtitle: "Track compliance, identify weaknesses, and stay checkride-ready with automated logbook analysis.",
    features: [
      {
        icon: <FileCheck className="h-5 w-5" />,
        title: "Automated Compliance Check",
        description: "Scan your logbook for FAR compliance and missing requirements."
      },
      {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Weakness Detection",
        description: "AI identifies your weakest ACS areas for focused study."
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: "Checkride Readiness",
        description: "Get your confidence score and know exactly what to review."
      }
    ],
    mockup: <LogbookMockup />
  },
  {
    id: "progress-analytics", 
    title: "Progress Analytics",
    subtitle: "See your training progress with detailed analytics and performance tracking.",
    features: [
      {
        icon: <TrendingUp className="h-5 w-5" />,
        title: "Performance Metrics",
        description: "Track your improvement over time with detailed charts."
      },
      {
        icon: <Clock className="h-5 w-5" />,
        title: "Time Analysis",
        description: "Optimize your training schedule with smart insights."
      },
      {
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: "Goal Tracking",
        description: "Set and achieve your aviation milestones systematically."
      }
    ],
    mockup: <AnalyticsMockup />
  },
  {
    id: "training-management",
    title: "Training Management",
    subtitle: "Manage your entire aviation training journey from private pilot to ATP.",
    features: [
      {
        icon: <BookOpen className="h-5 w-5" />,
        title: "Curriculum Planning",
        description: "Structured learning paths for all certificate levels."
      },
      {
        icon: <Users className="h-5 w-5" />,
        title: "Instructor Coordination", 
        description: "Connect with CFIs and track your training progress."
      },
      {
        icon: <Award className="h-5 w-5" />,
        title: "Certification Tracking",
        description: "Monitor requirements and deadlines for all ratings."
      }
    ],
    mockup: <TrainingMockup />
  }
];

export function BenefitZipperList() {
  const reducedMotion = prefersReducedMotion();

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Professional aviation training tools designed by CFIs, for CFIs and their students
          </p>
        </motion.div>

        {/* Feature Sections */}
        <div className="space-y-32">
          {featureSections.map((section, sectionIndex) => {
            const isEven = sectionIndex % 2 === 0;
            
            return (
              <motion.div
                key={section.id}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
                whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  isEven ? '' : 'md:grid-flow-col-dense'
                }`}
              >
                {/* Content Side */}
                <div className={`space-y-8 ${isEven ? '' : 'md:col-start-2'}`}>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold md:text-3xl">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {section.subtitle}
                    </p>
                  </div>
                  
                  {/* Feature List */}
                  <div className="space-y-6">
                    {section.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: isEven ? -20 : 20 }}
                        whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 0.4 + (featureIndex * 0.1)
                        }}
                        className="flex items-start gap-4"
                      >
                        <div className="bg-primary/10 rounded-lg p-3 text-primary shrink-0">
                          {feature.icon}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">
                            {feature.title}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Mockup Side */}
                <motion.div 
                  className={`${isEven ? '' : 'md:col-start-1'}`}
                  initial={reducedMotion ? { opacity: 0 } : { 
                    opacity: 0, 
                    scale: 0.9,
                    x: isEven ? 40 : -40
                  }}
                  whileInView={reducedMotion ? { opacity: 1 } : { 
                    opacity: 1, 
                    scale: 1,
                    x: 0
                  }}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.3,
                    ease: "easeOut"
                  }}
                >
                  {section.mockup}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-24 text-center"
        >
          <div className="glass rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">
              Ready to transform your training?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join 12,847+ pilots who've already accelerated their aviation career
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-premium text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                Start Free Analysis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border border-border rounded-lg font-medium hover:border-primary transition-colors"
              >
                View Demo
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}