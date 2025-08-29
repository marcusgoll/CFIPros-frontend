"use client";

import React, { useState, useEffect } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import {
  FileSearch,
  LineChart,
  GraduationCap,
  Check,
  Award,
  TrendingUp,
  Clock,
  Globe,
  Zap,
  Shield,
  Star,
  ArrowRightCircle,
} from "lucide-react";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HeroVersionC } from "@/components/layout/HeroVersionC";
import {
  FeatureSpotlightMenu,
  FEATURE_SCREENSHOTS,
  DEFAULT_FEATURES,
} from "@/components/layout/FeatureSpotlightMenu";
import { FeatureScreenshotDisplay } from "@/components/layout/FeatureScreenshotDisplay";
import { VideoModal } from "@/components/layout/VideoModal";
import { BenefitZipperList } from "@/components/sections/BenefitZipperList";
import { trackEvent } from "@/lib/analytics/telemetry";
import { prefersReducedMotion } from "@/lib/utils";

export default function CFIProsHomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Feature selection state - match FeatureSpotlightMenu default
  const defaultIndex = Math.floor(DEFAULT_FEATURES.length / 2);
  const defaultFeature = DEFAULT_FEATURES[defaultIndex]?.id || "upload";
  const [selectedFeature, setSelectedFeature] = useState(defaultFeature);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const reducedMotion = prefersReducedMotion();

  // Helper function to format feature names
  const getFeatureName = (featureId: string) => {
    const nameMap: Record<string, string> = {
      upload: "Upload",
      analyzer: "Analyzer",
      planner: "Planner",
      lessons: "Lessons",
      quizzes: "Quizzes",
      "acs-lib": "ACS Library",
      dashboard: "Dashboard",
      schools: "Schools",
      reports: "Reports",
    };
    return (
      nameMap[featureId] ||
      featureId.charAt(0).toUpperCase() + featureId.slice(1)
    );
  };

  // Track hero view on mount
  useEffect(() => {
    trackEvent("hero_view", {
      variant: "version_C",
      url: window.location.href,
      referrer: document.referrer,
    });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <main id="main">
        <HeroVersionC opacity={opacity} scale={scale} />

        {/* Feature Spotlight Menu */}
        <section className="to-muted/20 bg-gradient-to-b from-background pb-8 pt-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: reducedMotion ? 0 : 0.2 }}
            >
              <FeatureSpotlightMenu
                onSelect={(featureId) => {
                  trackEvent("feature_spotlight_click", {
                    feature: featureId,
                    section: "landing_page",
                  });
                  setSelectedFeature(featureId);
                }}
              />
            </motion.div>
          </div>
        </section>

        {/* Feature Screenshot Display */}
        <section className="bg-muted/20 pb-6">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <FeatureScreenshotDisplay
              featureId={selectedFeature}
              featureName={getFeatureName(selectedFeature)}
              screenshotUrl={
                FEATURE_SCREENSHOTS[selectedFeature] ||
                FEATURE_SCREENSHOTS.upload
              }
              onPlayClick={(featureId) => {
                trackEvent("feature_preview_video", {
                  feature: featureId,
                  section: "landing_page",
                });
                setVideoModalOpen(true);
              }}
            />
          </div>
        </section>

        <LogoCloud />
        <NumberCounters />
        <FeatureMenu />
        <BenefitZipperList 
          onSectionView={(sectionId) => {
            trackEvent("benefit_section_view", {
              section: sectionId,
              page: "landing_page",
            });
          }}
          onFeatureInteraction={(sectionId, featureIndex) => {
            trackEvent("benefit_feature_interaction", {
              section: sectionId,
              feature_index: featureIndex,
              page: "landing_page",
            });
          }}
        />
        <WhyUs />
        <Testimonials />
        <Pricing />
        <CallToAction />
      </main>

      {/* Video Modal */}
      <VideoModal
        featureId={selectedFeature}
        featureName={getFeatureName(selectedFeature)}
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />
    </div>
  );
}

// Logo Cloud
function LogoCloud() {
  const logos = [
    "FlightSafety",
    "ATP Flight School",
    "Embry-Riddle",
    "CAE",
    "King Schools",
    "Sporty's",
  ];

  return (
    <section className="bg-muted/30 border-y border-border py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Trusted by leading flight schools worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo, i) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              <span className="font-semibold">{logo}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Animated Number Counters
function NumberCounters() {
  const stats = [
    { label: "Students Trained", value: 12847, suffix: "+" },
    { label: "CFI Partners", value: 892, suffix: "" },
    { label: "Success Rate", value: 94, suffix: "%" },
    { label: "Hours Saved", value: 156, suffix: "K" },
  ];

  return (
    <section className="to-muted/20 bg-gradient-to-b from-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl font-bold md:text-5xl">
                <span className="text-gradient">
                  {stat.value.toLocaleString()}
                </span>
                <span className="text-primary">{stat.suffix}</span>
              </div>
              <p className="mt-2 text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Premium Feature Menu with Glass Cards
function FeatureMenu() {
  const items = [
    {
      key: "auditor",
      label: "Logbook",
      icon: <FileSearch className="h-5 w-5" />,
      description: "Automated compliance checking",
    },
    {
      key: "extractor",
      label: "ACS Extractor",
      icon: <LineChart className="h-5 w-5" />,
      description: "Smart weakness detection",
    },
    {
      key: "school",
      label: "Ground School",
      icon: <GraduationCap className="h-5 w-5" />,
      description: "Complete training platform",
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      description: "Progress tracking",
    },
  ];

  const [active, setActive] = useState("extractor");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Everything you need to succeed
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Comprehensive tools designed by CFIs, for CFIs and their students
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-4">
          {items.map((item, i) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setActive(item.key)}
              className={`group relative rounded-xl p-6 transition-all ${
                active === item.key
                  ? "glass border-primary shadow-lg"
                  : "glass-hover border-border"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-3 rounded-lg p-3 ${
                    active === item.key ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {item.icon}
                </div>
                <h3 className="mb-1 font-semibold">{item.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              {active === item.key && (
                <motion.div
                  layoutId="activeFeature"
                  className="absolute inset-0 rounded-xl border-2 border-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Feature preview */}
        <motion.div
          key={active}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="card-premium mt-8 overflow-hidden p-0"
        >
          <div className="from-primary/5 to-accent/5 bg-gradient-to-r p-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <div className="bg-warning h-3 w-3 rounded-full" />
              <div className="h-3 w-3 rounded-full bg-chart-2" />
            </div>
          </div>
          <div className="grid aspect-[16/9] place-items-center p-12">
            <div className="text-center">
              <div className="bg-primary/10 mb-4 inline-flex rounded-xl p-4">
                {items.find((i) => i.key === active)?.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                {items.find((i) => i.key === active)?.label}
              </h3>
              <p className="text-muted-foreground">
                Interactive demo coming soon
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


// Interactive Why Us Section
function WhyUs() {
  const items = [
    {
      key: "fast",
      title: "Lightning Fast",
      desc: "Get started in under 60 seconds",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      key: "global",
      title: "Works Everywhere",
      desc: "Support for all aviation authorities",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      key: "certified",
      title: "CFI Approved",
      desc: "Built with instructor input",
      icon: <Award className="h-5 w-5" />,
    },
  ];

  const [active, setActive] = useState(items[0].key);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why CFIPros?</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            The platform trusted by professional pilots worldwide
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <motion.button
              key={item.key}
              whileHover={{ y: -4 }}
              onClick={() => setActive(item.key)}
              className={`rounded-xl border p-6 transition-all ${
                active === item.key
                  ? "bg-primary/5 border-primary shadow-lg"
                  : "hover:border-primary/50 border-border"
              }`}
            >
              <div className="mb-3">{item.icon}</div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "ATP, CFII",
      content:
        "CFIPros cut my checkride prep time in half. The ACS analysis is incredibly accurate.",
      rating: 5,
    },
    {
      name: "Mike Johnson",
      role: "Part 141 Chief Instructor",
      content:
        "We've integrated CFIPros into our entire program. Student pass rates are up 23%.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Commercial Pilot",
      content:
        "The logbook auditor found issues I never knew existed. Saved me from a checkride bust!",
      rating: 5,
    },
  ];

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Loved by pilots everywhere
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-premium p-6"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">
                "{testimonial.content}"
              </p>
              <div>
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Premium Pricing Section
function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "Basic ACS lookup",
        "2 uploads per month",
        "Community support",
        "Basic study plans",
      ],
      cta: "Start free",
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: [
        "Unlimited uploads",
        "AI-powered analysis",
        "Priority support",
        "Advanced study plans",
        "Progress tracking",
        "Export reports",
      ],
      cta: "Start Pro trial",
      popular: true,
    },
    {
      name: "School",
      price: "Custom",
      period: "",
      features: [
        "Everything in Pro",
        "White-label options",
        "Cohort analytics",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      cta: "Contact sales",
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative ${tier.popular ? "scale-105" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="rounded-full bg-gradient-premium px-3 py-1 text-xs text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div
                className={`h-full rounded-xl p-6 ${
                  tier.popular
                    ? "glass border-primary shadow-xl"
                    : "card-premium"
                }`}
              >
                <div className="mb-6">
                  <h3 className="mb-2 text-xl font-semibold">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-5 w-5 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <PremiumButton
                  variant={tier.popular ? "gradient" : "outline"}
                  className="w-full"
                  glow={true}
                >
                  {tier.cta}
                </PremiumButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Premium CTA Section
function CallToAction() {
  return (
    <section className="from-muted/30 bg-gradient-to-b to-background py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-premium p-12 text-center md:p-16"
        >
          <div className="from-primary/20 to-accent/20 absolute inset-0 bg-gradient-to-br" />
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              Ready to accelerate your training?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-white/90">
              Join thousands of pilots who are training smarter, not harder
            </p>
            <Link href="/upload">
              <PremiumButton
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightCircle className="h-5 w-5" />}
                className="bg-white text-primary hover:bg-white/90"
              >
                Start your free analysis
              </PremiumButton>
            </Link>
            <p className="mt-4 text-sm text-white/70">
              No credit card required • 5-minute setup
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
