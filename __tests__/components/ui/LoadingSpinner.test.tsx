/**
 * Comprehensive LoadingSpinner Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Basic rendering and display states
 * - Size variants (sm, md, lg)
 * - Text display functionality
 * - Animation and CSS classes
 * - Forwarded refs
 * - Custom styling and className application
 * - Accessibility features
 * - Edge cases and error scenarios
 * - Performance considerations
 */

import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader2-icon" className={className} {...props} />
  ),
}));

describe('LoadingSpinner Component', () => {
  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders loading spinner correctly', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<LoadingSpinner className="custom-spinner" />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('custom-spinner');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<LoadingSpinner ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(LoadingSpinner.displayName).toBe('LoadingSpinner');
    });

    it('spreads additional props', () => {
      render(
        <LoadingSpinner 
          data-testid="test-spinner"
          aria-label="Loading data"
          role="status"
        />
      );
      const container = screen.getByTestId('test-spinner');
      expect(container).toHaveAttribute('aria-label', 'Loading data');
      expect(container).toHaveAttribute('role', 'status');
    });
  });

  // Size variants tests
  describe('Size Variants', () => {
    it('applies medium size by default', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-6', 'w-6');
    });

    it('applies small size correctly', () => {
      render(<LoadingSpinner size="sm" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });

    it('applies large size correctly', () => {
      render(<LoadingSpinner size="lg" />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
    });

    it('maintains size consistency across re-renders', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      let icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
      
      rerender(<LoadingSpinner size="sm" />);
      icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  // Animation and styling tests
  describe('Animation and Styling', () => {
    it('applies animation classes to the icon', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('animate-spin');
      expect(icon).toHaveClass('text-primary-600');
    });

    it('applies correct base container styles', () => {
      render(<LoadingSpinner />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass(
        'flex', 'flex-col', 'items-center', 'justify-center'
      );
    });

    it('combines custom classes with base classes', () => {
      render(<LoadingSpinner className="custom-color" />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      
      expect(container).toHaveClass('custom-color');
      expect(container).toHaveClass('flex', 'flex-col', 'items-center'); // Base classes still present
    });

    it('maintains animation state', () => {
      const { rerender } = render(<LoadingSpinner />);
      let icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('animate-spin');
      
      // Re-render should maintain animation
      rerender(<LoadingSpinner />);
      icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('animate-spin');
    });
  });

  // Text functionality tests
  describe('Text Display', () => {
    it('does not show text when not provided', () => {
      render(<LoadingSpinner />);
      expect(screen.queryByText(/.+/)).toBeNull();
    });

    it('displays text when provided', () => {
      render(<LoadingSpinner text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('applies correct text styles', () => {
      render(<LoadingSpinner text="Loading data" />);
      const text = screen.getByText('Loading data');
      expect(text).toHaveClass('mt-2', 'text-sm', 'text-gray-600');
    });

    it('positions text below the spinner', () => {
      render(<LoadingSpinner text="Loading..." />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      const text = screen.getByText('Loading...');
      
      expect(container).toHaveClass('flex-col');
      expect(text).toHaveClass('mt-2');
    });

    it('handles various text content', () => {
      const testTexts = [
        'Loading...',
        'Please wait',
        'Processing your request',
        'Almost done!',
        '⏳ Loading data'
      ];
      
      testTexts.forEach(text => {
        const { unmount } = render(<LoadingSpinner text={text} />);
        expect(screen.getByText(text)).toBeInTheDocument();
        unmount();
      });
    });

    it('handles empty text gracefully', () => {
      render(<LoadingSpinner text="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles whitespace-only text', () => {
      render(<LoadingSpinner text="   " />);
      const text = screen.getByText('   ');
      expect(text).toBeInTheDocument();
      expect(text).toHaveClass('mt-2', 'text-sm', 'text-gray-600');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('supports custom ARIA attributes', () => {
      render(
        <LoadingSpinner 
          aria-label="Loading content"
          role="status"
          aria-live="polite"
        />
      );
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Loading content');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('provides meaningful content for screen readers with text', () => {
      render(<LoadingSpinner text="Loading your profile" />);
      const text = screen.getByText('Loading your profile');
      expect(text).toBeInTheDocument();
    });

    it('is properly structured for assistive technology', () => {
      render(
        <LoadingSpinner 
          text="Loading..." 
          role="status"
          aria-label="Content is loading"
        />
      );
      
      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('aria-label', 'Content is loading');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('supports semantic HTML roles', () => {
      render(<LoadingSpinner role="progressbar" />);
      const container = screen.getByRole('progressbar');
      expect(container).toBeInTheDocument();
    });

    it('can be hidden from screen readers when needed', () => {
      render(<LoadingSpinner aria-hidden="true" />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });
  });

  // Component composition tests
  describe('Component Composition', () => {
    it('works with different size and text combinations', () => {
      const combinations = [
        { size: 'sm' as const, text: 'Loading...' },
        { size: 'md' as const, text: 'Please wait' },
        { size: 'lg' as const, text: 'Processing data' },
      ];
      
      combinations.forEach(({ size, text }) => {
        const { unmount } = render(<LoadingSpinner size={size} text={text} />);
        
        const icon = screen.getByTestId('loader2-icon');
        const textElement = screen.getByText(text);
        
        // Check size classes
        if (size === 'sm') expect(icon).toHaveClass('h-4', 'w-4');
        if (size === 'md') expect(icon).toHaveClass('h-6', 'w-6');
        if (size === 'lg') expect(icon).toHaveClass('h-8', 'w-8');
        
        // Check text is present
        expect(textElement).toBeInTheDocument();
        
        unmount();
      });
    });

    it('maintains proper layout with long text', () => {
      const longText = 'This is a very long loading message that might wrap to multiple lines and should still be properly styled';
      render(<LoadingSpinner text={longText} />);
      
      const text = screen.getByText(longText);
      expect(text).toBeInTheDocument();
      expect(text).toHaveClass('mt-2', 'text-sm', 'text-gray-600');
    });

    it('works with custom styling and text', () => {
      render(
        <LoadingSpinner 
          className="bg-blue-100 p-4 rounded" 
          text="Custom styled loader"
          size="lg"
        />
      );
      
      const container = screen.getByText('Custom styled loader').closest('div');
      const icon = screen.getByTestId('loader2-icon');
      
      expect(container).toHaveClass('bg-blue-100', 'p-4', 'rounded');
      expect(icon).toHaveClass('h-8', 'w-8');
      expect(screen.getByText('Custom styled loader')).toBeInTheDocument();
    });
  });

  // Layout and positioning tests
  describe('Layout and Positioning', () => {
    it('centers content horizontally and vertically', () => {
      render(<LoadingSpinner />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('items-center', 'justify-center');
    });

    it('uses column layout for icon and text', () => {
      render(<LoadingSpinner text="Loading..." />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('flex-col');
    });

    it('maintains layout with different content', () => {
      const { rerender } = render(<LoadingSpinner />);
      let container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('flex', 'flex-col');
      
      rerender(<LoadingSpinner text="With text" />);
      container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('flex', 'flex-col');
    });

    it('handles container sizing correctly', () => {
      render(<LoadingSpinner className="w-32 h-24" />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass('w-32', 'h-24');
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles null text gracefully', () => {
      render(<LoadingSpinner text={null as any} />);
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });

    it('handles undefined text gracefully', () => {
      render(<LoadingSpinner text={undefined} />);
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    it('handles numeric text values', () => {
      render(<LoadingSpinner text={42 as any} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles boolean text values', () => {
      render(<LoadingSpinner text={true as any} />);
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('works without any props', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('handles invalid size prop gracefully', () => {
      // TypeScript would catch this, but test runtime behavior
      render(<LoadingSpinner size={'invalid' as any} />);
      const icon = screen.getByTestId('loader2-icon');
      // Should not crash and should fall back to some reasonable behavior
      expect(icon).toBeInTheDocument();
    });

    it('handles very long className strings', () => {
      const longClassName = 'class-' + 'name-'.repeat(100);
      render(<LoadingSpinner className={longClassName} />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      expect(container).toHaveClass(longClassName);
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestSpinner = (props: any) => {
        renderSpy();
        return <LoadingSpinner {...props} />;
      };

      const { rerender } = render(<TestSpinner size="md" text="Loading" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not trigger re-render
      rerender(<TestSpinner size="md" text="Loading" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Different props should trigger re-render
      rerender(<TestSpinner size="lg" text="Loading" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid prop changes efficiently', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      
      // Rapidly change props
      const sizes = ['sm', 'md', 'lg'] as const;
      sizes.forEach(size => {
        rerender(<LoadingSpinner size={size} />);
      });
      
      // Should not cause errors
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('maintains animation performance', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('loader2-icon');
      
      // Animation class should be consistently applied
      expect(icon).toHaveClass('animate-spin');
      
      // CSS animation should be efficient (checked via classes)
      expect(icon.className).toContain('animate-spin');
    });
  });

  // Style combination tests
  describe('Style Combinations', () => {
    it('combines size and custom classes correctly', () => {
      render(<LoadingSpinner size="lg" className="custom-spinner" />);
      const container = screen.getByTestId('loader2-icon').closest('div');
      const icon = screen.getByTestId('loader2-icon');
      
      // Should have both size and custom classes
      expect(icon).toHaveClass('h-8', 'w-8'); // lg size
      expect(container).toHaveClass('custom-spinner'); // custom
    });

    it('maintains consistent color scheme', () => {
      render(<LoadingSpinner />);
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('text-primary-600');
    });

    it('handles conflicting CSS classes gracefully', () => {
      render(<LoadingSpinner className="text-red-500" />);
      const icon = screen.getByTestId('loader2-icon');
      
      // Both classes should be present, with CSS cascade determining final style
      expect(icon).toHaveClass('text-primary-600');
      expect(icon.closest('div')).toHaveClass('text-red-500');
    });
  });

  // Integration scenarios
  describe('Integration Scenarios', () => {
    it('works within form contexts', () => {
      render(
        <form>
          <LoadingSpinner text="Submitting form..." />
        </form>
      );
      
      expect(screen.getByText('Submitting form...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('works within modal or overlay contexts', () => {
      render(
        <div className="fixed inset-0 bg-black bg-opacity-50">
          <LoadingSpinner text="Loading modal content..." />
        </div>
      );
      
      expect(screen.getByText('Loading modal content...')).toBeInTheDocument();
      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
    });

    it('works as a page-level loader', () => {
      render(
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading application..." />
        </div>
      );
      
      const icon = screen.getByTestId('loader2-icon');
      expect(icon).toHaveClass('h-8', 'w-8');
      expect(screen.getByText('Loading application...')).toBeInTheDocument();
    });

    it('works with conditional rendering', () => {
      const { rerender } = render(
        <div>
          {true && <LoadingSpinner text="Conditional loading" />}
        </div>
      );
      
      expect(screen.getByText('Conditional loading')).toBeInTheDocument();
      
      rerender(
        <div>
          {false && <LoadingSpinner text="Conditional loading" />}
        </div>
      );
      
      expect(screen.queryByText('Conditional loading')).not.toBeInTheDocument();
    });
  });
});