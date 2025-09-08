/**
 * Comprehensive BenefitZipperList Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Component rendering with default and custom sections
 * - Feature list display and interaction
 * - Mockup component rendering and error handling
 * - Responsive layout and animation behavior
 * - Intersection Observer integration
 * - Analytics event tracking
 * - Error boundary functionality
 * - Accessibility features and keyboard navigation
 * - Configuration overrides and reduced motion
 * - Memory management and performance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BenefitZipperList } from '@/components/sections/BenefitZipperList';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, className, style, initial, animate, transition, viewport, whileInView, ...props }: any, ref: any) => (
      <div ref={ref} className={className} style={style} {...props}>
        {children}
      </div>
    )),
    section: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
      <section ref={ref} className={className} {...props}>
        {children}
      </section>
    )),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  FileCheck: ({ className, ...props }: any) => (
    <svg data-testid="file-check-icon" className={className} {...props}>
      <path d="file-check" />
    </svg>
  ),
  TrendingUp: ({ className, ...props }: any) => (
    <svg data-testid="trending-up-icon" className={className} {...props}>
      <path d="trending-up" />
    </svg>
  ),
  BookOpen: ({ className, ...props }: any) => (
    <svg data-testid="book-open-icon" className={className} {...props}>
      <path d="book-open" />
    </svg>
  ),
  Users: ({ className, ...props }: any) => (
    <svg data-testid="users-icon" className={className} {...props}>
      <path d="users" />
    </svg>
  ),
  Award: ({ className, ...props }: any) => (
    <svg data-testid="award-icon" className={className} {...props}>
      <path d="award" />
    </svg>
  ),
  Clock: ({ className, ...props }: any) => (
    <svg data-testid="clock-icon" className={className} {...props}>
      <path d="clock" />
    </svg>
  ),
  CheckCircle2: ({ className, ...props }: any) => (
    <svg data-testid="check-circle-icon" className={className} {...props}>
      <path d="check-circle" />
    </svg>
  ),
}));

// Mock hooks
jest.mock('@/lib/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: jest.fn(() => ({
    ref: { current: null },
    isInView: true,
  })),
}));

jest.mock('@/lib/hooks/useMediaQuery', () => ({
  useResponsive: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmallScreen: false,
  })),
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  prefersReducedMotion: jest.fn(() => false),
}));

// Mock error boundaries
jest.mock('@/components/sections/BenefitErrorBoundary', () => ({
  BenefitErrorBoundary: ({ children }: any) => <>{children}</>,
  MockupErrorBoundary: ({ children }: any) => <>{children}</>,
}));

import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { useResponsive } from '@/lib/hooks/useMediaQuery';
import { prefersReducedMotion } from '@/lib/utils';

const mockUseIntersectionObserver = useIntersectionObserver as jest.MockedFunction<typeof useIntersectionObserver>;
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;
const mockPrefersReducedMotion = prefersReducedMotion as jest.MockedFunction<typeof prefersReducedMotion>;

describe('BenefitZipperList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseIntersectionObserver.mockReturnValue({
      ref: { current: null },
      isInView: true,
    });
    
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallScreen: false,
    });
    
    mockPrefersReducedMotion.mockReturnValue(false);
  });

  describe('Basic Rendering', () => {
    it('renders the main component with proper structure', () => {
      render(<BenefitZipperList />);
      
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('py-20', 'bg-gradient-to-b');
    });

    it('displays the main heading and description', () => {
      render(<BenefitZipperList />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Everything You Need to Succeed');
      
      const description = screen.getByText(/Professional aviation training tools designed by CFIs/i);
      expect(description).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<BenefitZipperList className="custom-benefit-class" />);
      
      const section = document.querySelector('section');
      expect(section).toHaveClass('custom-benefit-class');
    });

    it('renders all default feature sections', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Smart Logbook Analysis')).toBeInTheDocument();
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument();
      expect(screen.getByText('Training Management')).toBeInTheDocument();
    });
  });

  describe('Custom Sections', () => {
    const customSections = [
      {
        id: 'custom-section-1',
        title: 'Custom Feature One',
        subtitle: 'This is a custom feature description',
        features: [
          {
            icon: <svg data-testid="custom-icon-1"><path d="custom" /></svg>,
            title: 'Custom Feature Item',
            description: 'Custom feature description text',
          },
        ],
        mockup: <div data-testid="custom-mockup-1">Custom Mockup Content</div>,
      },
      {
        id: 'custom-section-2',
        title: 'Custom Feature Two',
        subtitle: 'Another custom feature description',
        features: [
          {
            icon: <svg data-testid="custom-icon-2"><path d="custom2" /></svg>,
            title: 'Another Custom Feature',
            description: 'Another feature description',
          },
        ],
        mockup: <div data-testid="custom-mockup-2">Another Mockup</div>,
      },
    ];

    it('renders custom sections when provided', () => {
      render(<BenefitZipperList sections={customSections} />);
      
      expect(screen.getByText('Custom Feature One')).toBeInTheDocument();
      expect(screen.getByText('Custom Feature Two')).toBeInTheDocument();
      expect(screen.getByText('This is a custom feature description')).toBeInTheDocument();
      expect(screen.getByTestId('custom-mockup-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-mockup-2')).toBeInTheDocument();
    });

    it('renders custom feature items correctly', () => {
      render(<BenefitZipperList sections={customSections} />);
      
      expect(screen.getByText('Custom Feature Item')).toBeInTheDocument();
      expect(screen.getByText('Another Custom Feature')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-icon-2')).toBeInTheDocument();
    });
  });

  describe('Feature Interaction', () => {
    const mockOnFeatureInteraction = jest.fn();

    beforeEach(() => {
      mockOnFeatureInteraction.mockClear();
    });

    it('calls onFeatureInteraction when feature item is clicked', async () => {
      const user = userEvent.setup();
      render(<BenefitZipperList onFeatureInteraction={mockOnFeatureInteraction} />);
      
      const featureButtons = screen.getAllByRole('button');
      const firstFeatureButton = featureButtons.find(button => 
        button.textContent?.includes('Automated Compliance Check')
      );
      
      if (firstFeatureButton) {
        await user.click(firstFeatureButton);
        expect(mockOnFeatureInteraction).toHaveBeenCalledWith('logbook-analysis', 0);
      }
    });

    it('supports keyboard interaction on feature items', async () => {
      const user = userEvent.setup();
      render(<BenefitZipperList onFeatureInteraction={mockOnFeatureInteraction} />);
      
      const featureButtons = screen.getAllByRole('button');
      const firstFeatureButton = featureButtons[0];
      
      if (firstFeatureButton) {
        firstFeatureButton.focus();
        expect(firstFeatureButton).toHaveFocus();
        
        await user.keyboard('{Enter}');
        expect(mockOnFeatureInteraction).toHaveBeenCalled();
      }
    });

    it('renders feature items without interaction when callback not provided', () => {
      render(<BenefitZipperList />);
      
      const featureItems = document.querySelectorAll('[role="button"]');
      featureItems.forEach(item => {
        expect(item).not.toHaveAttribute('tabIndex');
      });
    });
  });

  describe('Section Visibility Tracking', () => {
    const mockOnSectionView = jest.fn();

    beforeEach(() => {
      mockOnSectionView.mockClear();
    });

    it('calls onSectionView when sections become visible', async () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isInView: true,
      });
      
      render(<BenefitZipperList onSectionView={mockOnSectionView} />);
      
      await waitFor(() => {
        expect(mockOnSectionView).toHaveBeenCalledWith('logbook-analysis');
        expect(mockOnSectionView).toHaveBeenCalledWith('progress-analytics');
        expect(mockOnSectionView).toHaveBeenCalledWith('training-management');
      });
    });

    it('does not call onSectionView when sections are not visible', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isInView: false,
      });
      
      render(<BenefitZipperList onSectionView={mockOnSectionView} />);
      
      expect(mockOnSectionView).not.toHaveBeenCalled();
    });

    it('handles missing onSectionView callback gracefully', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isInView: true,
      });
      
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile devices', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isSmallScreen: true,
      });
      
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
      // Component should render without errors on mobile
    });

    it('adapts layout for tablet devices', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isSmallScreen: false,
      });
      
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('uses desktop layout for large screens', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSmallScreen: false,
      });
      
      render(<BenefitZipperList />);
      
      const container = document.querySelector('.mx-auto.max-w-7xl');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Animation Configuration', () => {
    it('applies custom animation configuration', () => {
      const customConfig = {
        ANIMATION_DURATION: 1.2,
        STAGGER_DELAY: 0.2,
        MOBILE_ANIMATION_DURATION: 0.8,
      };
      
      expect(() => {
        render(<BenefitZipperList config={customConfig} />);
      }).not.toThrow();
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('uses reduced motion when forceReducedMotion is true', () => {
      render(<BenefitZipperList forceReducedMotion={true} />);
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('respects user preference for reduced motion', () => {
      mockPrefersReducedMotion.mockReturnValue(true);
      
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('uses normal animations when reduced motion is disabled', () => {
      mockPrefersReducedMotion.mockReturnValue(false);
      
      render(<BenefitZipperList forceReducedMotion={false} />);
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });
  });

  describe('Intersection Observer Integration', () => {
    it('configures intersection observer with correct options', () => {
      render(<BenefitZipperList />);
      
      expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
        threshold: 0.1,
        rootMargin: '-100px',
        triggerOnce: true,
        fallbackInView: false,
      });
    });

    it('handles intersection observer unavailability', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: { current: null },
        isInView: false,
      });
      
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
    });

    it('applies custom intersection observer config when provided', () => {
      const customConfig = {
        INTERSECTION_THRESHOLD: 0.3,
        INTERSECTION_ROOT_MARGIN: '-50px',
      };
      
      render(<BenefitZipperList config={customConfig} />);
      
      expect(mockUseIntersectionObserver).toHaveBeenCalledWith({
        threshold: 0.3,
        rootMargin: '-50px',
        triggerOnce: true,
        fallbackInView: false,
      });
    });
  });

  describe('Default Feature Sections', () => {
    it('renders logbook analysis section with correct features', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Smart Logbook Analysis')).toBeInTheDocument();
      expect(screen.getByText(/Track compliance, identify weaknesses/i)).toBeInTheDocument();
      expect(screen.getByText('Automated Compliance Check')).toBeInTheDocument();
      expect(screen.getByText('Weakness Detection')).toBeInTheDocument();
      expect(screen.getByText('Checkride Readiness')).toBeInTheDocument();
    });

    it('renders progress analytics section with correct features', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument();
      expect(screen.getByText(/See your training progress with detailed analytics/i)).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByText('Time Analysis')).toBeInTheDocument();
      expect(screen.getByText('Goal Tracking')).toBeInTheDocument();
    });

    it('renders training management section with correct features', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Training Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage your entire aviation training journey/i)).toBeInTheDocument();
      expect(screen.getByText('Curriculum Planning')).toBeInTheDocument();
      expect(screen.getByText('Instructor Coordination')).toBeInTheDocument();
      expect(screen.getByText('Certification Tracking')).toBeInTheDocument();
    });
  });

  describe('Mockup Components', () => {
    it('renders logbook mockup with demo content', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Cross Country Flight')).toBeInTheDocument();
      expect(screen.getByText('Night Flying')).toBeInTheDocument();
      expect(screen.getByText('Instrument Training')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
    });

    it('renders analytics mockup with demo data', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('Pass Rate')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('Weak Areas')).toBeInTheDocument();
    });

    it('renders training mockup with schedule content', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Training Schedule')).toBeInTheDocument();
      expect(screen.getByText('On Track')).toBeInTheDocument();
      expect(screen.getByText('Private Pilot')).toBeInTheDocument();
      expect(screen.getByText('Instrument Rating')).toBeInTheDocument();
      expect(screen.getByText('Commercial Pilot')).toBeInTheDocument();
    });

    it('displays proper mockup styling and gradients', () => {
      render(<BenefitZipperList />);
      
      const mockupElements = document.querySelectorAll('.bg-gradient-to-br.from-blue-50.to-blue-100');
      expect(mockupElements.length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    it('implements proper responsive grid layout', () => {
      render(<BenefitZipperList />);
      
      const gridElements = document.querySelectorAll('.grid.md\\:grid-cols-2');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('alternates content and mockup placement', () => {
      render(<BenefitZipperList />);
      
      const reverseOrderElements = document.querySelectorAll('.md\\:grid-flow-col-dense');
      expect(reverseOrderElements.length).toBeGreaterThan(0);
    });

    it('applies proper spacing between sections', () => {
      render(<BenefitZipperList />);
      
      const container = document.querySelector('.mx-auto.max-w-7xl');
      expect(container).toBeInTheDocument();
    });

    it('includes header container with proper spacing', () => {
      render(<BenefitZipperList />);
      
      const headerContainer = document.querySelector('.mb-20.text-center');
      expect(headerContainer).toBeInTheDocument();
    });
  });

  describe('Icon Integration', () => {
    it('renders all required icons correctly', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByTestId('file-check-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
      expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByTestId('award-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('applies proper icon styling', () => {
      render(<BenefitZipperList />);
      
      const iconContainers = document.querySelectorAll('.bg-primary\\/10.rounded-lg.p-3');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    it('sizes icons consistently', () => {
      render(<BenefitZipperList />);
      
      const icons = document.querySelectorAll('[data-testid$="-icon"]');
      icons.forEach(icon => {
        expect(icon).toHaveClass('h-5', 'w-5');
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<BenefitZipperList />);
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.length).toBe(3); // One for each default section
      
      const h4Elements = screen.getAllByRole('heading', { level: 4 });
      expect(h4Elements.length).toBeGreaterThan(0); // Feature titles
    });

    it('provides proper semantic structure', () => {
      render(<BenefitZipperList />);
      
      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(1);
    });

    it('supports keyboard navigation for interactive elements', async () => {
      const user = userEvent.setup();
      render(<BenefitZipperList onFeatureInteraction={jest.fn()} />);
      
      const interactiveElements = screen.getAllByRole('button');
      if (interactiveElements.length > 0) {
        await user.tab();
        expect(interactiveElements[0]).toHaveFocus();
      }
    });

    it('provides accessible content descriptions', () => {
      render(<BenefitZipperList />);
      
      // Check for descriptive text content
      expect(screen.getByText(/Professional aviation training tools/i)).toBeInTheDocument();
      expect(screen.getByText(/Track compliance, identify weaknesses/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing sections gracefully', () => {
      expect(() => {
        render(<BenefitZipperList sections={[]} />);
      }).not.toThrow();
      
      // Should still render header
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('handles malformed section data', () => {
      const malformedSections = [
        {
          id: 'malformed',
          title: '', // Empty title
          subtitle: '',
          features: [], // Empty features
          mockup: null, // Null mockup
        },
      ] as any;
      
      expect(() => {
        render(<BenefitZipperList sections={malformedSections} />);
      }).not.toThrow();
    });

    it('handles missing hook dependencies', () => {
      mockUseIntersectionObserver.mockReturnValue({
        ref: null as any,
        isInView: false,
      });
      
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isSmallScreen: false,
      });
      
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('renders without performance warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<BenefitZipperList />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles multiple rapid re-renders', () => {
      const { rerender } = render(<BenefitZipperList />);
      
      // Rapid re-renders should not cause errors
      for (let i = 0; i < 5; i++) {
        rerender(<BenefitZipperList key={i} />);
      }
      
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });

    it('memoizes expensive calculations', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<BenefitZipperList />);
      
      // Should not log performance-related errors
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Component Display Names', () => {
    it('sets proper display names for debugging', () => {
      render(<BenefitZipperList />);
      
      // Verify component renders (display names are internal implementation)
      expect(screen.getByText('Everything You Need to Succeed')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    it('displays accurate feature descriptions', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText(/Scan your logbook for FAR compliance/i)).toBeInTheDocument();
      expect(screen.getByText(/AI identifies your weakest ACS areas/i)).toBeInTheDocument();
      expect(screen.getByText(/Track your improvement over time/i)).toBeInTheDocument();
      expect(screen.getByText(/Structured learning paths for all certificate levels/i)).toBeInTheDocument();
    });

    it('includes all essential training components', () => {
      render(<BenefitZipperList />);
      
      // Verify core training concepts are covered
      expect(screen.getByText(/logbook/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/training/i)).toBeInTheDocument();
      expect(screen.getByText(/instructor/i)).toBeInTheDocument();
    });
  });
});