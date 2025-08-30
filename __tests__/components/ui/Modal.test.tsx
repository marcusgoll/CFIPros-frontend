/**
 * Tests for Modal component
 * Testing modal display, interaction, and accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.body.style for testing
    document.body.style.overflow = '';
  });

  it('should render modal when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should not render modal when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const mockOnClose = jest.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', () => {
    const mockOnClose = jest.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const modalContent = screen.getByText('Modal content');
    fireEvent.click(modalContent);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close on backdrop click by default', () => {
    const mockOnClose = jest.fn();
    render(
      <Modal 
        {...defaultProps} 
        onClose={mockOnClose}
      />
    );
    
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close on Escape key by default', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();
    render(
      <Modal 
        {...defaultProps} 
        onClose={mockOnClose}
      />
    );
    
    await user.keyboard('{Escape}');
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should apply different size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    let modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-md');

    rerender(<Modal {...defaultProps} size="md" />);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="lg" />);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-2xl');

    rerender(<Modal {...defaultProps} size="xl" />);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-4xl');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    
    let modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-md');
    
    rerender(<Modal {...defaultProps} size="lg" />);
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-4xl');
  });

  it('should render without title', () => {
    const propsWithoutTitle = { ...defaultProps };
    delete (propsWithoutTitle as any).title;
    render(<Modal {...propsWithoutTitle} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should focus management work correctly', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);
    
    // Modal should be focused when opened
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveFocus();
    });

    // Tab should cycle through focusable elements
    await user.tab();
    expect(screen.getByLabelText('Close modal')).toHaveFocus();
  });

  it('should lock body scroll when opened', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('should handle portal rendering', () => {
    render(<Modal {...defaultProps} />);
    
    // Modal should be rendered in a portal (outside the normal DOM tree)
    const modal = screen.getByRole('dialog');
    expect(modal.parentElement?.tagName).toBe('DIV');
  });

  it('should have proper ARIA attributes', () => {
    render(<Modal {...defaultProps} />);
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby');
  });

  it('should prevent scroll on background when modal is open', () => {
    render(<Modal {...defaultProps} />);
    
    // Simulate scroll event on background
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
    
    // Body overflow should be hidden
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = render(<Modal {...defaultProps} />);
    
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('should handle multiple modals gracefully', () => {
    render(
      <>
        <Modal {...defaultProps} title="First Modal" />
        <Modal {...defaultProps} title="Second Modal" />
      </>
    );
    
    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
  });

  it('should render modal content properly', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should handle async onClose', async () => {
    const mockOnClose = jest.fn().mockResolvedValue(undefined);
    render(<Modal {...defaultProps} onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});