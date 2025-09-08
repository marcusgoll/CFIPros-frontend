/**
 * Comprehensive HeroSection Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Content rendering and text display
 * - Responsive layout structure
 * - CTA button functionality and links
 * - Statistics grid display
 * - Trust indicator badge
 * - Background decoration elements
 * - Accessibility features (headings, semantic HTML)
 * - Icon integration and SVG rendering
 * - Gradient text styling
 * - User interaction testing
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { HeroSection } from '@/components/sections/HeroSection';

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
  Upload: ({ className, ...props }: any) => (
    <svg data-testid="upload-icon" className={className} {...props}>
      <path d="upload" />
    </svg>
  ),
  Search: ({ className, ...props }: any) => (
    <svg data-testid="search-icon" className={className} {...props}>
      <path d="search" />
    </svg>
  ),
}));

// Mock Button component
jest.mock('@/components/ui', () => ({
  Button: React.forwardRef(({ children, className, size, variant, ...props }: any, ref: any) => (
    <button ref={ref} className={className} data-size={size} data-variant={variant} {...props}>
      {children}
    </button>
  )),
}));

describe('HeroSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Content Rendering', () => {
    it('renders the main heading with CFIPros branding and gradient styling', () => {
      render(<HeroSection />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent(/Master Aviation Standards with/i);
      
      const brandSpan = heading.querySelector('span');
      expect(brandSpan).toBeInTheDocument();
      expect(brandSpan).toHaveTextContent('CFIPros');
      expect(brandSpan).toHaveClass('bg-gradient-to-r', 'bg-clip-text', 'text-transparent');
    });

    it('displays trust indicator badge with pilot count', () => {
      render(<HeroSection />);

      const trustBadge = screen.getByText(/Trusted by 10,000\+ pilots nationwide/i);
      expect(trustBadge).toBeInTheDocument();
      expect(trustBadge).toHaveClass('bg-primary-100', 'text-primary-700');
      expect(trustBadge.parentElement).toHaveClass('rounded-full', 'px-4', 'py-1.5');
    });

    it('shows comprehensive value proposition text', () => {
      render(<HeroSection />);

      const description = screen.getByText(
        /Comprehensive pilot training platform that helps student pilots and CFIs master aviation standards/i
      );
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(/SEO-discoverable ACS code references/i);
      expect(description).toHaveTextContent(/AI-powered study plans/i);
      expect(description).toHaveTextContent(/premium lesson content/i);
      expect(description.tagName).toBe('P');
    });

    it('displays all statistical metrics correctly', () => {
      render(<HeroSection />);

      // Check each statistic with proper values and labels
      expect(screen.getByText('200+')).toBeInTheDocument();
      expect(screen.getByText('ACS Codes')).toBeInTheDocument();

      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('Pass Rate')).toBeInTheDocument();

      expect(screen.getByText('10k+')).toBeInTheDocument();
      expect(screen.getByText('Active Users')).toBeInTheDocument();

      expect(screen.getByText('4.9★')).toBeInTheDocument();
      expect(screen.getByText('User Rating')).toBeInTheDocument();
    });
  });

  describe('CTA Buttons and Navigation', () => {
    it('renders primary CTA button with upload functionality', () => {
      render(<HeroSection />);

      const uploadButton = screen.getByRole('link', {
        name: /Upload Your Report/i,
      });
      
      expect(uploadButton).toBeInTheDocument();
      expect(uploadButton).toHaveAttribute('href', '/upload');
      expect(uploadButton).toHaveClass('w-full', 'sm:w-auto');
    });

    it('renders secondary CTA button for ACS code browsing', () => {
      render(<HeroSection />);

      const browseButton = screen.getByRole('link', {
        name: /Browse ACS Codes/i,
      });
      
      expect(browseButton).toBeInTheDocument();
      expect(browseButton).toHaveAttribute('href', '/acs');
      expect(browseButton).toHaveClass('w-full', 'sm:w-auto');
    });

    it('includes proper icons in CTA buttons with hover effects', () => {
      render(<HeroSection />);

      const uploadButton = screen.getByRole('link', {
        name: /Upload Your Report/i,
      });
      const browseButton = screen.getByRole('link', {
        name: /Browse ACS Codes/i,
      });

      // Check for upload icon
      expect(uploadButton.querySelector('[data-testid="upload-icon"]')).toBeInTheDocument();
      expect(uploadButton.querySelector('[data-testid="arrow-right-icon"]')).toBeInTheDocument();
      
      // Check for search icon
      expect(browseButton.querySelector('[data-testid="search-icon"]')).toBeInTheDocument();

      // Check hover effect classes
      const buttonElement = uploadButton.querySelector('button');
      expect(buttonElement).toHaveClass('group');
    });

    it('renders buttons with proper size and styling', () => {
      render(<HeroSection />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('data-size', 'lg');
        expect(button).toHaveClass('flex', 'items-center', 'justify-center', 'gap-2');
      });

      // Check variant differences
      const uploadButton = buttons[0];
      const browseButton = buttons[1];
      expect(browseButton).toHaveAttribute('data-variant', 'outline');
    });
  });

  describe('Responsive Layout', () => {
    it('has proper section structure with gradient background', () => {
      render(<HeroSection />);

      const section = document.querySelector('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass(
        'relative',
        'overflow-hidden',
        'bg-gradient-to-br',
        'from-primary-50',
        'to-accent-50',
        'via-white'
      );
    });

    it('implements responsive padding and spacing', () => {
      render(<HeroSection />);

      const section = document.querySelector('section');
      expect(section).toHaveClass('py-16', 'sm:py-24', 'lg:py-32');

      const container = section?.querySelector('.mx-auto.max-w-7xl');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8');
    });

    it('displays responsive heading typography', () => {
      render(<HeroSection />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass(
        'text-4xl',
        'sm:text-5xl', 
        'lg:text-6xl',
        'font-bold',
        'tracking-tight'
      );
      expect(heading).toHaveClass('max-w-4xl', 'mx-auto');
    });

    it('implements responsive CTA button layout', () => {
      render(<HeroSection />);

      const ctaContainer = document.querySelector('.flex.flex-col.items-center.justify-center');
      expect(ctaContainer).toBeInTheDocument();
      expect(ctaContainer).toHaveClass('gap-4', 'sm:flex-row', 'sm:gap-x-6');
    });

    it('displays responsive statistics grid', () => {
      render(<HeroSection />);

      const statsGrid = document.querySelector('.grid.grid-cols-2');
      expect(statsGrid).toBeInTheDocument();
      expect(statsGrid).toHaveClass('gap-8', 'sm:grid-cols-4');
    });
  });

  describe('Background Decoration', () => {
    it('includes decorative background element', () => {
      render(<HeroSection />);

      const section = document.querySelector('section');
      const decoration = section?.querySelector('.absolute.inset-x-0.top-0');
      
      expect(decoration).toBeInTheDocument();
      expect(decoration).toHaveClass('-z-10', 'transform-gpu', 'overflow-hidden', 'blur-3xl');
    });

    it('applies complex clip-path styling to decoration', () => {
      render(<HeroSection />);

      const decorationChild = document.querySelector('[style*="clipPath"]');
      expect(decorationChild).toBeInTheDocument();
      expect(decorationChild).toHaveClass(
        'from-primary-400',
        'to-accent-400',
        'bg-gradient-to-tr',
        'opacity-20'
      );
    });
  });

  describe('Accessibility', () => {
    it('maintains proper heading hierarchy', () => {
      render(<HeroSection />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      // Should only have one H1 and no other headings that break hierarchy
      const allHeadings = screen.getAllByRole('heading');
      expect(allHeadings).toHaveLength(1);
      expect(allHeadings[0]).toBe(h1);
    });

    it('provides accessible button text and structure', () => {
      render(<HeroSection />);

      const uploadLink = screen.getByRole('link', { name: /Upload Your Report/i });
      const browseLink = screen.getByRole('link', { name: /Browse ACS Codes/i });

      expect(uploadLink).toHaveAccessibleName();
      expect(browseLink).toHaveAccessibleName();
      
      // Check for proper button role within links
      expect(uploadLink.querySelector('button')).toHaveAttribute('type', 'button');
      expect(browseLink.querySelector('button')).toHaveAttribute('type', 'button');
    });

    it('ensures semantic HTML structure', () => {
      render(<HeroSection />);

      const section = document.querySelector('section');
      expect(section?.tagName).toBe('SECTION');

      // Check for proper content flow
      const mainContent = section?.querySelector('.text-center');
      expect(mainContent).toBeInTheDocument();
    });

    it('provides meaningful statistics labels', () => {
      render(<HeroSection />);

      const statLabels = ['ACS Codes', 'Pass Rate', 'Active Users', 'User Rating'];
      statLabels.forEach(label => {
        const labelElement = screen.getByText(label);
        expect(labelElement).toBeInTheDocument();
        expect(labelElement).toHaveClass('text-sm', 'text-gray-600');
      });
    });
  });

  describe('User Interactions', () => {
    const user = userEvent.setup();

    it('handles click events on CTA buttons', async () => {
      render(<HeroSection />);

      const uploadButton = screen.getByRole('button', { name: /Upload Your Report/i });
      const browseButton = screen.getByRole('button', { name: /Browse ACS Codes/i });

      // Test button clicks don't throw errors
      await user.click(uploadButton);
      await user.click(browseButton);

      expect(uploadButton).toBeInTheDocument();
      expect(browseButton).toBeInTheDocument();
    });

    it('maintains hover states on interactive elements', () => {
      render(<HeroSection />);

      const uploadButton = screen.getByRole('button', { name: /Upload Your Report/i });
      expect(uploadButton).toHaveClass('group');

      // Check hover animation elements
      const arrowIcon = uploadButton.querySelector('[data-testid="arrow-right-icon"]');
      expect(arrowIcon).toHaveClass('transition-transform', 'group-hover:translate-x-1');
    });

    it('supports keyboard navigation', async () => {
      render(<HeroSection />);

      const uploadLink = screen.getByRole('link', { name: /Upload Your Report/i });
      const browseLink = screen.getByRole('link', { name: /Browse ACS Codes/i });

      // Test tab navigation
      await user.tab();
      expect(uploadLink).toHaveFocus();

      await user.tab();
      expect(browseLink).toHaveFocus();
    });
  });

  describe('Typography and Styling', () => {
    it('applies consistent text styling and spacing', () => {
      render(<HeroSection />);

      const heading = screen.getByRole('heading', { level: 1 });
      const description = screen.getByText(/Comprehensive pilot training platform/i);

      expect(heading).toHaveClass('text-gray-900');
      expect(description).toHaveClass('text-base', 'leading-8', 'text-gray-600', 'sm:text-lg');
    });

    it('displays statistics with proper emphasis', () => {
      render(<HeroSection />);

      const statValues = screen.getAllByText(/^(200\+|95%|10k\+|4\.9★)$/);
      statValues.forEach(value => {
        expect(value).toHaveClass('text-primary-600', 'text-3xl', 'font-bold');
      });
    });

    it('maintains consistent spacing throughout component', () => {
      render(<HeroSection />);

      const description = screen.getByText(/Comprehensive pilot training platform/i);
      expect(description).toHaveClass('mt-6', 'max-w-2xl', 'mx-auto');

      const ctaContainer = document.querySelector('.mt-10.flex');
      expect(ctaContainer).toBeInTheDocument();

      const statsContainer = document.querySelector('.mt-16.grid');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('renders without performance warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(<HeroSection />);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('uses efficient CSS classes for styling', () => {
      render(<HeroSection />);

      const section = document.querySelector('section');
      expect(section?.className).not.toContain('undefined');
      expect(section?.className).not.toContain('null');
    });
  });

  describe('Content Validation', () => {
    it('displays current and accurate metrics', () => {
      render(<HeroSection />);

      // Verify that metrics are reasonable and current
      expect(screen.getByText('200+')).toBeInTheDocument(); // ACS Codes
      expect(screen.getByText('95%')).toBeInTheDocument(); // Pass Rate
      expect(screen.getByText('10k+')).toBeInTheDocument(); // Active Users
      expect(screen.getByText('4.9★')).toBeInTheDocument(); // User Rating
    });

    it('includes all key value propositions', () => {
      render(<HeroSection />);

      const description = screen.getByText(/Comprehensive pilot training platform/i);
      expect(description).toHaveTextContent('SEO-discoverable ACS code references');
      expect(description).toHaveTextContent('AI-powered study plans');
      expect(description).toHaveTextContent('premium lesson content');
    });
  });
});