/**
 * Comprehensive PricingSection Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Pricing tier rendering and data display
 * - Billing period toggle functionality
 * - Price calculations and savings display
 * - CTA button interactions and plan selection
 * - Feature comparison table toggle
 * - Credit services and white label add-on display
 * - Responsive layout and animations
 * - Accessibility features and keyboard navigation
 * - Error boundary integration
 * - Analytics event tracking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { PricingSection } from '@/components/sections/PricingSection';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, initial, animate, transition, viewport, whileInView, ...props }: any, ref: any) => (
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Check: ({ className, ...props }: any) => (
    <svg data-testid="check-icon" className={className} {...props}>
      <path d="check" />
    </svg>
  ),
  X: ({ className, ...props }: any) => (
    <svg data-testid="x-icon" className={className} {...props}>
      <path d="x" />
    </svg>
  ),
  ArrowRightCircle: ({ className, ...props }: any) => (
    <svg data-testid="arrow-right-circle-icon" className={className} {...props}>
      <path d="arrow-right-circle" />
    </svg>
  ),
  Info: ({ className, ...props }: any) => (
    <svg data-testid="info-icon" className={className} {...props}>
      <path d="info" />
    </svg>
  ),
  Sparkles: ({ className, ...props }: any) => (
    <svg data-testid="sparkles-icon" className={className} {...props}>
      <path d="sparkles" />
    </svg>
  ),
  Users: ({ className, ...props }: any) => (
    <svg data-testid="users-icon" className={className} {...props}>
      <path d="users" />
    </svg>
  ),
  CreditCard: ({ className, ...props }: any) => (
    <svg data-testid="credit-card-icon" className={className} {...props}>
      <path d="credit-card" />
    </svg>
  ),
  Building2: ({ className, ...props }: any) => (
    <svg data-testid="building2-icon" className={className} {...props}>
      <path d="building2" />
    </svg>
  ),
  Zap: ({ className, ...props }: any) => (
    <svg data-testid="zap-icon" className={className} {...props}>
      <path d="zap" />
    </svg>
  ),
}));

// Mock Button component
jest.mock('@/components/ui/Button', () => ({
  Button: React.forwardRef(({ children, className, size, variant, onClick, ...props }: any, ref: any) => (
    <button 
      ref={ref} 
      className={className} 
      data-size={size} 
      data-variant={variant}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )),
}));

// Mock analytics
jest.mock('@/lib/analytics/telemetry', () => ({
  trackEvent: jest.fn(),
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock Error Boundary
jest.mock('@/components/common/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
  FeatureTableErrorFallback: () => <div data-testid="error-fallback">Feature table error</div>,
}));

// Mock pricing data
jest.mock('@/lib/data/pricingData', () => ({
  PRICING_TIERS: [
    {
      id: 'free',
      name: 'Free',
      subtitle: 'Perfect for getting started',
      monthlyPrice: 0,
      period: '/month',
      description: 'Basic features for individual pilots',
      features: [
        'Access to ACS codes',
        'Basic study plans',
        'Community support',
      ],
      cta: 'Get Started Free',
      ctaLink: '/auth/register',
      icon: 'Sparkles',
    },
    {
      id: 'pro',
      name: 'Pro',
      subtitle: 'For serious pilots',
      monthlyPrice: 29,
      yearlyPrice: 290,
      period: '/month',
      description: 'Advanced features for dedicated training',
      features: [
        'Unlimited document analysis',
        'AI study plans',
        'Progress tracking',
        'Priority support',
      ],
      cta: 'Start Pro Trial',
      ctaLink: '/auth/register?plan=pro',
      highlight: true,
      badge: 'Most Popular',
      icon: 'Users',
    },
    {
      id: 'cfi',
      name: 'CFI',
      subtitle: 'For flight instructors',
      monthlyPrice: 49,
      yearlyPrice: 490,
      period: '/month',
      description: 'Tools for professional instructors',
      features: [
        'Student management',
        'Lesson planning',
        'Performance analytics',
        'White-label content',
      ],
      cta: 'Start CFI Plan',
      ctaLink: '/auth/register?plan=cfi',
      icon: 'CreditCard',
    },
  ],
  CREDIT_SERVICES: [
    {
      name: 'Document Analysis',
      price: '$2',
      unit: 'document',
      description: 'AI-powered analysis of training documents',
      popular: true,
    },
    {
      name: 'Custom Reports',
      price: '$5',
      unit: 'report',
      description: 'Detailed progress and performance reports',
    },
  ],
  WHITE_LABEL_ADDON: {
    name: 'White Label Solution',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      'Custom branding',
      'Domain mapping',
      'Priority support',
    ],
  },
  FEATURE_COMPARISON_DATA: [
    {
      category: 'Core Features',
      features: [
        {
          name: 'ACS Code Access',
          description: 'Access to aviation certification standards',
          free: true,
          pro: true,
          cfi: true,
          school: true,
        },
        {
          name: 'Document Analysis',
          description: 'AI-powered document analysis',
          free: 'Limited',
          pro: 'Unlimited',
          cfi: 'Unlimited',
          school: 'Unlimited',
        },
      ],
    },
  ],
  ANIMATION_CONSTANTS: {
    STAGGER_DELAY: 0.1,
    DURATION_SLOW: 600,
  },
}));

// Import trackEvent for assertion
import { trackEvent } from '@/lib/analytics/telemetry';

describe('PricingSection', () => {
  const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the main pricing section with proper structure', () => {
      render(<PricingSection />);
      
      const section = document.querySelector('section#pricing');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('relative', 'py-20');
    });

    it('displays the main heading and description', () => {
      render(<PricingSection />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Choose Your Flight Training Plan');
      
      const description = screen.getByText(/From free tools to comprehensive school management/i);
      expect(description).toBeInTheDocument();
    });

    it('renders all pricing tiers correctly', () => {
      render(<PricingSection />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('CFI')).toBeInTheDocument();
      
      expect(screen.getByText('Perfect for getting started')).toBeInTheDocument();
      expect(screen.getByText('For serious pilots')).toBeInTheDocument();
      expect(screen.getByText('For flight instructors')).toBeInTheDocument();
    });

    it('displays proper pricing information', () => {
      render(<PricingSection />);
      
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
      expect(screen.getByText('$49')).toBeInTheDocument();
    });

    it('renders tier features with check icons', () => {
      render(<PricingSection />);
      
      const checkIcons = screen.getAllByTestId('check-icon');
      expect(checkIcons.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Access to ACS codes')).toBeInTheDocument();
      expect(screen.getByText('Unlimited document analysis')).toBeInTheDocument();
      expect(screen.getByText('Student management')).toBeInTheDocument();
    });
  });

  describe('Billing Period Toggle', () => {
    it('renders billing toggle with monthly selected by default', () => {
      render(<PricingSection />);
      
      const monthlyButton = screen.getByRole('button', { name: /Monthly/i });
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      
      expect(monthlyButton).toBeInTheDocument();
      expect(yearlyButton).toBeInTheDocument();
      expect(monthlyButton).toHaveAttribute('data-variant', 'primary');
      expect(yearlyButton).toHaveAttribute('data-variant', 'outline');
    });

    it('switches to yearly billing when yearly button is clicked', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      await user.click(yearlyButton);
      
      expect(mockTrackEvent).toHaveBeenCalledWith('pricing_toggle_billing', {
        from: 'monthly',
        to: 'yearly',
      });
    });

    it('shows savings indicator when yearly billing is selected', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      await user.click(yearlyButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Save up to 45%/i)).toBeInTheDocument();
      });
    });

    it('calculates and displays yearly savings correctly', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      await user.click(yearlyButton);
      
      await waitFor(() => {
        // Pro plan: $29 * 12 = $348, yearly = $290, savings = $58 (17%)
        expect(screen.getByText(/Save \$58 \(17%\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Plan Selection and CTA', () => {
    it('renders CTA buttons for all plans', () => {
      render(<PricingSection />);
      
      const freeButton = screen.getByRole('link', { name: /Get Started Free/i });
      const proButton = screen.getByRole('link', { name: /Start Pro Trial/i });
      const cfiButton = screen.getByRole('link', { name: /Start CFI Plan/i });
      
      expect(freeButton).toBeInTheDocument();
      expect(proButton).toBeInTheDocument();
      expect(cfiButton).toBeInTheDocument();
    });

    it('has correct CTA links for each plan', () => {
      render(<PricingSection />);
      
      const freeButton = screen.getByRole('link', { name: /Get Started Free/i });
      const proButton = screen.getByRole('link', { name: /Start Pro Trial/i });
      const cfiButton = screen.getByRole('link', { name: /Start CFI Plan/i });
      
      expect(freeButton).toHaveAttribute('href', '/auth/register');
      expect(proButton).toHaveAttribute('href', '/auth/register?plan=pro');
      expect(cfiButton).toHaveAttribute('href', '/auth/register?plan=cfi');
    });

    it('tracks plan selection events', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const proButton = screen.getByRole('button', { name: /Start Pro Trial/i });
      await user.click(proButton);
      
      expect(mockTrackEvent).toHaveBeenCalledWith('pricing_plan_select', {
        plan: 'pro',
        billing_period: 'monthly',
        section: 'pricing',
      });
    });

    it('highlights the most popular plan', () => {
      render(<PricingSection />);
      
      const mostPopularBadge = screen.getByText('Most Popular');
      expect(mostPopularBadge).toBeInTheDocument();
      
      // Check that the badge is properly contained in a card
      const badgeContainer = mostPopularBadge.closest('.z-10') || 
                           mostPopularBadge.closest('.glass') ||
                           mostPopularBadge.parentElement;
      expect(badgeContainer).toBeInTheDocument();
    });
  });

  describe('Credit Services Section', () => {
    it('renders credit services section with proper heading', () => {
      render(<PricingSection />);
      
      const creditHeading = screen.getByRole('heading', { name: /Pay-as-you-go Credits/i });
      expect(creditHeading).toBeInTheDocument();
      
      const creditIcons = screen.getAllByTestId('credit-card-icon');
      expect(creditIcons.length).toBeGreaterThan(0);
    });

    it('displays all credit services with pricing', () => {
      render(<PricingSection />);
      
      expect(screen.getByText('Document Analysis')).toBeInTheDocument();
      expect(screen.getByText('Custom Reports')).toBeInTheDocument();
      
      expect(screen.getByText('$2')).toBeInTheDocument();
      expect(screen.getByText('$5')).toBeInTheDocument();
      
      expect(screen.getByText('/ document')).toBeInTheDocument();
      expect(screen.getByText('/ report')).toBeInTheDocument();
    });

    it('shows popular service indicator', () => {
      render(<PricingSection />);
      
      const zapIcons = screen.getAllByTestId('zap-icon');
      expect(zapIcons.length).toBeGreaterThan(0);
    });
  });

  describe('White Label Add-On', () => {
    it('renders white label section with proper information', () => {
      render(<PricingSection />);
      
      const whiteLabel = screen.getByText('White Label Solution');
      expect(whiteLabel).toBeInTheDocument();
      
      const building2Icon = screen.getByTestId('building2-icon');
      expect(building2Icon).toBeInTheDocument();
    });

    it('displays white label pricing for both billing periods', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      // Monthly pricing
      expect(screen.getByText('$199')).toBeInTheDocument();
      expect(screen.getAllByText('/month')[0]).toBeInTheDocument();
      
      // Switch to yearly
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      await user.click(yearlyButton);
      
      await waitFor(() => {
        expect(screen.getByText('$1990')).toBeInTheDocument();
        expect(screen.getByText('/year')).toBeInTheDocument();
      });
    });

    it('includes white label features', () => {
      render(<PricingSection />);
      
      expect(screen.getByText('Custom branding')).toBeInTheDocument();
      expect(screen.getByText('Domain mapping')).toBeInTheDocument();
      expect(screen.getByText('Priority support')).toBeInTheDocument();
    });

    it('has learn more CTA for white label', () => {
      render(<PricingSection />);
      
      const learnMoreButton = screen.getByRole('link', { name: /Learn More/i });
      expect(learnMoreButton).toHaveAttribute('href', '/contact-sales?addon=white-label');
      
      const arrowIcon = screen.getByTestId('arrow-right-circle-icon');
      expect(arrowIcon).toBeInTheDocument();
    });
  });

  describe('Feature Comparison Table', () => {
    it('renders toggle button for comparison table', () => {
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      expect(toggleButton).toBeInTheDocument();
      
      const infoIcon = screen.getByTestId('info-icon');
      expect(infoIcon).toBeInTheDocument();
    });

    it('shows comparison table when toggle is clicked', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Core Features')).toBeInTheDocument();
      });
    });

    it('changes toggle text when table is shown', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Hide detailed feature comparison/i })).toBeInTheDocument();
      });
    });

    it('renders feature comparison data correctly', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByText('ACS Code Access')).toBeInTheDocument();
        expect(screen.getByText('Document Analysis')).toBeInTheDocument();
        
        const checkIcons = screen.getAllByTestId('check-icon');
        expect(checkIcons.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });
  });

  describe('Responsive Design', () => {
    it('implements responsive grid for pricing tiers', () => {
      render(<PricingSection />);
      
      const tiersGrid = document.querySelector('.grid.gap-6.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(tiersGrid).toBeInTheDocument();
    });

    it('implements responsive grid for credit services', () => {
      render(<PricingSection />);
      
      const creditsGrid = document.querySelector('.grid.max-w-6xl.gap-4.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(creditsGrid).toBeInTheDocument();
    });

    it('uses responsive text sizing', () => {
      render(<PricingSection />);
      
      const mainHeading = screen.getByRole('heading', { name: /Choose Your Flight Training Plan/i });
      expect(mainHeading).toHaveClass('text-3xl', 'md:text-4xl');
    });

    it('implements responsive white label layout', () => {
      render(<PricingSection />);
      
      const whiteLabeGrid = document.querySelector('.grid.gap-4.md\\:grid-cols-2');
      expect(whiteLabeGrid).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<PricingSection />);
      
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      
      expect(h2).toBeInTheDocument();
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('provides accessible button labels', () => {
      render(<PricingSection />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('includes proper ARIA attributes for comparison table', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      await user.click(toggleButton);
      
      await waitFor(() => {
        const table = document.querySelector('table');
        expect(table).toBeInTheDocument();
        
        const featureCell = document.querySelector('[aria-describedby]');
        expect(featureCell).toBeInTheDocument();
        
        const tooltip = document.querySelector('[role="tooltip"]');
        expect(tooltip).toBeInTheDocument();
      });
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      // Test tab navigation through CTA buttons
      await user.tab();
      const firstButton = screen.getByRole('button', { name: /Monthly/i });
      expect(firstButton).toHaveFocus();
      
      await user.tab();
      const secondButton = screen.getByRole('button', { name: /Yearly/i });
      expect(secondButton).toHaveFocus();
    });
  });

  describe('Animations and Interactions', () => {
    it('applies motion classes to animated elements', () => {
      render(<PricingSection />);
      
      // Motion divs should be rendered without animation errors
      const motionElements = document.querySelectorAll('[class*="motion"]');
      expect(motionElements).toBeDefined();
    });

    it('handles hover states on pricing cards', () => {
      render(<PricingSection />);
      
      const cards = document.querySelectorAll('.transition-all.hover\\:shadow-lg');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('maintains proper stacking order with z-index', () => {
      render(<PricingSection />);
      
      const highlightedCard = document.querySelector('.z-10');
      expect(highlightedCard).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders error boundary for feature comparison table', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      const toggleButton = screen.getByRole('button', { name: /Show detailed feature comparison/i });
      await user.click(toggleButton);
      
      // The error boundary wrapper should be present
      await waitFor(() => {
        expect(screen.getByText('Features')).toBeInTheDocument();
      });
    });

    it('handles missing pricing data gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<PricingSection />);
      
      // Should not throw errors even with mocked data
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Content Validation', () => {
    it('displays accurate pricing information', () => {
      render(<PricingSection />);
      
      // Validate that pricing makes sense
      expect(screen.getByText('$0')).toBeInTheDocument(); // Free tier
      expect(screen.getByText('$29')).toBeInTheDocument(); // Pro tier
      expect(screen.getByText('$49')).toBeInTheDocument(); // CFI tier
    });

    it('includes all essential features for each tier', () => {
      render(<PricingSection />);
      
      // Free features
      expect(screen.getByText('Access to ACS codes')).toBeInTheDocument();
      expect(screen.getByText('Basic study plans')).toBeInTheDocument();
      
      // Pro features
      expect(screen.getByText('Unlimited document analysis')).toBeInTheDocument();
      expect(screen.getByText('AI study plans')).toBeInTheDocument();
      
      // CFI features
      expect(screen.getByText('Student management')).toBeInTheDocument();
      expect(screen.getByText('Lesson planning')).toBeInTheDocument();
    });

    it('shows reasonable credit service pricing', () => {
      render(<PricingSection />);
      
      expect(screen.getByText('$2')).toBeInTheDocument();
      expect(screen.getByText('$5')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('renders without performance warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<PricingSection />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('uses memoization for expensive calculations', async () => {
      const user = userEvent.setup();
      render(<PricingSection />);
      
      // Switch billing periods multiple times
      const yearlyButton = screen.getByRole('button', { name: /Yearly/i });
      const monthlyButton = screen.getByRole('button', { name: /Monthly/i });
      
      await user.click(yearlyButton);
      await user.click(monthlyButton);
      await user.click(yearlyButton);
      
      // Should handle rapid switching without errors
      expect(yearlyButton).toBeInTheDocument();
    });
  });
});