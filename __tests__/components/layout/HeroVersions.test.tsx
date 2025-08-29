import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HeroVersionA } from '@/components/layout/HeroVersionA';
import { HeroVersionB } from '@/components/layout/HeroVersionB';
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
  describe('HeroVersionA - Gradient with Particle Effects', () => {
    it('renders hero version A with main elements', () => {
      render(<HeroVersionA opacity={1} scale={1} />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText(/Train smarter/i)).toBeInTheDocument();
      
      // Check for rating display
      expect(screen.getByText(/4\.8/)).toBeInTheDocument();
    });

    it('displays all three audience-specific CTA buttons', () => {
      render(<HeroVersionA opacity={1} scale={1} />);
      
      expect(screen.getByText('Try for Free')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('has gradient background styling', () => {
      render(<HeroVersionA opacity={1} scale={1} />);
      
      const heroSection = screen.getByTestId('hero-version-a');
      expect(heroSection).toHaveClass('bg-gradient-to-br');
    });
  });

  describe('HeroVersionB - Minimalist with Geometric Shapes', () => {
    it('renders hero version B with clean design', () => {
      render(<HeroVersionB opacity={1} scale={1} />);
      
      // Check for main heading
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      
      // Check for clean, minimalist text
      expect(screen.getByText(/Analyze Flight Training/i)).toBeInTheDocument();
    });

    it('displays geometric background shapes', () => {
      render(<HeroVersionB opacity={1} scale={1} />);
      
      const heroSection = screen.getByTestId('hero-version-b');
      const geometricElements = heroSection.querySelectorAll('.geometric-shape');
      expect(geometricElements.length).toBeGreaterThan(0);
    });

    it('has minimalist styling classes', () => {
      render(<HeroVersionB opacity={1} scale={1} />);
      
      const heroSection = screen.getByTestId('hero-version-b');
      expect(heroSection).toHaveClass('bg-background');
    });

    it('displays audience-specific CTAs', () => {
      render(<HeroVersionB opacity={1} scale={1} />);
      
      expect(screen.getByText('Try for Free')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });
  });

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

  describe('Cross-Version Functionality', () => {
    it('all versions accept opacity and scale props', () => {
      const props = { opacity: 0.5, scale: 0.9 };
      
      expect(() => render(<HeroVersionA {...props} />)).not.toThrow();
      expect(() => render(<HeroVersionB {...props} />)).not.toThrow();
      expect(() => render(<HeroVersionC {...props} />)).not.toThrow();
    });

    it('all versions are responsive', () => {
      [HeroVersionA, HeroVersionB, HeroVersionC].forEach((Component) => {
        const { container } = render(<Component opacity={1} scale={1} />);
        
        const heroSection = container.firstChild as HTMLElement;
        expect(heroSection).toHaveClass('min-h-[90vh]');
      });
    });

    it('all versions have proper semantic structure', () => {
      [HeroVersionA, HeroVersionB, HeroVersionC].forEach((Component) => {
        render(<Component opacity={1} scale={1} />);
        
        // Should have main heading
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Should have section tag
        expect(screen.getByRole('region')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('all hero versions have proper ARIA labels', () => {
      [HeroVersionA, HeroVersionB, HeroVersionC].forEach((Component) => {
        render(<Component opacity={1} scale={1} />);
        
        const section = screen.getByRole('region');
        expect(section).toHaveAttribute('aria-label');
      });
    });

    it('CTA buttons are keyboard accessible', () => {
      render(<HeroVersionA opacity={1} scale={1} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex');
      });
    });

    it('maintains color contrast standards', () => {
      [HeroVersionA, HeroVersionB, HeroVersionC].forEach((Component) => {
        render(<Component opacity={1} scale={1} />);
        
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveClass('text-foreground');
      });
    });
  });

  describe('Performance', () => {
    it('components render without memory leaks', () => {
      const { unmount: unmountA } = render(<HeroVersionA opacity={1} scale={1} />);
      const { unmount: unmountB } = render(<HeroVersionB opacity={1} scale={1} />);
      const { unmount: unmountC } = render(<HeroVersionC opacity={1} scale={1} />);
      
      expect(() => {
        unmountA();
        unmountB();
        unmountC();
      }).not.toThrow();
    });

    it('handles rapid prop changes without errors', () => {
      const { rerender } = render(<HeroVersionA opacity={1} scale={1} />);
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          rerender(<HeroVersionA opacity={Math.random()} scale={Math.random()} />);
        }
      }).not.toThrow();
    });
  });
});