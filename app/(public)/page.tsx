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
import { HeroVersionA } from "@/components/layout/HeroVersionA";
import { HeroVersionB } from "@/components/layout/HeroVersionB";
import { HeroVersionC } from "@/components/layout/HeroVersionC";
import { trackEvent } from "@/lib/analytics/telemetry";

export default function CFIProsHomePage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  
  // Hero version switching state - Default to Version C for production
  const [heroVersion, setHeroVersion] = useState<'A' | 'B' | 'C'>('C');
  
  // Track hero view on mount
  useEffect(() => {
    trackEvent('hero_view', {
      variant: `version_${heroVersion}`,
      url: window.location.href,
      referrer: document.referrer
    });
  }, [heroVersion]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Version Switcher - Development Only */}
      <div className="fixed top-4 left-4 z-50 flex gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
        <button
          onClick={() => setHeroVersion('A')}
          className={`px-3 py-1 text-xs rounded ${
            heroVersion === 'A' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Version A
        </button>
        <button
          onClick={() => setHeroVersion('B')}
          className={`px-3 py-1 text-xs rounded ${
            heroVersion === 'B' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Version B
        </button>
        <button
          onClick={() => setHeroVersion('C')}
          className={`px-3 py-1 text-xs rounded ${
            heroVersion === 'C' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Version C
        </button>
      </div>

      <main id="main">
        {heroVersion === 'A' && <HeroVersionA opacity={opacity} scale={scale} />}
        {heroVersion === 'B' && <HeroVersionB opacity={opacity} scale={scale} />}
        {heroVersion === 'C' && <HeroVersionC opacity={opacity} scale={scale} />}
        <LogoCloud />
        <NumberCounters />
        <FeatureMenu />
        <FeatureZipper />
        <WhyUs />
        <Testimonials />
        <Pricing />
        <CallToAction />
      </main>
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
    <section className="py-16 border-y border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by leading flight schools worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {logos.map((logo, i) => (
            <motion.div
              key={logo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
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
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold">
                <span className="text-gradient">{stat.value.toLocaleString()}</span>
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed by CFIs, for CFIs and their students
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-4">
          {items.map((item, i) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setActive(item.key)}
              className={`group relative p-6 rounded-xl transition-all ${
                active === item.key
                  ? "glass border-primary shadow-lg"
                  : "glass-hover border-border"
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`mb-3 p-3 rounded-lg ${
                    active === item.key ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  {item.icon}
                </div>
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {active === item.key && (
                <motion.div
                  layoutId="activeFeature"
                  className="absolute inset-0 border-2 border-primary rounded-xl"
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
          className="mt-8 card-premium p-0 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-chart-2" />
            </div>
          </div>
          <div className="aspect-[16/9] grid place-items-center p-12">
            <div className="text-center">
              <div className="mb-4 inline-flex p-4 rounded-xl bg-primary/10">
                {items.find((i) => i.key === active)?.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">
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

// Feature Zipper with Glass Cards
function FeatureZipper() {
  const features = [
    {
      key: "ai",
      title: "AI-Powered Analysis",
      desc: "Machine learning identifies your weak areas and creates personalized study plans.",
      icon: <Zap className="h-5 w-5" />,
    },
    {
      key: "ocr",
      title: "Smart OCR & Cleanup",
      desc: "Upload any logbook format - we'll extract and organize the data automatically.",
      icon: <FileSearch className="h-5 w-5" />,
    },
    {
      key: "realtime",
      title: "Real-time Progress",
      desc: "Track improvement with detailed analytics and performance metrics.",
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      key: "secure",
      title: "Bank-level Security",
      desc: "Your data is encrypted and protected with enterprise-grade security.",
      icon: <Shield className="h-5 w-5" />,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for modern training
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Advanced technology meets practical aviation training
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group glass-hover rounded-xl p-6 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why CFIPros?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The platform trusted by professional pilots worldwide
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {items.map((item) => (
            <motion.button
              key={item.key}
              whileHover={{ y: -4 }}
              onClick={() => setActive(item.key)}
              className={`p-6 rounded-xl border transition-all ${
                active === item.key
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-3">{item.icon}</div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
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
      content: "CFIPros cut my checkride prep time in half. The ACS analysis is incredibly accurate.",
      rating: 5,
    },
    {
      name: "Mike Johnson",
      role: "Part 141 Chief Instructor",
      content: "We've integrated CFIPros into our entire program. Student pass rates are up 23%.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Commercial Pilot",
      content: "The logbook auditor found issues I never knew existed. Saved me from a checkride bust!",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by pilots everywhere
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-premium p-6"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm mb-4 text-muted-foreground">
                "{testimonial.content}"
              </p>
              <div>
                <p className="font-semibold text-sm">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
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
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
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
                  <span className="bg-gradient-premium text-white text-xs px-3 py-1 rounded-full">
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
                  <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
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
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl bg-gradient-premium p-12 md:p-16 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to accelerate your training?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
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

