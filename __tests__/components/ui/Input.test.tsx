/**
 * Comprehensive Input Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Basic input functionality and rendering
 * - Label association and accessibility
 * - Error state handling and validation
 * - Helper text display
 * - Form integration and value changes
 * - Keyboard navigation and events
 * - Accessibility features (ARIA attributes)
 * - Forwarded refs
 * - Input types and variants
 * - Custom styling and className application
 * - Edge cases and error scenarios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders input element correctly', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Input className="custom-input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-input');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(Input.displayName).toBe('Input');
    });

    it('spreads additional props', () => {
      render(
        <Input 
          data-testid="test-input" 
          aria-describedby="description"
          placeholder="Enter text"
        />
      );
      const input = screen.getByTestId('test-input');
      expect(input).toHaveAttribute('aria-describedby', 'description');
      expect(input).toHaveAttribute('placeholder', 'Enter text');
    });
  });

  // Label functionality tests
  describe('Label Functionality', () => {
    it('renders label when provided', () => {
      render(<Input label="Test Label" />);
      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    });

    it('associates label with input correctly', () => {
      render(<Input label="Email Address" />);
      const input = screen.getByLabelText('Email Address');
      const label = screen.getByText('Email Address');
      
      expect(label).toHaveAttribute('for', input.id);
      expect(input).toHaveAttribute('id', label.getAttribute('for'));
    });

    it('uses provided id when specified', () => {
      render(<Input id="custom-id" label="Custom ID" />);
      const input = screen.getByLabelText('Custom ID');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('generates unique ids for multiple inputs', () => {
      render(
        <div>
          <Input label="First Input" />
          <Input label="Second Input" />
        </div>
      );
      
      const firstInput = screen.getByLabelText('First Input');
      const secondInput = screen.getByLabelText('Second Input');
      
      expect(firstInput.id).not.toBe(secondInput.id);
      expect(firstInput.id).toMatch(/input-.+/);
      expect(secondInput.id).toMatch(/input-.+/);
    });

    it('does not render label when not provided', () => {
      render(<Input placeholder="No label" />);
      expect(screen.queryByText('No label')).not.toBeInTheDocument();
      // Only the input should be present
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('applies correct label styles', () => {
      render(<Input label="Styled Label" />);
      const label = screen.getByText('Styled Label');
      expect(label).toHaveClass('mb-1', 'block', 'text-sm', 'font-medium', 'text-gray-700');
    });
  });

  // Error state tests
  describe('Error State Handling', () => {
    it('displays error message when provided', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styles to input when error is present', () => {
      render(<Input error="Invalid input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-error-500');
      expect(input).toHaveClass('focus:border-error-500');
      expect(input).toHaveClass('focus:ring-error-500');
    });

    it('error message has correct accessibility attributes', () => {
      render(<Input error="Error message" />);
      const errorMessage = screen.getByText('Error message');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveClass('text-error-600', 'mt-1', 'text-sm');
    });

    it('prioritizes error over helper text', () => {
      render(<Input error="Error message" helperText="Helper text" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('shows helper text when no error is present', () => {
      render(<Input helperText="This is helpful" />);
      expect(screen.getByText('This is helpful')).toBeInTheDocument();
    });

    it('applies normal styles when no error', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveClass('border-error-500');
      expect(input).toHaveClass('border-gray-300');
    });
  });

  // Helper text tests
  describe('Helper Text', () => {
    it('displays helper text when provided and no error', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('applies correct helper text styles', () => {
      render(<Input helperText="Helper text" />);
      const helperText = screen.getByText('Helper text');
      expect(helperText).toHaveClass('mt-1', 'text-sm', 'text-gray-500');
    });

    it('does not render helper text when not provided', () => {
      render(<Input />);
      expect(screen.queryByText(/.+/)).toBeNull(); // No text content
    });

    it('helper text is hidden when error is present', () => {
      const { rerender } = render(<Input helperText="Helpful info" />);
      expect(screen.getByText('Helpful info')).toBeInTheDocument();
      
      rerender(<Input helperText="Helpful info" error="Something went wrong" />);
      expect(screen.queryByText('Helpful info')).not.toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  // Input type tests
  describe('Input Types', () => {
    it('defaults to text type', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('applies email type correctly', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('applies password type correctly', () => {
      render(<Input type="password" />);
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('applies number type correctly', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('supports various input types', () => {
      const types = ['tel', 'url', 'search', 'date'] as const;
      
      types.forEach(type => {
        const { unmount } = render(<Input type={type} data-testid={`${type}-input`} />);
        const input = screen.getByTestId(`${type}-input`);
        expect(input).toHaveAttribute('type', type);
        unmount();
      });
    });
  });

  // User interaction tests
  describe('User Interactions', () => {
    it('handles text input correctly', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('calls onChange handler when value changes', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalledTimes(4); // One for each character
    });

    it('handles focus and blur events', async () => {
      const handleFocus = jest.fn();
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await user.tab(); // Move focus away
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events', async () => {
      const handleKeyDown = jest.fn();
      const handleKeyUp = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'a');
      expect(handleKeyDown).toHaveBeenCalled();
      expect(handleKeyUp).toHaveBeenCalled();
    });

    it('supports controlled input with value prop', () => {
      const { rerender } = render(<Input value="initial" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('initial');
      
      rerender(<Input value="updated" onChange={() => {}} />);
      expect(input).toHaveValue('updated');
    });

    it('supports uncontrolled input with defaultValue', () => {
      render(<Input defaultValue="default text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default text');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('is keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('supports proper focus management', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(input).toHaveFocus();
    });

    it('applies correct focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:border-primary-500');
      expect(input).toHaveClass('focus:ring-primary-500');
      expect(input).toHaveClass('focus:outline-none');
      expect(input).toHaveClass('focus:ring-1');
    });

    it('supports custom ARIA attributes', () => {
      render(
        <Input 
          aria-label="Custom label"
          aria-describedby="description"
          aria-required="true"
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Custom label');
      expect(input).toHaveAttribute('aria-describedby', 'description');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('has appropriate role for screen readers', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('supports placeholder for additional context', () => {
      render(<Input placeholder="Enter your name" />);
      const input = screen.getByPlaceholderText('Enter your name');
      expect(input).toBeInTheDocument();
    });
  });

  // Disabled state tests
  describe('Disabled State', () => {
    it('applies disabled attribute correctly', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed');
      expect(input).toHaveClass('disabled:bg-gray-50');
      expect(input).toHaveClass('disabled:opacity-50');
    });

    it('prevents interaction when disabled', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input disabled onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'test');
      expect(handleChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('');
    });

    it('cannot receive focus when disabled', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      
      input.focus();
      expect(input).not.toHaveFocus();
    });
  });

  // Styling and layout tests
  describe('Styling and Layout', () => {
    it('applies correct base styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass(
        'flex', 'h-10', 'w-full', 'rounded-lg', 'border', 'border-gray-300',
        'bg-white', 'px-3', 'py-2', 'text-sm', 'text-gray-900',
        'placeholder-gray-500', 'shadow-sm', 'transition-colors'
      );
    });

    it('combines custom classes with base classes', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('flex', 'h-10', 'w-full'); // Base classes still present
    });

    it('wraps input in container div', () => {
      render(<Input label="Test" />);
      const container = screen.getByRole('textbox').closest('div');
      expect(container).toHaveClass('w-full');
    });

    it('maintains consistent spacing between elements', () => {
      render(<Input label="Label" error="Error" />);
      const label = screen.getByText('Label');
      const error = screen.getByText('Error');
      
      expect(label).toHaveClass('mb-1');
      expect(error).toHaveClass('mt-1');
    });
  });

  // Form integration tests
  describe('Form Integration', () => {
    it('works with form submission', () => {
      const handleSubmit = jest.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Input name="username" defaultValue="testuser" />
          <button type="submit">Submit</button>
        </form>
      );
      
      fireEvent.submit(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('supports name attribute for form data', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('supports required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('required');
    });

    it('works with form validation', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <Input type="email" required />
          <button type="submit">Submit</button>
        </form>
      );
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-email');
      
      // HTML5 validation should trigger
      expect(input.validity.valid).toBe(false);
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles empty label gracefully', () => {
      render(<Input label="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('handles empty error message', () => {
      render(<Input error="" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles empty helper text', () => {
      render(<Input helperText="" />);
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('works without any props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('handles special characters in input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      await user.type(input, specialText);
      expect(input).toHaveValue(specialText);
    });

    it('handles very long text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      const longText = 'a'.repeat(1000);
      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    it('maintains id uniqueness across re-renders', () => {
      const { rerender } = render(<Input label="Test" />);
      const firstId = screen.getByRole('textbox').id;
      
      rerender(<Input label="Test" />);
      const secondId = screen.getByRole('textbox').id;
      
      expect(firstId).toBe(secondId); // Should maintain same id
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestInput = (props: any) => {
        renderSpy();
        return <Input {...props} />;
      };

      const { rerender } = render(<TestInput label="Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not trigger re-render
      rerender(<TestInput label="Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Different props should trigger re-render
      rerender(<TestInput label="Different" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles rapid typing without performance issues', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      // Simulate rapid typing
      const text = 'rapidtyping';
      await user.type(input, text);
      
      expect(handleChange).toHaveBeenCalledTimes(text.length);
      expect(input).toHaveValue(text);
    });
  });
});