import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BenefitZipperList } from '@/components/sections/BenefitZipperList';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { useResponsive } from '@/lib/hooks/useMediaQuery';

// Mock external dependencies
jest.mock('@/lib/hooks/useIntersectionObserver');
jest.mock('@/lib/hooks/useMediaQuery');
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  FileCheck: () => <div data-testid="file-check-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  BookOpen: () => <div data-testid="book-open-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  CheckCircle2: () => <div data-testid="check-circle-icon" />,
}));

const mockUseIntersectionObserver = useIntersectionObserver as jest.MockedFunction<
  typeof useIntersectionObserver
>;
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

describe('BenefitZipperList', () => {
  beforeEach(() => {
    // Default mocks
    mockUseIntersectionObserver.mockReturnValue(true);
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isSmallScreen: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders with default sections', () => {
      render(<BenefitZipperList />);
      
      // Check that the component renders
      expect(screen.getByText('Transform Your Aviation Training')).toBeInTheDocument();
      expect(screen.getByText('Professional flight training tools designed for modern aviators')).toBeInTheDocument();
    });

    it('renders custom sections when provided', () => {
      const customSections = [
        {
          id: 'custom-section',
          title: 'Custom Title',
          subtitle: 'Custom Subtitle',
          features: [
            {
              icon: <div data-testid="custom-icon" />,
              title: 'Custom Feature',
              description: 'Custom Description',
            },
          ],
          mockup: <div data-testid="custom-mockup">Custom Mockup</div>,
        },
      ];

      render(<BenefitZipperList sections={customSections} />);
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Subtitle')).toBeInTheDocument();
      expect(screen.getByText('Custom Feature')).toBeInTheDocument();
      expect(screen.getByTestId('custom-mockup')).toBeInTheDocument();
    });

    it('renders CTA section by default', () => {
      render(<BenefitZipperList />);
      
      expect(screen.getByText('Ready to Transform Your Training?')).toBeInTheDocument();
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
    });

    it('hides CTA when showCTA is false', () => {
      render(<BenefitZipperList showCTA={false} />);
      
      expect(screen.queryByText('Ready to Transform Your Training?')).not.toBeInTheDocument();
    });

    it('renders custom CTA when provided', () => {
      const customCTA = <div data-testid="custom-cta">Custom CTA Content</div>;
      
      render(<BenefitZipperList customCTA={customCTA} />);
      
      expect(screen.getByTestId('custom-cta')).toBeInTheDocument();
      expect(screen.queryByText('Ready to Transform Your Training?')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('uses mobile variants when on mobile device', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isSmallScreen: true,
      });

      render(<BenefitZipperList />);
      
      // Component should render without errors on mobile
      expect(screen.getByText('Transform Your Aviation Training')).toBeInTheDocument();
    });

    it('uses desktop variants when on desktop device', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isSmallScreen: false,
      });

      render(<BenefitZipperList />);
      
      // Component should render without errors on desktop
      expect(screen.getByText('Transform Your Aviation Training')).toBeInTheDocument();
    });
  });

  describe('Analytics Callbacks', () => {
    it('calls onSectionView when section becomes visible', async () => {
      const onSectionView = jest.fn();
      mockUseIntersectionObserver.mockReturnValue(true);
      
      render(<BenefitZipperList onSectionView={onSectionView} />);
      
      await waitFor(() => {
        expect(onSectionView).toHaveBeenCalledWith('compliance-tracking');
      });
    });

    it('calls onFeatureInteraction when feature is clicked', async () => {
      const onFeatureInteraction = jest.fn();
      
      render(<BenefitZipperList onFeatureInteraction={onFeatureInteraction} />);
      
      // Find and click a feature item
      const featureItems = screen.getAllByRole('button');
      const firstFeatureItem = featureItems.find(item => 
        item.textContent?.includes('Smart Compliance Tracking')
      );
      
      if (firstFeatureItem) {
        fireEvent.click(firstFeatureItem);
        
        await waitFor(() => {
          expect(onFeatureInteraction).toHaveBeenCalledWith('compliance-tracking', 0);
        });
      }
    });

    it('does not call callbacks when not provided', () => {
      // Should not throw errors when callbacks are undefined
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
    });
  });

  describe('Intersection Observer Integration', () => {
    it('passes correct configuration to intersection observer', () => {
      render(<BenefitZipperList />);
      
      expect(mockUseIntersectionObserver).toHaveBeenCalledWith(
        expect.any(Object), // ref object
        {
          threshold: 0.1,
          rootMargin: '-100px',
          triggerOnce: true,
          fallbackInView: false,
        }
      );
    });

    it('handles intersection observer returning false', () => {
      mockUseIntersectionObserver.mockReturnValue(false);
      
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
      
      expect(screen.getByText('Transform Your Aviation Training')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders within error boundaries', () => {
      // This tests that the component doesn't throw uncaught errors
      expect(() => {
        render(<BenefitZipperList />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<BenefitZipperList />);
      
      // Check main heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      
      // Check section headings
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
    });

    it('has interactive elements with proper roles', () => {
      render(<BenefitZipperList />);
      
      // Check that interactive elements are properly marked
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Check main CTA buttons
      expect(screen.getByRole('button', { name: /get started free/i })).toBeInTheDocument();
    });
  });

  describe('Configuration Override', () => {
    it('accepts configuration overrides', () => {
      const customConfig = {
        ANIMATION_DURATION: 1.0,
        MOBILE_ANIMATION_DURATION: 0.5,
      };

      expect(() => {
        render(<BenefitZipperList config={customConfig} />);
      }).not.toThrow();
    });

    it('handles forceReducedMotion prop', () => {
      expect(() => {
        render(<BenefitZipperList forceReducedMotion={true} />);
      }).not.toThrow();
      
      expect(screen.getByText('Transform Your Aviation Training')).toBeInTheDocument();
    });
  });
});