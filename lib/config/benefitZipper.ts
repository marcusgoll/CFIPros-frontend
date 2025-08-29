export const BENEFIT_CONFIG = {
  // Animation configuration
  ANIMATION_DURATION: 0.6,
  STAGGER_DELAY: 0.1,
  INITIAL_OFFSET: 40,
  
  // Visual configuration
  SECTION_SPACING: 32, // space-y-32 in tailwind (128px)
  CONTENT_GAP: 12, // gap-12 in tailwind (48px)
  FEATURE_SPACING: 6, // space-y-6 in tailwind (24px)
  
  // Intersection observer settings
  INTERSECTION_THRESHOLD: 0.1,
  INTERSECTION_ROOT_MARGIN: '-100px',
  
  // Mobile optimizations
  MOBILE_REDUCE_MOTION: true,
  MOBILE_ANIMATION_DURATION: 0.3,
  
  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const BENEFIT_ANIMATION_VARIANTS = {
  // Desktop variants
  desktop: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
    hiddenLeft: { opacity: 0, x: -40 },
    hiddenRight: { opacity: 0, x: 40 },
    visibleX: { opacity: 1, x: 0 },
  },
  // Mobile variants (reduced motion)
  mobile: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hiddenLeft: { opacity: 0, x: -20 },
    hiddenRight: { opacity: 0, x: 20 },
    visibleX: { opacity: 1, x: 0 },
  },
} as const;

export const BENEFIT_CLASSES = {
  section: "py-20 bg-gradient-to-b from-background to-muted/20",
  container: "mx-auto max-w-7xl px-4 md:px-6",
  headerContainer: "mb-20 text-center",
  sectionGrid: "grid md:grid-cols-2 gap-12 items-center",
  contentContainer: "space-y-8",
  featureList: "space-y-6",
  featureItem: "flex items-start gap-4",
  iconContainer: "bg-primary/10 rounded-lg p-3 text-primary shrink-0",
  mockupContainer: "",
  ctaContainer: "mt-24 text-center",
  glassCard: "glass rounded-xl p-8 max-w-2xl mx-auto",
  buttonContainer: "flex flex-col sm:flex-row gap-3 justify-center",
} as const;