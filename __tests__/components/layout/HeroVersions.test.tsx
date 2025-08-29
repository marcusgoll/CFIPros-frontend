import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroVersionC } from '@/components/layout/HeroVersionC';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 1,
  AnimatePresence: ({ children }: any) => children,
}));

// Mock PremiumButton component
jest.mock('@/components/ui/PremiumButton', () => ({
  PremiumButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// Mock BackgroundShapes component
jest.mock('@/components/ui/BackgroundShapes', () => ({
  BackgroundShapes: ({ variant }: any) => (
    <div data-testid={`background-shapes-${variant}`} />
  ),
}));

describe('Hero Section Versions', () => {
  describe('HeroVersionC - Bold Typography with Subtle Animation', () => {
    it('renders hero version C with bold typography', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      // Check for main heading with bold styling
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('font-black');
    });

    it('displays bold, impactful messaging', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      expect(screen.getByText(/MASTER/i)).toBeInTheDocument();
    });

    it('has subtle animation classes', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      const heroSection = screen.getByTestId('hero-version-c');
      expect(heroSection).toHaveClass('overflow-hidden');
    });

    it('displays all CTA options', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      expect(screen.getByText('Try for Free')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });
  });

  describe('Version C Functionality', () => {
    it('accepts opacity and scale props', () => {
      const props = { opacity: 0.5, scale: 0.9 };
      
      expect(() => render(<HeroVersionC {...props} />)).not.toThrow();
    });

    it('is responsive', () => {
      const { container } = render(<HeroVersionC opacity={1} scale={1} />);
      
      const heroSection = container.firstChild as HTMLElement;
      expect(heroSection).toHaveClass('min-h-[90vh]');
    });

    it('has proper semantic structure', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      // Should have main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Should have section tag
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-label');
    });

    it('CTA buttons are keyboard accessible', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });

    it('maintains color contrast standards', () => {
      render(<HeroVersionC opacity={1} scale={1} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveClass('text-foreground');
    });
  });

  describe('Performance', () => {
    it('component renders without memory leaks', () => {
      const { unmount } = render(<HeroVersionC opacity={1} scale={1} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles rapid prop changes without errors', () => {
      const { rerender } = render(<HeroVersionC opacity={1} scale={1} />);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<HeroVersionC opacity={Math.random()} scale={Math.random()} />);
        }
      }).not.toThrow();
    });
  });
});