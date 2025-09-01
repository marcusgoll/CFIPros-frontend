// Pricing data module for better code splitting and maintainability

export interface PricingTier {
  id: string;
  name: string;
  subtitle?: string;
  monthlyPrice: string | number;
  yearlyPrice?: string | number;
  period: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  ctaLink?: string;
  highlight?: boolean;
  badge?: string;
  icon?: string; // Icon name for Lucide icons
}

export interface CreditService {
  name: string;
  price: string;
  unit: string;
  description?: string;
  margin?: string;
  addon?: string;
  popular?: boolean;
}

export interface ComparisonFeature {
  name: string;
  description: string;
  free: boolean | string;
  pro: boolean | string;
  cfi: boolean | string;
  school: boolean | string;
}

export interface FeatureCategory {
  category: string;
  features: ComparisonFeature[];
}

// Animation constants
export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 100,
  DURATION_NORMAL: 200,
  DURATION_SLOW: 300,
  STAGGER_DELAY: 0.1,
  TRANSITION_EASING: "ease-in-out",
} as const;

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: "forever",
    description: "Perfect for trying out our tools",
    features: [
      "Try all mini tools (daily limits)",
      "Preview personalized study plans",
      "Save up to 3 analysis results",
      "Basic logbook compliance checks",
      "ACS reference database access",
      "Community support forum",
    ],
    cta: "Get Started Free",
    ctaLink: "/signup?plan=free",
    icon: "Sparkles",
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Individual Pilot",
    monthlyPrice: 15,
    yearlyPrice: 150,
    period: "month",
    description: "Everything you need to pass your checkride",
    features: [
      "Unlimited daily tools (W&B, Crosswind, AKTR→ACS)",
      "Currency tracking (Night/IFR requirements)",
      "8710 eligibility checker & hour reconciliation",
      "Adaptive flashcards & unlimited practice tests",
      "CFI-AI tutor with official ACS citations",
      "Credits for OCR & audit services",
      "+2 more features",
    ],
    cta: "Start 14-Day Free Trial",
    ctaLink: "/signup?plan=pro",
    highlight: true,
    badge: "Most Popular",
    icon: "Users",
  },
  {
    id: "cfi",
    name: "CFI",
    subtitle: "Instructor",
    monthlyPrice: 39,
    yearlyPrice: 390,
    period: "month",
    description: "Manage students & grow your instruction business",
    features: [
      "Everything in Pro, plus:",
      "Student progress dashboards & readiness scores",
      "Complete endorsement library (FAR 61.x)",
      "3 comprehensive logbook audits included/month",
      "Weather-backup lesson plan generator",
      "CFI billing tracker & timesheet export",
      "+4 more features",
    ],
    cta: "Start CFI Free Trial",
    ctaLink: "/signup?plan=cfi",
    icon: "CreditCard",
  },
  {
    id: "school",
    name: "School",
    subtitle: "Part 61/141",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    period: "month",
    description: "Complete training management for flight schools",
    features: [
      "Everything in CFI, plus:",
      "Up to 10 instructor accounts included",
      "Cohort analytics & fleet readiness tracking",
      "DPE scheduling alerts & examiner insights",
      "Insurance compliance & currency tracking",
      "Multi-instructor coordination dashboard",
      "+4 more features",
    ],
    cta: "Schedule Demo",
    ctaLink: "/contact-sales?plan=school",
    badge: "Enterprise",
    icon: "Building2",
  },
];

export const CREDIT_SERVICES: CreditService[] = [
  {
    name: "Logbook OCR Processing",
    price: "$15",
    unit: "50 pages",
    description: "Convert paper logbooks to digital format instantly",
    margin: "≥70% accuracy guaranteed",
  },
  {
    name: "Complete Checkride Audit",
    price: "$49",
    unit: "comprehensive review",
    description: "Full IACRA readiness & compliance verification",
    addon: "Human CFI Review +$49",
    popular: true,
  },
  {
    name: "Bulk Import Service",
    price: "$25",
    unit: "100 flight entries",
    description: "Import from ForeFlight, LogTen Pro, or any CSV",
  },
  {
    name: "Custom Training Reports",
    price: "$35",
    unit: "detailed report",
    description: "School analytics, progress tracking, & insights",
  },
];

export const WHITE_LABEL_ADDON = {
  name: "White-Label Add-On",
  monthlyPrice: 199,
  yearlyPrice: 1990,
  features: [
    "Your school's branding",
    "Custom domain (school.cfipros.com)",
    "Branded student portal",
    "Custom color scheme",
    "Remove CFIPros branding",
    "Marketing materials included",
  ],
};

export const FEATURE_COMPARISON_DATA: FeatureCategory[] = [
  {
    category: "Core Tools",
    features: [
      {
        name: "AKTR→ACS Mapper",
        description:
          "Map FAA test questions to specific ACS areas for targeted study",
        free: "3/day",
        pro: "Unlimited",
        cfi: "Unlimited",
        school: "Unlimited",
      },
      {
        name: "Crosswind Calculator",
        description:
          "Calculate crosswind components for runway planning and training",
        free: "5/day",
        pro: "Unlimited",
        cfi: "Unlimited",
        school: "Unlimited",
      },
      {
        name: "Weight & Balance",
        description:
          "Compute aircraft weight, CG, and loading for different configurations",
        free: "3/day",
        pro: "Unlimited",
        cfi: "Unlimited",
        school: "Unlimited",
      },
      {
        name: "Currency Trackers",
        description:
          "Track night, passenger, and instrument currency requirements automatically",
        free: false,
        pro: true,
        cfi: true,
        school: true,
      },
      {
        name: "8710 Eligibility",
        description:
          "Verify eligibility requirements and totals reconciliation for certificates and ratings",
        free: false,
        pro: true,
        cfi: true,
        school: true,
      },
    ],
  },
  {
    category: "Study Tools",
    features: [
      {
        name: "Practice Tests",
        description:
          "FAA-style practice exams with detailed explanations and ACS references",
        free: "Preview only",
        pro: "Full access",
        cfi: "Full access",
        school: "Full access",
      },
      {
        name: "SRS Flashcards",
        description:
          "Spaced repetition system flashcards that adapt to your learning progress",
        free: false,
        pro: true,
        cfi: true,
        school: true,
      },
      {
        name: "CFI-AI Tutor",
        description:
          "AI-powered tutor with official ACS citations and personalized explanations",
        free: false,
        pro: true,
        cfi: true,
        school: true,
      },
      {
        name: "Study Plans",
        description:
          "Personalized study plans based on your test results and weak areas",
        free: "Preview only",
        pro: "Customizable",
        cfi: "Customizable",
        school: "Customizable",
      },
    ],
  },
  {
    category: "Instructor Tools",
    features: [
      {
        name: "Student Management",
        description:
          "Organize student folders with progress tracking and readiness scores",
        free: false,
        pro: false,
        cfi: true,
        school: true,
      },
      {
        name: "Endorsement Library",
        description:
          "Complete FAR 61.x endorsement library with customizable templates",
        free: false,
        pro: false,
        cfi: true,
        school: true,
      },
      {
        name: "Lesson Builder",
        description:
          "Create weather-backup lesson plans and structured training curricula",
        free: false,
        pro: false,
        cfi: true,
        school: true,
      },
      {
        name: "Progress Tracking",
        description:
          "Monitor individual student progress with detailed analytics and insights",
        free: false,
        pro: false,
        cfi: true,
        school: true,
      },
      {
        name: "Full Audits Included",
        description:
          "Comprehensive logbook audits with IACRA readiness verification",
        free: false,
        pro: false,
        cfi: "3/month",
        school: "10/month",
      },
    ],
  },
  {
    category: "School Features",
    features: [
      {
        name: "Instructor Seats",
        description:
          "Number of instructor accounts included in your subscription",
        free: false,
        pro: false,
        cfi: "1",
        school: "10+",
      },
      {
        name: "Cohort Analytics",
        description:
          "Track fleet-wide student progress and aggregate readiness metrics",
        free: false,
        pro: false,
        cfi: false,
        school: true,
      },
      {
        name: "DPE Radar",
        description:
          "Get alerts for DPE scheduling opportunities and examiner insights",
        free: false,
        pro: false,
        cfi: false,
        school: true,
      },
      {
        name: "Compliance Tracker",
        description:
          "Monitor insurance requirements and regulatory compliance across your fleet",
        free: false,
        pro: false,
        cfi: false,
        school: true,
      },
      {
        name: "API Access",
        description:
          "Integrate with your existing school management systems via REST API",
        free: false,
        pro: false,
        cfi: false,
        school: true,
      },
      {
        name: "White-Label Option",
        description:
          "Custom branding and domain for your school's personalized platform",
        free: false,
        pro: false,
        cfi: false,
        school: "Add-on",
      },
    ],
  },
  {
    category: "Support",
    features: [
      {
        name: "Community Support",
        description: "Access to community forums and peer-to-peer assistance",
        free: true,
        pro: true,
        cfi: true,
        school: true,
      },
      {
        name: "Email Support",
        description: "Priority email support with faster response times",
        free: false,
        pro: "Priority",
        cfi: "Priority",
        school: "Priority",
      },
      {
        name: "Phone Support",
        description:
          "Direct phone access to our support team for urgent issues",
        free: false,
        pro: false,
        cfi: true,
        school: true,
      },
      {
        name: "Dedicated Manager",
        description:
          "Assigned customer success manager for personalized onboarding and support",
        free: false,
        pro: false,
        cfi: false,
        school: true,
      },
    ],
  },
];
