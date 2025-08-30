/**
 * Tests for ContactForm component
 * Testing form validation, submission, and user interaction
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/components/forms/ContactForm';

// Mock the form hooks
jest.mock('@/lib/hooks/useForm');

describe('ContactForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<ContactForm />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should have proper form labels and placeholders', () => {
    render(<ContactForm />);
    
    expect(screen.getByPlaceholderText('Your full name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('your.email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief subject line')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please describe your inquiry in detail...')).toBeInTheDocument();
  });

  it('should render category options', () => {
    render(<ContactForm />);
    
    const categorySelect = screen.getByLabelText(/category/i);
    expect(categorySelect).toBeInTheDocument();
    
    // Check if options are present
    expect(screen.getByDisplayValue('General Inquiry')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /technical support/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /billing question/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /feedback/i })).toBeInTheDocument();
  });

  it('should show character count for message field', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);
    
    const messageField = screen.getByLabelText(/message/i);
    
    // Initially should show 0/1000
    expect(screen.getByText('0/1000')).toBeInTheDocument();
    
    // Type some text and check count updates
    await user.type(messageField, 'Hello');
    expect(screen.getByText('5/1000')).toBeInTheDocument();
  });

  it('should disable form during loading state', () => {
    render(<ContactForm isLoading={true} />);
    
    expect(screen.getByLabelText(/name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/category/i)).toBeDisabled();
    expect(screen.getByLabelText(/subject/i)).toBeDisabled();
    expect(screen.getByLabelText(/message/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('should call onSubmit with form data when submitted', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Fill out the form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
    await user.selectOptions(screen.getByLabelText(/category/i), 'support');
    
    // Submit the form
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'This is a test message with enough characters.',
        category: 'support',
      });
    });
  });

  it('should show success message after successful submission', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Fill out and submit form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
    
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Message Sent Successfully!')).toBeInTheDocument();
      expect(screen.getByText(/thank you for contacting us/i)).toBeInTheDocument();
    });
  });

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
    
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Fill out and submit form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
    
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Submission failed')).toBeInTheDocument();
    });
  });

  it('should reset form and hide success message when "Send Another Message" is clicked', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Fill out and submit form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
    
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Message Sent Successfully!')).toBeInTheDocument();
    });
    
    // Click "Send Another Message"
    await user.click(screen.getByText('Send Another Message'));
    
    // Form should be visible again
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.queryByText('Message Sent Successfully!')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<ContactForm className="custom-contact-form" />);
    
    expect(container.firstChild).toHaveClass('custom-contact-form');
  });

  it('should show loading text during submission', async () => {
    const user = userEvent.setup();
    // Mock a delayed promise
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ContactForm onSubmit={mockOnSubmit} />);
    
    // Fill out form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/subject/i), 'Test Subject');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with enough characters.');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));
    
    // Should show loading text
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('should include privacy notice', () => {
    render(<ContactForm />);
    
    expect(screen.getByText(/required fields/i)).toBeInTheDocument();
    expect(screen.getByText(/never share your information/i)).toBeInTheDocument();
  });
});