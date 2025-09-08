/**
 * Comprehensive Button Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - All button variants (primary, secondary, outline, ghost, danger)
 * - All sizes (sm, md, lg)
 * - Loading state functionality
 * - Disabled state behavior
 * - Click handlers and user interactions
 * - Accessibility features and keyboard navigation
 * - Forwarded refs
 * - Custom className application
 * - Focus states and keyboard events
 * - Loading spinner integration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: ({ className, ...props }: any) => (
    <div data-testid="loader-icon" className={className} {...props} />
  ),
}));

describe('Button Component', () => {
  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<Button ref={ref}>Button</Button>);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(Button.displayName).toBe('Button');
    });

    it('spreads additional props', () => {
      render(
        <Button data-testid="test-button" aria-label="Test Button">
          Button
        </Button>
      );
      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('aria-label', 'Test Button');
    });
  });

  // Variant testing
  describe('Variant Styles', () => {
    it('renders primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
      expect(button).toHaveClass('border-input');
      expect(button).toHaveClass('bg-background');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-foreground');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('renders danger variant correctly', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });
  });

  // Size testing
  describe('Size Variants', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-sm');
    });

    it('renders small size correctly', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-sm');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-base');
    });
  });

  // Loading state tests
  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading={true}>Loading</Button>);
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading={true}>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies correct spinner classes', () => {
      render(<Button loading={true}>Loading</Button>);
      const spinner = screen.getByTestId('loader-icon');
      expect(spinner).toHaveClass('mr-2');
      expect(spinner).toHaveClass('h-4');
      expect(spinner).toHaveClass('w-4');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('shows children text alongside spinner', () => {
      render(<Button loading={true}>Processing...</Button>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('does not show spinner when loading is false', () => {
      render(<Button loading={false}>Not Loading</Button>);
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled={true}>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Button disabled={true}>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('disables when both disabled and loading are true', () => {
      render(<Button disabled={true} loading={true}>Disabled Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('remains enabled when disabled is false and loading is false', () => {
      render(<Button disabled={false} loading={false}>Enabled</Button>);
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  // Click handler tests
  describe('Click Interactions', () => {
    it('calls onClick handler when clicked', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled={true}>Disabled</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading={true}>Loading</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('passes event object to onClick handler', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Accessible Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('[Enter]');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports space key activation', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Space Button</Button>);
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('[Space]');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('has proper focus styles', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-offset-2');
    });

    it('supports custom aria attributes', () => {
      render(
        <Button aria-label="Custom label" aria-describedby="description">
          Button
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom label');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    it('has correct role and can be found by screen reader', () => {
      render(<Button>Screen Reader Button</Button>);
      const button = screen.getByRole('button', { name: /screen reader button/i });
      expect(button).toBeInTheDocument();
    });

    it('indicates loading state to screen readers', () => {
      render(
        <Button loading={true} aria-label="Loading button">
          Saving...
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Loading state is conveyed through disabled state and visible spinner
    });
  });

  // Focus management tests
  describe('Focus Management', () => {
    it('can receive focus', () => {
      render(<Button>Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('cannot be focused when disabled', () => {
      render(<Button disabled={true}>Cannot focus</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('maintains focus after non-disabling prop changes', () => {
      const { rerender } = render(<Button variant="primary">Focus me</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      rerender(<Button variant="secondary">Focus me</Button>);
      expect(button).toHaveFocus();
    });
  });

  // Event handling tests
  describe('Event Handling', () => {
    it('handles mouse events', async () => {
      const handleMouseEnter = jest.fn();
      const handleMouseLeave = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Hover me
        </Button>
      );
      const button = screen.getByRole('button');
      
      await user.hover(button);
      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
      await user.unhover(button);
      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Button onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
          Keyboard Button
        </Button>
      );
      const button = screen.getByRole('button');
      
      button.focus();
      await user.keyboard('[Enter]');
      
      expect(handleKeyDown).toHaveBeenCalled();
      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('handles focus and blur events', () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      
      render(
        <Button onFocus={handleFocus} onBlur={handleBlur}>
          Focus Button
        </Button>
      );
      const button = screen.getByRole('button');
      
      fireEvent.focus(button);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      fireEvent.blur(button);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  // Style combination tests
  describe('Style Combinations', () => {
    it('combines variant and size styles correctly', () => {
      render(<Button variant="outline" size="lg">Large Outline</Button>);
      const button = screen.getByRole('button');
      
      // Should have both outline and large styles
      expect(button).toHaveClass('border', 'border-input'); // outline
      expect(button).toHaveClass('px-6', 'py-3', 'text-base'); // lg
    });

    it('combines base styles with custom classes', () => {
      render(<Button className="custom-bg">Custom</Button>);
      const button = screen.getByRole('button');
      
      // Should have base styles and custom
      expect(button).toHaveClass('inline-flex', 'items-center'); // base
      expect(button).toHaveClass('custom-bg'); // custom
    });

    it('applies transition styles', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-all', 'duration-200');
    });

    it('applies correct focus ring colors for different variants', () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-primary');
      
      rerender(<Button variant="danger">Danger</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('focus:ring-destructive');
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(<Button>{""}</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toBeEmptyDOMElement();
    });

    it('handles multiple children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('handles React nodes as children', () => {
      const icon = <span data-testid="icon">🔥</span>;
      render(<Button>{icon} Fire Button</Button>);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Fire Button')).toBeInTheDocument();
    });

    it('maintains type attribute when specified', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('uses browser default for button type when not specified', () => {
      render(<Button>Default Type</Button>);
      const button = screen.getByRole('button');
      // HTML buttons default to type="submit" in forms, type="" otherwise
      // Our component doesn't explicitly set type, so it follows HTML defaults
      expect(button).not.toHaveAttribute('type', 'button');
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('handles rapid click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Rapid Click</Button>);
      const button = screen.getByRole('button');
      
      // Rapidly click multiple times
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('handles prop changes without issues', () => {
      const { rerender } = render(<Button variant="primary">Test</Button>);
      
      // Change props multiple times
      rerender(<Button variant="secondary">Test</Button>);
      rerender(<Button variant="outline">Test</Button>);
      rerender(<Button variant="ghost">Test</Button>);
      rerender(<Button variant="danger">Test</Button>);
      
      // Should not cause errors
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});