/**
 * Comprehensive FeaturesSection Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Feature data display and content rendering
 * - Responsive grid layout behavior
 * - Feature card interactions and hover effects
 * - Icon integration and color coding
 * - Navigation links and CTA functionality
 * - Accessibility features (headings, semantic HTML)
 * - Feature descriptions and value propositions
 * - Card layout and responsive behavior
 * - Hover animations and visual feedback
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FeaturesSection } from '@/components/sections/FeaturesSection';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: ({ className, ...props }: any) => (
    <svg data-testid="arrow-right-icon" className={className} {...props}>
      <path d="arrow-right" />
    </svg>
  ),
  Search: ({ className, ...props }: any) => (
    <svg data-testid="search-icon" className={className} {...props}>
      <path d="search" />
    </svg>
  ),
  Upload: ({ className, ...props }: any) => (
    <svg data-testid="upload-icon" className={className} {...props}>
      <path d="upload" />
    </svg>
  ),
  BookOpen: ({ className, ...props }: any) => (
    <svg data-testid="book-open-icon" className={className} {...props}>
      <path d="book-open" />
    </svg>
  ),
  Target: ({ className, ...props }: any) => (
    <svg data-testid="target-icon" className={className} {...props}>
      <path d="target" />
    </svg>
  ),
  BarChart3: ({ className, ...props }: any) => (
    <svg data-testid="bar-chart-icon" className={className} {...props}>
      <path d="bar-chart" />
    </svg>
  ),
  Shield: ({ className, ...props }: any) => (
    <svg data-testid="shield-icon" className={className} {...props}>
      <path d="shield" />
    </svg>
  ),
}));

// Mock Card components
jest.mock('@/components/ui', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={`card ${className || ''}`} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={`card-content ${className || ''}`} {...props}>
      {children}
    </div>
  ),
}));

describe('FeaturesSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Rendering', () => {
    it('renders the section heading and description', () => {
      render(<FeaturesSection />);

      const heading = screen.getByRole('heading', {
        name: /Everything you need for flight training success/i,
      });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveClass('text-3xl', 'font-bold', 'tracking-tight');

      const description = screen.getByText(
        /From ACS code discovery to personalized study plans/i
      );
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-lg', 'text-gray-600');
    });

    it('displays all six feature cards with correct titles', () => {
      render(<FeaturesSection />);

      const expectedFeatures = [
        'ACS Code Discovery',
        'Smart Document Analysis',
        'Premium Lessons',
        'Personalized Study Plans',
        'Progress Analytics',
        'Guaranteed Results',
      ];

      expectedFeatures.forEach((feature) => {
        const featureTitle = screen.getByText(feature);
        expect(featureTitle).toBeInTheDocument();
        expect(featureTitle.tagName).toBe('H3');
        expect(featureTitle).toHaveClass('mb-2', 'text-lg', 'font-semibold', 'text-gray-900');
      });
    });

    it('includes comprehensive feature descriptions', () => {
      render(<FeaturesSection />);

      const expectedDescriptions = [
        /SEO-optimized pages for 200\+ ACS codes/i,
        /Upload exam reports for AI-powered/i,
        /In-depth lesson content with progress tracking/i,
        /AI-generated study plans tailored/i,
        /Track your learning progress/i,
        /95% of our users pass/i,
      ];

      expectedDescriptions.forEach((description) => {
        expect(screen.getByText(description)).toBeInTheDocument();
      });
    });

    it('renders feature cards with proper navigation links', () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByText('Learn more');
      expect(learnMoreLinks).toHaveLength(6);

      learnMoreLinks.forEach((link) => {
        const anchorElement = link.closest('a');
        expect(anchorElement).toHaveAttribute('href');
        expect(anchorElement).toHaveClass('text-primary-600', 'hover:text-primary-700');
      });
    });
  });

  describe('Feature Navigation and Links', () => {
    it('includes correct navigation links for each feature', () => {
      render(<FeaturesSection />);

      // Test specific feature links
      const acsLink = screen
        .getByText('ACS Code Discovery')
        .closest('.card')
        ?.querySelector('a');
      expect(acsLink).toHaveAttribute('href', '/acs');

      const uploadLink = screen
        .getByText('Smart Document Analysis')
        .closest('.card')
        ?.querySelector('a');
      expect(uploadLink).toHaveAttribute('href', '/upload');

      const premiumLink = screen
        .getByText('Premium Lessons')
        .closest('.card')
        ?.querySelector('a');
      expect(premiumLink).toHaveAttribute('href', '/auth/register');

      const studyPlanLink = screen
        .getByText('Personalized Study Plans')
        .closest('.card')
        ?.querySelector('a');
      expect(studyPlanLink).toHaveAttribute('href', '/auth/register');

      const analyticsLink = screen
        .getByText('Progress Analytics')
        .closest('.card')
        ?.querySelector('a');
      expect(analyticsLink).toHaveAttribute('href', '/auth/register');

      const resultsLink = screen
        .getByText('Guaranteed Results')
        .closest('.card')
        ?.querySelector('a');
      expect(resultsLink).toHaveAttribute('href', '/about');
    });

    it('displays arrow icons in learn more links with hover effects', () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByText('Learn more');
      learnMoreLinks.forEach((link) => {
        const arrowIcon = link.parentElement?.querySelector('[data-testid="arrow-right-icon"]');
        expect(arrowIcon).toBeInTheDocument();
        expect(arrowIcon).toHaveClass('ml-1', 'h-4', 'w-4');
        
        // Check for hover transition classes
        expect(link.parentElement).toHaveClass('transition-transform', 'group-hover:translate-x-1');
      });
    });
  });

  describe('Feature Icons and Visual Elements', () => {
    it('displays unique icons for each feature with proper styling', () => {
      render(<FeaturesSection />);

      const iconTestIds = [
        'search-icon',     // ACS Code Discovery
        'upload-icon',     // Smart Document Analysis  
        'book-open-icon',  // Premium Lessons
        'target-icon',     // Personalized Study Plans
        'bar-chart-icon',  // Progress Analytics
        'shield-icon',     // Guaranteed Results
      ];

      iconTestIds.forEach((testId) => {
        const icon = screen.getByTestId(testId);
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveClass('h-6', 'w-6');
      });
    });

    it('applies proper color coding to feature icons', () => {
      render(<FeaturesSection />);

      const featureCards = document.querySelectorAll('.card');
      expect(featureCards).toHaveLength(6);

      // Check that each card has an icon container with color classes
      featureCards.forEach((card) => {
        const iconContainer = card.querySelector('[class*="bg-"]');
        expect(iconContainer).toBeInTheDocument();
        expect(iconContainer).toHaveClass('flex', 'h-12', 'w-12', 'items-center', 'justify-center', 'rounded-lg', 'mb-4');
      });
    });

    it('uses distinct color schemes for each feature', () => {
      render(<FeaturesSection />);

      const expectedColorClasses = [
        'text-primary-600 bg-primary-100',
        'text-accent-600 bg-accent-100',
        'text-success-600 bg-success-100',
        'text-warning-600 bg-warning-100',
        'text-secondary-600 bg-secondary-100',
        'text-error-600 bg-error-100',
      ];

      const featureCards = document.querySelectorAll('.card');
      featureCards.forEach((card, index) => {
        const iconContainer = card.querySelector('[class*="bg-"]');
        if (iconContainer && expectedColorClasses[index]) {
          const colorClass = expectedColorClasses[index];
          const [textColor, bgColor] = colorClass.split(' ');
          expect(iconContainer).toHaveClass(textColor);
          expect(iconContainer).toHaveClass(bgColor);
        }
      });
    });
  });

  describe('Responsive Layout', () => {
    it('implements proper section structure and background', () => {
      render(<FeaturesSection />);

      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('bg-gray-50', 'py-16', 'sm:py-24');
      expect(section?.tagName).toBe('SECTION');
    });

    it('has responsive container and grid layout', () => {
      render(<FeaturesSection />);

      const section = document.querySelector('section');
      const container = section?.querySelector('.mx-auto.max-w-7xl');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');

      const gridContainer = section?.querySelector('.grid.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('gap-6', 'sm:grid-cols-2', 'lg:grid-cols-3');
    });

    it('centers heading content responsively', () => {
      render(<FeaturesSection />);

      const headingContainer = document.querySelector('.mx-auto.max-w-2xl.text-center');
      expect(headingContainer).toBeInTheDocument();

      const featuresContainer = document.querySelector('.mx-auto.mt-16.max-w-5xl');
      expect(featuresContainer).toBeInTheDocument();
    });

    it('applies hover effects to feature cards', () => {
      render(<FeaturesSection />);

      const featureCards = document.querySelectorAll('.card');
      featureCards.forEach((card) => {
        expect(card).toHaveClass('group', 'overflow-hidden', 'transition-all', 'duration-200', 'hover:shadow-lg');
      });
    });
  });

  describe('User Interactions', () => {
    const user = userEvent.setup();

    it('handles click events on learn more links', async () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByText('Learn more');
      
      for (const link of learnMoreLinks) {
        await user.click(link);
        // Verify link is still there after click (no errors)
        expect(link).toBeInTheDocument();
      }
    });

    it('supports keyboard navigation through features', async () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByRole('link', { name: /learn more/i });
      
      // Test tab navigation
      await user.tab();
      expect(learnMoreLinks[0]).toHaveFocus();

      await user.tab();
      expect(learnMoreLinks[1]).toHaveFocus();
    });

    it('maintains focus styles on interactive elements', () => {
      render(<FeaturesSection />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('text-primary-600', 'hover:text-primary-700');
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<FeaturesSection />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();

      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s).toHaveLength(6);

      // No other heading levels should exist
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(7); // 1 H2 + 6 H3s
    });

    it('provides meaningful link text and accessible navigation', () => {
      render(<FeaturesSection />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        expect(link.textContent).toBeTruthy();
        expect(link.textContent).toContain('Learn more');
      });
    });

    it('uses semantic HTML structure', () => {
      render(<FeaturesSection />);

      const section = document.querySelector('section');
      expect(section?.tagName).toBe('SECTION');

      // Check for proper content structure
      const headingContainer = section?.querySelector('.text-center');
      expect(headingContainer).toBeInTheDocument();

      const gridContainer = section?.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
    });

    it('ensures proper contrast and readability', () => {
      render(<FeaturesSection />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveClass('text-gray-900');

      const description = screen.getByText(/From ACS code discovery/i);
      expect(description).toHaveClass('text-gray-600');

      const featureTitles = screen.getAllByRole('heading', { level: 3 });
      featureTitles.forEach((title) => {
        expect(title).toHaveClass('text-gray-900');
      });
    });
  });

  describe('Card Layout and Styling', () => {
    it('applies consistent padding and spacing to cards', () => {
      render(<FeaturesSection />);

      const cardContents = document.querySelectorAll('.card-content');
      cardContents.forEach((content) => {
        expect(content).toHaveClass('p-6');
      });
    });

    it('maintains proper text hierarchy within cards', () => {
      render(<FeaturesSection />);

      const featureDescriptions = [
        /SEO-optimized pages for 200\+ ACS codes/i,
        /Upload exam reports for AI-powered/i,
        /In-depth lesson content with progress tracking/i,
        /AI-generated study plans tailored/i,
        /Track your learning progress/i,
        /95% of our users pass/i,
      ];

      featureDescriptions.forEach((description) => {
        const element = screen.getByText(description);
        expect(element).toHaveClass('mb-4', 'text-sm', 'text-gray-600');
      });
    });

    it('displays consistent icon container sizing', () => {
      render(<FeaturesSection />);

      const iconContainers = document.querySelectorAll('[class*="h-12 w-12"]');
      expect(iconContainers).toHaveLength(6);

      iconContainers.forEach((container) => {
        expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'rounded-lg');
      });
    });
  });

  describe('Feature Content Validation', () => {
    it('displays comprehensive and accurate feature descriptions', () => {
      render(<FeaturesSection />);

      // ACS Code Discovery
      expect(screen.getByText(/SEO-optimized pages for 200\+ ACS codes with official text, summaries, and common pitfalls/i)).toBeInTheDocument();

      // Smart Document Analysis
      expect(screen.getByText(/Upload exam reports for AI-powered ACS code extraction and personalized study plan generation/i)).toBeInTheDocument();

      // Premium Lessons
      expect(screen.getByText(/In-depth lesson content with progress tracking, designed by experienced CFIs and aviation professionals/i)).toBeInTheDocument();

      // Personalized Study Plans
      expect(screen.getByText(/AI-generated study plans tailored to your weak areas and learning pace for optimal preparation/i)).toBeInTheDocument();

      // Progress Analytics
      expect(screen.getByText(/Track your learning progress with detailed analytics and performance insights/i)).toBeInTheDocument();

      // Guaranteed Results
      expect(screen.getByText(/95% of our users pass their checkrides on the first attempt with our comprehensive preparation/i)).toBeInTheDocument();
    });

    it('uses action-oriented language in CTAs', () => {
      render(<FeaturesSection />);

      const ctaLinks = screen.getAllByText('Learn more');
      expect(ctaLinks).toHaveLength(6);

      ctaLinks.forEach((cta) => {
        expect(cta).toHaveClass('inline-flex', 'items-center', 'text-sm', 'font-medium');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('renders without console warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<FeaturesSection />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('uses efficient CSS class application', () => {
      render(<FeaturesSection />);

      const section = document.querySelector('section');
      expect(section?.className).not.toContain('undefined');
      expect(section?.className).not.toContain('null');

      const cards = document.querySelectorAll('.card');
      cards.forEach((card) => {
        expect(card.className).not.toContain('undefined');
        expect(card.className).not.toContain('null');
      });
    });

    it('implements proper hover state transitions', () => {
      render(<FeaturesSection />);

      const cards = document.querySelectorAll('.card');
      cards.forEach((card) => {
        expect(card).toHaveClass('transition-all', 'duration-200');
      });

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.parentElement).toHaveClass('transition-transform');
      });
    });
  });

  describe('Visual Design Consistency', () => {
    it('maintains consistent spacing throughout the section', () => {
      render(<FeaturesSection />);

      const heading = screen.getByRole('heading', { level: 2 });
      const description = screen.getByText(/From ACS code discovery/i);
      
      expect(description).toHaveClass('mt-4');
      
      const gridContainer = document.querySelector('.mt-16');
      expect(gridContainer).toBeInTheDocument();
    });

    it('uses consistent button and link styling', () => {
      render(<FeaturesSection />);

      const learnMoreLinks = screen.getAllByText('Learn more');
      learnMoreLinks.forEach((link) => {
        expect(link.parentElement).toHaveClass('text-primary-600', 'hover:text-primary-700', 'inline-flex', 'items-center', 'text-sm', 'font-medium');
      });
    });

    it('applies proper visual hierarchy to content', () => {
      render(<FeaturesSection />);

      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toHaveClass('text-3xl', 'sm:text-4xl');

      const featureTitles = screen.getAllByRole('heading', { level: 3 });
      featureTitles.forEach((title) => {
        expect(title).toHaveClass('text-lg');
      });
    });
  });
});