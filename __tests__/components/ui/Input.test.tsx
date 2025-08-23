/**
 * Tests for Input component
 * Testing form input functionality and validation display
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('should render basic input', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should render different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('should handle value and onChange', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(<Input value="" onChange={handleChange} placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello');
    
    expect(handleChange).toHaveBeenCalledTimes(5); // Called for each character
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
  });

  it('should show error state styling', () => {
    render(<Input error placeholder="Error input" />);
    
    const input = screen.getByPlaceholderText('Error input');
    expect(input).toHaveClass('border-red-300');
  });

  it('should apply custom className', () => {
    render(<Input className="custom-input" placeholder="Custom input" />);
    
    const input = screen.getByPlaceholderText('Custom input');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle focus events', async () => {
    const user = userEvent.setup();
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(
      <Input 
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Focus test"
      />
    );
    
    const input = screen.getByPlaceholderText('Focus test');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Input 
        placeholder="Accessible input"
        aria-label="Test input"
        aria-describedby="input-help"
        required
      />
    );
    
    const input = screen.getByPlaceholderText('Accessible input');
    expect(input).toHaveAttribute('aria-label', 'Test input');
    expect(input).toHaveAttribute('aria-describedby', 'input-help');
    expect(input).toHaveAttribute('required');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Input size="sm" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('h-8');

    rerender(<Input size="md" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('h-10');

    rerender(<Input size="lg" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('h-12');
  });

  it('should handle default props', () => {
    render(<Input data-testid="input" />);
    
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toHaveClass('border-red-300');
    expect(input).not.toBeDisabled();
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref test" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe('Ref test');
  });

  it('should handle keyboard events', async () => {
    const user = userEvent.setup();
    const handleKeyDown = jest.fn();
    const handleKeyUp = jest.fn();
    
    render(
      <Input 
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Keyboard test"
      />
    );
    
    const input = screen.getByPlaceholderText('Keyboard test');
    await user.type(input, 'a');
    
    expect(handleKeyDown).toHaveBeenCalled();
    expect(handleKeyUp).toHaveBeenCalled();
  });

  it('should handle form integration', () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    
    render(
      <form onSubmit={handleSubmit}>
        <Input name="testInput" defaultValue="test value" />
        <button type="submit">Submit</button>
      </form>
    );
    
    const input = screen.getByDisplayValue('test value');
    const submitButton = screen.getByText('Submit');
    
    expect(input).toHaveAttribute('name', 'testInput');
    
    fireEvent.click(submitButton);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});