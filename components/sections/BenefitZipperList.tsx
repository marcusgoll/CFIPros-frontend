"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  FileSearch, 
  TrendingUp, 
  Shield,
  Target,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { prefersReducedMotion } from "@/lib/utils";

interface BenefitItem {
  key: string;
  title: string;
  benefit: string;
  description: string;
  icon: React.ReactNode;
  stats?: {
    value: string;
    label: string;
  };
}

// Cessna SVG Component with primary color fill
const CessnaPlane = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 931.73 678.92"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-primary"
      d="M14.35,393.42c2.28,17.75,4.23,35.74,5.6,53.61.38,4.44.88,9.21,2.27,13.48,2.44,8.34,7.57,16.06,14.93,20.99,3.48,2.2,7.05,4,11.19,4.77.79.2,234.65,2.48,352.06,3.65l10.6,108.53c.01,2.8.71,12.69,9.32,21.7,6.36,6.66,15.37,11.09,26.87,13.28.48,2.37.96,4.59,1.45,6.66h-78.58s-2.15,0-2.15,0c-4.14,0-7.5,3.36-7.5,7.5s3.36,7.5,7.5,7.5h2.15s83.24,0,83.24,0c1.49,3.46,5.08,10.51,12.32,10.44.09,0,.17,0,.25-.01.08,0,.17.01.25.01.04,0,.08,0,.12,0,7.14,0,10.72-7,12.2-10.44h83.24s2.15,0,2.15,0c4.14,0,7.5-3.36,7.5-7.5s-3.36-7.5-7.5-7.5h-2.15s-78.58,0-78.58,0c.49-2.07.97-4.29,1.45-6.66,11.5-2.19,20.51-6.63,26.87-13.28,8.61-9.01,9.31-18.9,9.32-21.7l10.59-108.51c117.34-1.19,350.91-3.57,350.91-3.57.79.06,1.87-.29,2.49-.39,9.67-2.49,17.84-9.89,22.13-18.69l1.51-3.36s1.14-3.43,1.14-3.43c1.37-4.28,1.88-9.04,2.27-13.48,1.38-17.86,3.32-35.86,5.6-53.61.52-3.83-2-7.48-5.84-8.32l-199.67-43.33c-.5-.11-1.06-.17-1.59-.17h-172.03s36.36-41.14,36.36-41.14v13.81c0,5.52,4.48,10,10,10,5.52,0,10-4.48,10-10v-49.33c0-5.52-4.48-10-10-10-5.52,0-10,4.48-10,10v12.88s-52.12,58.97-52.12,58.97c-2.7-19.73-26.6-194.17-28.28-206.46,23.95-5.11,69.33-14.88,87.69-18.77,2.1-.43,5-1.1,7.14-1.53,3.73-.8,6.86-2.83,9.54-5.28,6.22-6.04,8.34-14.95,8.03-23.06l-4.89-37.33c-.43-3.32-3.07-6.06-6.55-6.47,0,0-100.44-12-100.44-12-2.66-.34-5.42.79-7.04,3.16-5,7.37-9.83,14.85-14.57,22.39v-30.54c0-4.14-3.36-7.5-7.5-7.5s-7.5,3.36-7.5,7.5v29.72c-4.57-7.26-9.23-14.47-14.06-21.56-1.52-2.21-4.2-3.51-7.04-3.16,0,0-100.44,12-100.44,12-3.32.4-6.09,3-6.55,6.47l-4.89,37.33c-.31,8.11,1.81,17.03,8.03,23.06,2.73,2.51,5.96,4.58,9.78,5.33,1.86.42,4.98,1.04,6.89,1.47,18.51,3.98,63.58,13.59,87.69,18.76-1.68,12.28-25.58,186.74-28.29,206.47l-52.12-58.97v-12.88c0-5.52-4.48-10-10-10-5.52,0-10,4.48-10,10v49.33c0,5.52,4.48,10,10,10,5.52,0,10-4.48,10-10v-13.81s36.36,41.14,36.36,41.14c-34.15,0-172.03,0-172.03,0-.51,0-1.07.06-1.59.17,0,0-199.67,43.33-199.67,43.33-3.76.83-6.36,4.43-5.84,8.32ZM467.12,640.1h-2.52c-.44-1.61-.87-3.32-1.28-5.09.76.01,1.51.04,2.28.04.09,0,.17,0,.26,0,.09,0,.17,0,.26,0,.77,0,1.52-.02,2.28-.04-.41,1.77-.84,3.48-1.28,5.09ZM886.26,394.97c3.03.66,14.39,3.12,15.39,3.34-.71,5.77-1.39,11.52-2.01,17.3-1.06,10.02-2.1,20.2-2.83,30.29-.12,1.66-.35,3.74-.57,5.41-.89,6.08-3.53,12.43-8.27,16.4-1.55,1.44-3.97,2.69-5.94,3.41l4.22-76.14ZM715.09,357.82c10.02,2.17,117.89,25.59,161.28,35l-.83,14.94-160.85-31.16.4-18.78ZM874.98,417.84l-2.98,53.76c-45.24.48-250.06,2.21-350.53,3.26l-1.52-89.15h189.18s165.85,32.13,165.85,32.13ZM705.11,356.6l-.4,19.11h-184.94s-.33-19.11-.33-19.11h185.67ZM591.65,83.04c-.14,4.3-.84,8.95-4.23,11.5-.49.38-1.12.69-1.45.79,0,0-7.07,1.52-7.07,1.52-19.41,4.17-67.96,14.52-91.07,19.48l-3.17-42.64h105.76c.48,3.66,1.19,9.07,1.23,9.36ZM497.29,41.29c16.07,1.92,72.07,8.61,90.3,10.79.4,3.04.76,5.83,1.52,11.61h-105.19s-.31-4.18-.31-4.18c4.64-6.02,9.22-12.09,13.68-18.22ZM344.13,52.08c18.22-2.18,74.22-8.87,90.3-10.79,4.47,6.13,9.04,12.21,13.68,18.23l-.31,4.17h-105.19c.76-5.78,1.12-8.57,1.52-11.61ZM345.76,95.33c-.61-.16-1.63-.89-2.21-1.41-.21-.28-.49-.47-.69-.78-2.12-2.6-2.66-6.53-2.78-10.11.04-.3.75-5.69,1.22-9.34h105.76s-3.17,42.65-3.17,42.65c-26.02-5.55-74.84-16.04-98.14-21.01ZM452.93,128.36c.09-.32.15-.65.18-1l.05-.62c.11-.84.18-1.28.18-1.28.07-.54.08-1.07.04-1.59l3.91-52.62c.2.25.4.51.6.76.07.1.16.2.23.3v1.46c0,.43.04.85.11,1.26-.57,10.16.13,21.19-.09,29.77.07,28.55.51,61.21,1.12,89.83.35,14.97.73,29.94,1.36,44.92.12,2.56,2.18,4.68,4.79,4.79.12,0,.24-.02.36-.02.05,0,.1.02.15.02,2.76.12,5.09-2.03,5.21-4.79.63-14.97,1.01-29.94,1.36-44.92.61-28.59,1.05-61.31,1.12-89.83-.24-9.24.59-21.36-.25-32.14.17-.22.34-.43.5-.65.2-.25.4-.51.6-.76l3.9,52.59c-.04.53-.04,1.07.04,1.62l.18,1.28.05.62c.03.34.09.67.17.99l25.32,184.81c-3.95-2.9-9.04-5.4-14.9-5.4-12.13,0-20.95,0-23.1,0h-.52c-2.15,0-10.97,0-23.1,0-5.85,0-10.94,2.49-14.9,5.4,7.95-58.01,22.72-165.81,25.32-184.81ZM422.38,350.98c.07-.28.13-.56.17-.86,0,0,.04-.29.11-.83l3.91,3.73c5.09,4.86,11.86,7.57,18.9,7.57h20.13s.52,0,.52,0h20.35c6.9,0,13.53-2.66,18.52-7.42l4.07-3.89.11.83c.04.29.1.58.17.86l2.12,123.99c-26.84.29-44.22.51-45.8.63-3.14-.06-20.06-.25-45.4-.5l2.12-124.11ZM436.47,528.38c.08,0,.17,0,.25,0h.52s57.26,0,57.26,0h.52c.08,0,.17,0,.25,0,4.63-.15,11.1-1.91,17.35-6.29l-7.35,75.32c-.04.42-.06.61-.03,1.01,0,.7-.23,6.39-5.41,11.64-6.43,6.5-18.16,9.95-33.94,9.99-15.78-.04-27.52-3.49-33.94-9.99-5.19-5.25-5.41-10.94-5.41-11.64.03-.4,0-.59-.03-1.01l-7.35-75.32c6.24,4.38,12.71,6.13,17.35,6.29ZM412.28,356.6l-.33,19.11h-184.94s-.4-19.11-.4-19.11h185.67ZM222.6,385.71h189.18s-1.52,89.28-1.52,89.28c-100.47-1-305.25-2.9-350.53-3.39l-2.98-53.75,165.85-32.13ZM216.64,357.82l.4,18.78-160.85,31.16-.83-14.94c43.39-9.42,151.26-32.83,161.28-35ZM45.46,394.97l4.22,76.18c-5.55-1.88-10.16-6.96-12.35-12.66-.78-2.39-1.53-4.62-1.85-7.18,0,0-.3-2.57-.3-2.57-.05-.44-.11-.82-.15-1.32-1.24-16.43-2.95-32.76-4.96-49.11,1-.22,12.37-2.68,15.4-3.34Z"
    />
  </svg>
);

const benefits: BenefitItem[] = [
  {
    key: "smart-analysis",
    title: "AI-Powered Weakness Detection",
    benefit: "Cut study time by 60%",
    description: "Our machine learning algorithms analyze your logbook entries and identify the specific ACS areas where you need the most practice. No more guessing what to study next.",
    icon: <Zap className="h-6 w-6" />,
    stats: {
      value: "60%",
      label: "Less Study Time"
    }
  },
  {
    key: "instant-upload",
    title: "Smart Document Processing",
    benefit: "5 minutes to complete analysis",
    description: "Upload any logbook format - handwritten, digital, or PDF. Our OCR technology extracts and organizes all your flight data automatically with 99.2% accuracy.",
    icon: <FileSearch className="h-6 w-6" />,
    stats: {
      value: "99.2%",
      label: "Accuracy Rate"
    }
  },
  {
    key: "progress-tracking",
    title: "Real-Time Progress Monitoring",
    benefit: "23% higher pass rates",
    description: "Track your improvement with detailed analytics and performance metrics. See exactly where you stand and what you need to work on before your checkride.",
    icon: <TrendingUp className="h-6 w-6" />,
    stats: {
      value: "23%",
      label: "Higher Pass Rate"
    }
  },
  {
    key: "security-first",
    title: "Bank-Level Data Protection",
    benefit: "100% secure and private",
    description: "Your sensitive flight data is protected with enterprise-grade encryption and security measures. We never share your information with third parties.",
    icon: <Shield className="h-6 w-6" />,
    stats: {
      value: "256-bit",
      label: "Encryption"
    }
  },
  {
    key: "instant-results",
    title: "Immediate Actionable Insights",
    benefit: "Know exactly what to study",
    description: "Get your personalized study plan instantly. No waiting, no manual review - just clear, actionable recommendations based on your specific needs.",
    icon: <Target className="h-6 w-6" />,
    stats: {
      value: "<60s",
      label: "Analysis Time"
    }
  },
  {
    key: "checkride-ready",
    title: "Checkride Success Guarantee",
    benefit: "94% first-time pass rate",
    description: "Join thousands of pilots who've used CFIPros to pass their checkrides. Our comprehensive analysis ensures you're fully prepared for any examiner question.",
    icon: <CheckCircle2 className="h-6 w-6" />,
    stats: {
      value: "94%",
      label: "Pass Rate"
    }
  }
];

export function BenefitZipperList() {
  const reducedMotion = prefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Use intersection observer and scroll listener for more reliable tracking
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || reducedMotion) return;

    const handleScroll = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calculate progress based on element position relative to viewport
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Progress from when element starts entering viewport to when it fully exits
      const totalScrollDistance = viewportHeight + elementHeight;
      const scrolled = viewportHeight - elementTop;
      const progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));
      
      setScrollProgress(progress);
    };

    handleScroll(); // Initial call
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [reducedMotion]);

  // Calculate plane position based on scroll progress
  const planeY = typeof window !== 'undefined' ? scrollProgress * window.innerHeight * 0.8 : 0;
  const planeOpacity = scrollProgress > 0.1 && scrollProgress < 0.9 ? 1 : 0;

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-6 relative">
        {/* Section Header */}
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Transform Your Training
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            See why thousands of pilots choose CFIPros to accelerate their aviation career
          </p>
        </motion.div>

        {/* Zipper Layout */}
        <div className="relative">
          {/* Central connecting line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-primary/50 to-primary/20 hidden md:block transform -translate-x-0.5" />
          
          {/* Animated Cessna Plane */}
          {!reducedMotion && (
            <div
              className="absolute left-1/2 w-16 h-12 z-20 pointer-events-none hidden md:block -translate-x-1/2 transition-all duration-75"
              style={{
                transform: `translateY(${planeY}px)`,
                opacity: planeOpacity,
                top: 0
              }}
            >
              <CessnaPlane className="w-full h-full drop-shadow-lg" />
            </div>
          )}
          
          {benefits.map((benefit, index) => {
            const isEven = index % 2 === 0;
            
            return (
              <motion.div
                key={benefit.key}
                initial={reducedMotion ? { opacity: 0 } : { 
                  opacity: 0, 
                  x: isEven ? -40 : 40,
                  y: 20 
                }}
                whileInView={reducedMotion ? { opacity: 1 } : { 
                  opacity: 1, 
                  x: 0, 
                  y: 0 
                }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
                className={`relative mb-16 md:mb-20 flex items-center ${
                  isEven ? 'md:justify-start' : 'md:justify-end'
                }`}
              >
                {/* Content Card */}
                <div className={`
                  glass-hover relative max-w-lg rounded-xl p-6 md:p-8 w-full md:w-auto shadow-lg hover:shadow-xl transition-shadow duration-300
                  ${isEven ? 'md:mr-12' : 'md:ml-12'}
                `}>
                  {/* Connection dot */}
                  <div className={`
                    absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg hidden md:block z-10
                    ${isEven ? '-right-14' : '-left-14'}
                  `} />
                  
                  {/* Icon and Stats Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-3 text-primary">
                        {benefit.icon}
                      </div>
                      {benefit.stats && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {benefit.stats.value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {benefit.stats.label}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold">
                      {benefit.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-primary font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm">{benefit.benefit}</span>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>

                  {/* Arrow indicator for mobile */}
                  <div className="mt-4 flex items-center justify-end md:hidden">
                    <ArrowRight className="h-4 w-4 text-primary/60" />
                  </div>
                </div>
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
          className="mt-16 text-center"
        >
          <div className="glass rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">
              Ready to experience these benefits?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join 12,847+ pilots who've already transformed their training
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