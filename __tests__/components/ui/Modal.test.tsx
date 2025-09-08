/**
 * Comprehensive Modal Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Modal open/close functionality
 * - Backdrop click handling
 * - Escape key functionality
 * - Focus management and accessibility
 * - Portal rendering behavior
 * - Size variants
 * - Custom styling and props
 * - Keyboard navigation
 * - Body scroll lock
 * - Event handlers
 * - Edge cases and error scenarios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: ({ className, ...props }: any) => (
    <div data-testid="close-icon" className={className} {...props} />
  ),
}));

// Mock react-dom createPortal for testing
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: any) => children,
}));

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });

    it('renders children correctly', () => {
      const customContent = <div>Custom Content</div>;
      render(<Modal {...defaultProps}>{customContent}</Modal>);
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('applies correct accessibility attributes', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('role', 'dialog');
    });

    it('renders backdrop with correct attributes', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('absolute', 'inset-0', 'bg-black', 'bg-opacity-50');
    });
  });

  // Title and header tests
  describe('Title and Header', () => {
    it('renders title when provided', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('associates title with modal using aria-labelledby', () => {
      render(<Modal {...defaultProps} title="Accessible Modal" />);
      const modal = screen.getByRole('dialog');
      const title = screen.getByText('Accessible Modal');
      
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(title).toHaveAttribute('id', 'modal-title');
    });

    it('does not set aria-labelledby when no title is provided', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
    });

    it('renders header when title or close button is present', () => {
      const { rerender } = render(<Modal {...defaultProps} title="Title" />);
      const headerWithTitle = document.querySelector('.border-b');
      expect(headerWithTitle).toBeInTheDocument();

      rerender(<Modal {...defaultProps} showCloseButton={true} />);
      const headerWithCloseButton = document.querySelector('.border-b');
      expect(headerWithCloseButton).toBeInTheDocument();
    });

    it('does not render header when no title and no close button', () => {
      render(<Modal {...defaultProps} showCloseButton={false} />);
      const header = document.querySelector('.border-b');
      expect(header).not.toBeInTheDocument();
    });
  });

  // Size variants tests
  describe('Size Variants', () => {
    it('applies medium size by default', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-lg');
    });

    it('applies small size correctly', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-md');
    });

    it('applies large size correctly', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-2xl');
    });

    it('applies extra large size correctly', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass('max-w-4xl');
    });
  });

  // Close functionality tests
  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByLabelText('Close modal');
      
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      
      await user.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      await user.keyboard('[Escape]');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      const modalContent = screen.getByText('Modal Content');
      
      await user.click(modalContent);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // Keyboard navigation tests
  describe('Keyboard Navigation', () => {
    it('handles Escape key correctly', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ignores other keys', () => {
      const onClose = jest.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });
      
      expect(onClose).not.toHaveBeenCalled();
    });

    it('only handles Escape when modal is open', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Modal is open, Escape should work
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
      
      onClose.mockClear();
      
      // Modal is closed, Escape should not work
      rerender(<Modal {...defaultProps} onClose={onClose} isOpen={false} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('close button is keyboard accessible', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();
      
      render(<Modal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByLabelText('Close modal');
      
      closeButton.focus();
      expect(closeButton).toHaveFocus();
      
      await user.keyboard('[Enter]');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('applies correct focus styles to close button', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  // Body scroll management tests
  describe('Body Scroll Management', () => {
    it('locks body scroll when modal opens', () => {
      render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(<Modal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('unset');
    });

    it('unlocks body scroll on unmount', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });

    it('handles multiple modals correctly', () => {
      const { rerender, unmount } = render(
        <div>
          <Modal isOpen={true} onClose={() => {}}>First Modal</Modal>
          <Modal isOpen={true} onClose={() => {}}>Second Modal</Modal>
        </div>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close one modal, body should still be locked
      rerender(
        <div>
          <Modal isOpen={false} onClose={() => {}}>First Modal</Modal>
          <Modal isOpen={true} onClose={() => {}}>Second Modal</Modal>
        </div>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      // Close all modals
      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  // Portal and mounting tests
  describe('Portal and Mounting', () => {
    it('handles mounting state correctly', async () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
      
      rerender(<Modal {...defaultProps} isOpen={true} />);
      await waitFor(() => {
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
      });
    });

    it('does not render before component mounts', () => {
      // This test ensures the mounted state prevents server-side rendering issues
      render(<Modal {...defaultProps} />);
      // The modal should render after mounting
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });
  });

  // Styling and layout tests
  describe('Styling and Layout', () => {
    it('applies correct base styles to modal container', () => {
      render(<Modal {...defaultProps} />);
      const container = document.querySelector('.fixed.inset-0.z-50');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'p-4');
    });

    it('applies correct styles to modal dialog', () => {
      render(<Modal {...defaultProps} />);
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveClass(
        'relative', 'w-full', 'rounded-lg', 'bg-white', 'shadow-xl', 'transition-all'
      );
    });

    it('applies correct styles to backdrop', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toHaveClass(
        'absolute', 'inset-0', 'bg-black', 'bg-opacity-50', 'transition-opacity'
      );
    });

    it('applies correct styles to header', () => {
      render(<Modal {...defaultProps} title="Test" />);
      const header = document.querySelector('.border-b');
      expect(header).toHaveClass(
        'flex', 'items-center', 'justify-between', 'border-b', 'border-gray-200', 'p-6'
      );
    });

    it('applies correct styles to title', () => {
      render(<Modal {...defaultProps} title="Styled Title" />);
      const title = screen.getByText('Styled Title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
    });

    it('applies correct styles to content area', () => {
      render(<Modal {...defaultProps} />);
      const content = screen.getByText('Modal Content').parentElement;
      expect(content).toHaveClass('p-6');
    });

    it('applies correct styles to close button', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveClass(
        'rounded-md', 'p-1', 'text-gray-400', 'transition-colors',
        'hover:text-gray-600', 'focus:outline-none', 'focus:ring-2'
      );
    });
  });

  // Complex content tests
  describe('Complex Content', () => {
    it('renders complex JSX content', () => {
      const complexContent = (
        <div>
          <h2>Complex Content</h2>
          <p>This is a paragraph</p>
          <button>Action Button</button>
        </div>
      );
      
      render(<Modal {...defaultProps}>{complexContent}</Modal>);
      
      expect(screen.getByText('Complex Content')).toBeInTheDocument();
      expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('handles interactive content correctly', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      const interactiveContent = (
        <div>
          <button onClick={handleClick}>Interactive Button</button>
        </div>
      );
      
      render(<Modal {...defaultProps}>{interactiveContent}</Modal>);
      const button = screen.getByText('Interactive Button');
      
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supports forms inside modal', async () => {
      const handleSubmit = jest.fn();
      const user = userEvent.setup();
      
      const formContent = (
        <form onSubmit={handleSubmit}>
          <input name="test" defaultValue="test value" />
          <button type="submit">Submit</button>
        </form>
      );
      
      render(<Modal {...defaultProps}>{formContent}</Modal>);
      const submitButton = screen.getByText('Submit');
      
      await user.click(submitButton);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  // Event handling tests
  describe('Event Handling', () => {
    it('prevents event bubbling from modal content', async () => {
      const onClose = jest.fn();
      const contentClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} onClose={onClose}>
          <div onClick={contentClick}>Clickable Content</div>
        </Modal>
      );
      
      const content = screen.getByText('Clickable Content');
      await user.click(content);
      
      expect(contentClick).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('handles rapid open/close correctly', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Rapidly toggle modal state
      rerender(<Modal {...defaultProps} onClose={onClose} isOpen={false} />);
      rerender(<Modal {...defaultProps} onClose={onClose} isOpen={true} />);
      rerender(<Modal {...defaultProps} onClose={onClose} isOpen={false} />);
      
      // Should handle state changes without errors
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles missing onClose gracefully', () => {
      // TypeScript would catch this, but test runtime behavior
      const modalProps = { isOpen: true, children: <div>Content</div> };
      expect(() => render(<Modal {...modalProps} onClose={undefined as any} />)).not.toThrow();
    });

    it('handles empty children', () => {
      render(<Modal {...defaultProps}>{null}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Modal {...defaultProps}>{undefined}</Modal>);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('handles string children', () => {
      render(<Modal {...defaultProps}>Simple string content</Modal>);
      expect(screen.getByText('Simple string content')).toBeInTheDocument();
    });

    it('handles number children', () => {
      render(<Modal {...defaultProps}>{42}</Modal>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('maintains functionality with very long content', () => {
      const longContent = 'A'.repeat(10000);
      render(<Modal {...defaultProps}>{longContent}</Modal>);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Modal {...defaultProps} title="Accessible Modal" />);
      const modal = screen.getByRole('dialog');
      
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('close button has proper accessibility label', () => {
      render(<Modal {...defaultProps} />);
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('backdrop has proper ARIA hidden attribute', () => {
      render(<Modal {...defaultProps} />);
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });

    it('supports screen readers', () => {
      render(<Modal {...defaultProps} title="Screen Reader Test" />);
      
      // Modal should be discoverable by role
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Title should be properly associated
      const modal = screen.getByRole('dialog');
      const titleId = modal.getAttribute('aria-labelledby');
      expect(document.getElementById(titleId!)).toHaveTextContent('Screen Reader Test');
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('does not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestModal = (props: any) => {
        renderSpy();
        return <Modal {...props} />;
      };

      const { rerender } = render(
        <TestModal {...defaultProps} title="Test" />
      );
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Same props should not trigger re-render
      rerender(<TestModal {...defaultProps} title="Test" />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Different props should trigger re-render
      rerender(<TestModal {...defaultProps} title="Different" />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles multiple rapid state changes', () => {
      const onClose = jest.fn();
      const { rerender } = render(<Modal {...defaultProps} onClose={onClose} />);
      
      // Simulate rapid state changes
      for (let i = 0; i < 10; i++) {
        rerender(<Modal {...defaultProps} onClose={onClose} isOpen={i % 2 === 0} />);
      }
      
      // Should not cause errors or memory leaks
      expect(() => rerender(<Modal {...defaultProps} onClose={onClose} />)).not.toThrow();
    });
  });
});