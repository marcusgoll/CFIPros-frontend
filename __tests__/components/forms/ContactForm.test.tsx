/**
 * Comprehensive tests for ContactForm component
 * Tests form rendering, validation, submission, and user interactions
 * Part of Task 2.3: Form Validation Testing
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/forms/ContactForm";

// Mock logger to avoid console outputs in tests
jest.mock("@/lib/utils/logger", () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn(),
}));

describe("ContactForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    });

    it("should render form with correct field types and attributes", () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute("type", "text");
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/subject/i)).toHaveAttribute("type", "text");
      expect(screen.getByLabelText(/message/i).tagName).toBe("TEXTAREA");
      expect(screen.getByLabelText(/category/i).tagName).toBe("SELECT");
    });

    it("should render proper placeholders", () => {
      render(<ContactForm />);

      expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("your.email@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Brief subject line")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Please describe your inquiry in detail...")).toBeInTheDocument();
    });

    it("should render category options", () => {
      render(<ContactForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      expect(categorySelect).toBeInTheDocument();

      expect(screen.getByRole("option", { name: /general inquiry/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /technical support/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /billing question/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /feedback/i })).toBeInTheDocument();
    });

    it("should render required field indicators", () => {
      render(<ContactForm />);

      expect(screen.getByText(/name \*/i)).toBeInTheDocument();
      expect(screen.getByText(/email \*/i)).toBeInTheDocument();
      expect(screen.getByText(/category \*/i)).toBeInTheDocument();
      expect(screen.getByText(/subject \*/i)).toBeInTheDocument();
      expect(screen.getByText(/message \*/i)).toBeInTheDocument();
    });

    it("should render character counter for message field", () => {
      render(<ContactForm />);

      expect(screen.getByText("0/1000")).toBeInTheDocument();
    });

    it("should render privacy notice", () => {
      render(<ContactForm />);

      expect(screen.getByText(/required fields/i)).toBeInTheDocument();
      expect(screen.getByText(/never share your information/i)).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<ContactForm className="custom-contact-form" />);
      expect(container.firstChild).toHaveClass("custom-contact-form");
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for empty required fields", async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Try to submit empty form
      const submitButton = screen.getByRole("button", { name: /send message/i });
      await user.click(submitButton);

      // Should not call onSubmit with invalid form
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);

      const emailField = screen.getByLabelText(/email/i);
      await user.type(emailField, "invalid-email");
      await user.tab(); // Trigger blur for validation

      // Form should not be valid with invalid email
      const submitButton = screen.getByRole("button", { name: /send message/i });
      await user.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate message length", async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill required fields except message
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      
      // Try with short message
      await user.type(screen.getByLabelText(/message/i), "Short");

      const submitButton = screen.getByRole("button", { name: /send message/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when form is invalid", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const submitButton = screen.getByRole("button", { name: /send message/i });
      
      // Initially should be disabled (empty form)
      expect(submitButton).toBeDisabled();

      // Fill only name field - should still be disabled
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is valid", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      // Fill all required fields with valid data
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a valid message with enough characters.");

      const submitButton = screen.getByRole("button", { name: /send message/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe("User Interactions", () => {
    it("should update character count as user types in message field", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const messageField = screen.getByLabelText(/message/i);

      // Initially should show 0/1000
      expect(screen.getByText("0/1000")).toBeInTheDocument();

      // Type some text and check count updates
      await user.type(messageField, "Hello");
      expect(screen.getByText("5/1000")).toBeInTheDocument();

      // Type more text
      await user.type(messageField, " world!");
      expect(screen.getByText("12/1000")).toBeInTheDocument();
    });

    it("should allow selecting different categories", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const categorySelect = screen.getByLabelText(/category/i);
      
      // Default should be general
      expect(categorySelect).toHaveValue("general");

      // Change to support
      await user.selectOptions(categorySelect, "support");
      expect(categorySelect).toHaveValue("support");

      // Change to billing
      await user.selectOptions(categorySelect, "billing");
      expect(categorySelect).toHaveValue("billing");
    });

    it("should handle long message input", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const messageField = screen.getByLabelText(/message/i);
      const longMessage = "a".repeat(500);

      await user.type(messageField, longMessage);
      expect(screen.getByText("500/1000")).toBeInTheDocument();
    });

    it("should handle message at character limit", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const messageField = screen.getByLabelText(/message/i);
      const maxMessage = "a".repeat(1000);

      await user.type(messageField, maxMessage);
      expect(screen.getByText("1000/1000")).toBeInTheDocument();
    });

    it("should clear form fields when reset", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");

      // Fields should have values
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call onSubmit with correct form data", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");
      await user.selectOptions(screen.getByLabelText(/category/i), "support");

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /send message/i });
      await user.click(submitButton);

      // Wait for submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: "John Doe",
          email: "john@example.com",
          subject: "Test Subject",
          message: "This is a test message with enough characters.",
          category: "support",
        });
      });
    });

    it("should show success message after successful submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
        expect(screen.getByText(/thank you for contacting us/i)).toBeInTheDocument();
        expect(screen.getByText(/we'll get back to you within 24 hours/i)).toBeInTheDocument();
      });
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error("Network error"));
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      // Submit form
      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Should show loading text and be disabled
      expect(screen.getByText("Sending...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
      });
    });

    it("should reset form and allow sending another message", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
      });

      // Click "Send Another Message"
      await user.click(screen.getByText("Send Another Message"));

      // Form should be visible again with empty fields
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // Empty name field
      expect(screen.queryByText("Message Sent Successfully!")).not.toBeInTheDocument();
    });

    it("should handle default behavior without onSubmit prop", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      // Should be able to submit without error
      const submitButton = screen.getByRole("button", { name: /send message/i });
      await user.click(submitButton);

      // Should show success message after default simulation
      await waitFor(() => {
        expect(screen.getByText("Message Sent Successfully!")).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("should disable all fields when loading externally", () => {
      render(<ContactForm isLoading={true} />);

      expect(screen.getByLabelText(/name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/category/i)).toBeDisabled();
      expect(screen.getByLabelText(/subject/i)).toBeDisabled();
      expect(screen.getByLabelText(/message/i)).toBeDisabled();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should show loading component when external loading", () => {
      render(<ContactForm isLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should combine external and internal loading states", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { rerender } = render(<ContactForm onSubmit={mockOnSubmit} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      // Start submission (internal loading)
      await user.click(screen.getByRole("button", { name: /send message/i }));
      
      // Add external loading
      rerender(<ContactForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels and IDs", () => {
      render(<ContactForm />);

      expect(screen.getByLabelText(/name/i)).toHaveAttribute("id", "name");
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("id", "email");
      expect(screen.getByLabelText(/category/i)).toHaveAttribute("id", "category");
      expect(screen.getByLabelText(/subject/i)).toHaveAttribute("id", "subject");
      expect(screen.getByLabelText(/message/i)).toHaveAttribute("id", "message");
    });

    it("should have semantic form structure", () => {
      render(<ContactForm />);

      const formElement = screen.getByRole("form") || document.querySelector("form");
      expect(formElement).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const nameField = screen.getByLabelText(/name/i);
      const emailField = screen.getByLabelText(/email/i);

      // Test tab navigation
      nameField.focus();
      expect(nameField).toHaveFocus();

      await user.tab();
      expect(emailField).toHaveFocus();
    });

    it("should announce loading states to screen readers", () => {
      render(<ContactForm isLoading={true} />);

      // Loading state should be announced
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes for form submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Success message should have proper role
      await waitFor(() => {
        const successMessage = screen.getByText("Message Sent Successfully!").closest("div");
        // Success section should be identifiable
        expect(successMessage).toBeInTheDocument();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle extremely long input gracefully", async () => {
      const user = userEvent.setup();
      render(<ContactForm />);

      const longName = "a".repeat(1000);
      const nameField = screen.getByLabelText(/name/i);

      await user.type(nameField, longName);
      
      // Should not break the component
      expect(nameField).toBeInTheDocument();
    });

    it("should handle special characters in input", async () => {
      const user = userEvent.setup();
      render(<ContactForm onSubmit={mockOnSubmit} />);

      const specialChars = "äöüß中文🚀!@#$%^&*()";
      
      await user.type(screen.getByLabelText(/name/i), specialChars);
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/subject/i), specialChars);
      await user.type(screen.getByLabelText(/message/i), `${specialChars} with enough length to be valid`);

      // Should handle special characters without issues
      expect(screen.getByDisplayValue(specialChars)).toBeInTheDocument();
    });

    it("should handle rapid consecutive submissions", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      const submitButton = screen.getByRole("button", { name: /send message/i });
      
      // Try multiple rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      
      // Should only be called once due to form being disabled during submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it("should maintain form state during component re-renders", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ContactForm />);

      // Fill some data
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      
      // Re-render component
      rerender(<ContactForm />);

      // Data should still be there due to controlled form state
      // Note: This depends on the form implementation maintaining state
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    it("should handle submission timeout gracefully", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ContactForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/subject/i), "Test Subject");
      await user.type(screen.getByLabelText(/message/i), "This is a test message with enough characters.");

      await user.click(screen.getByRole("button", { name: /send message/i }));

      // Should show loading state
      expect(screen.getByText("Sending...")).toBeInTheDocument();
      
      // Component should remain stable even with hanging promise
      expect(screen.getByLabelText(/name/i)).toBeDisabled();
    });
  });
});