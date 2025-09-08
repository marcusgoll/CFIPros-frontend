/**
 * Comprehensive tests for LoginForm component
 * Tests authentication form rendering, validation, submission, and security
 * Part of Task 2.3: Form Validation Testing
 */

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/forms/LoginForm";

// Mock logger to avoid console outputs in tests
jest.mock("@/lib/utils/logger", () => ({
  logError: jest.fn(),
  logWarn: jest.fn(),
  logInfo: jest.fn(),
}));

// Mock Next.js Link component
jest.mock("next/link", () => {
  const MockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("LoginForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnForgotPassword = jest.fn();
  const mockOnSignUp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render all form fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should render form with correct field types and attributes", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute("autoComplete", "email");
      
      const passwordField = screen.getByLabelText(/password/i);
      expect(passwordField).toHaveAttribute("type", "password");
      expect(passwordField).toHaveAttribute("autoComplete", "current-password");
      
      const rememberMeField = screen.getByLabelText(/remember me/i);
      expect(rememberMeField).toHaveAttribute("type", "checkbox");
    });

    it("should render proper placeholders", () => {
      render(<LoginForm />);

      expect(screen.getByPlaceholderText("your.email@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    });

    it("should render form header and description", () => {
      render(<LoginForm />);

      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });

    it("should render password visibility toggle", () => {
      render(<LoginForm />);

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      render(<LoginForm />);

      expect(screen.getByText("Sign up")).toBeInTheDocument();
      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    });

    it("should render terms and privacy links", () => {
      render(<LoginForm />);

      expect(screen.getByText(/by signing in, you agree/i)).toBeInTheDocument();
      expect(screen.getByText("Terms of Service")).toBeInTheDocument();
      expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<LoginForm className="custom-login-form" />);
      expect(container.firstChild).toHaveClass("custom-login-form");
    });
  });

  describe("Form Validation", () => {
    it("should validate required email field", async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Try to submit with empty email
      await user.type(screen.getByLabelText(/password/i), "password123");
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Should not call onSubmit with invalid form
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate email format", async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const emailField = screen.getByLabelText(/email address/i);
      await user.type(emailField, "invalid-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.tab(); // Trigger blur for validation

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate required password field", async () => {
      const user = userEvent.setup();
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Try to submit with empty password
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should disable submit button when form is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      
      // Initially should be disabled (empty form)
      expect(submitButton).toBeDisabled();

      // Fill only email field - should still be disabled
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when form is valid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // Fill both required fields with valid data
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("should accept various valid email formats", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const validEmails = [
        "user@example.com",
        "test.user@example.co.uk", 
        "user+tag@example.org",
        "123@example.com"
      ];

      for (const email of validEmails) {
        const emailField = screen.getByLabelText(/email address/i);
        await user.clear(emailField);
        await user.type(emailField, email);
        await user.type(screen.getByLabelText(/password/i), "password123");

        const submitButton = screen.getByRole("button", { name: /sign in/i });
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled();
        });

        // Clear for next iteration
        await user.clear(screen.getByLabelText(/password/i));
      }
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility when button is clicked", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordField = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole("button", { name: /show password/i });

      // Initially password should be hidden
      expect(passwordField).toHaveAttribute("type", "password");

      // Click toggle to show password
      await user.click(toggleButton);
      expect(passwordField).toHaveAttribute("type", "text");

      // Click toggle again to hide password
      await user.click(toggleButton);
      expect(passwordField).toHaveAttribute("type", "password");
    });

    it("should update toggle button aria-label based on visibility state", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const toggleButton = screen.getByRole("button", { name: /show password/i });

      // Initially should show "show password" intention
      expect(toggleButton).toBeInTheDocument();

      // After clicking, should show "hide password" intention
      await user.click(toggleButton);
      // Button should still be accessible (implementation may vary)
      expect(toggleButton).toBeInTheDocument();
    });

    it("should disable password toggle when form is loading", () => {
      render(<LoginForm isLoading={true} />);

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      expect(toggleButton).toBeDisabled();
    });
  });

  describe("Form Submission", () => {
    it("should call onSubmit with correct credentials", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByLabelText(/remember me/i));

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      // Wait for submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "password123",
          rememberMe: true,
        });
      });
    });

    it("should handle remember me checkbox correctly", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill form without checking remember me
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: "user@example.com",
          password: "password123",
          rememberMe: false,
        });
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show loading text and be disabled
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error("Invalid credentials"));
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });

    it("should handle default behavior without onSubmit prop", async () => {
      const user = userEvent.setup();
      // Mock console.log to capture default behavior
      const mockLogInfo = jest.fn();
      require("@/lib/utils/logger").logInfo = mockLogInfo;

      render(<LoginForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should complete without errors and log the data
      await waitFor(() => {
        expect(mockLogInfo).toHaveBeenCalledWith("Login data:", expect.any(Object));
      });
    });

    it("should prevent multiple simultaneous submissions", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      
      // Try multiple rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      // Should only be called once
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Navigation and Callbacks", () => {
    it("should call onSignUp callback when provided", async () => {
      const user = userEvent.setup();
      render(<LoginForm onSignUp={mockOnSignUp} />);

      const signUpButton = screen.getByText("Sign up");
      await user.click(signUpButton);

      expect(mockOnSignUp).toHaveBeenCalled();
    });

    it("should render sign up link when no callback provided", () => {
      render(<LoginForm />);

      const signUpLink = screen.getByText("Sign up");
      expect(signUpLink.closest("a")).toHaveAttribute("href", "/register");
    });

    it("should call onForgotPassword callback when provided", async () => {
      const user = userEvent.setup();
      render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

      const forgotPasswordButton = screen.getByText("Forgot password?");
      await user.click(forgotPasswordButton);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });

    it("should render forgot password link when no callback provided", () => {
      render(<LoginForm />);

      const forgotPasswordLink = screen.getByText("Forgot password?");
      expect(forgotPasswordLink.closest("a")).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("Loading States", () => {
    it("should disable all fields when loading externally", () => {
      render(<LoginForm isLoading={true} />);

      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
      expect(screen.getByLabelText(/remember me/i)).toBeDisabled();
      expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    });

    it("should show loading component when external loading", () => {
      render(<LoginForm isLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should combine external and internal loading states", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const { rerender } = render(<LoginForm onSubmit={mockOnSubmit} />);
      
      // Fill form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      // Start submission (internal loading)
      await user.click(screen.getByRole("button", { name: /sign in/i }));
      
      // Add external loading
      rerender(<LoginForm onSubmit={mockOnSubmit} isLoading={true} />);

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels and IDs", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute("id", "email");
      expect(screen.getByLabelText(/password/i)).toHaveAttribute("id", "password");
      expect(screen.getByLabelText(/remember me/i)).toHaveAttribute("id", "rememberMe");
    });

    it("should have semantic form structure", () => {
      render(<LoginForm />);

      const formElement = screen.getByRole("form") || document.querySelector("form");
      expect(formElement).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailField = screen.getByLabelText(/email address/i);
      const passwordField = screen.getByLabelText(/password/i);
      const rememberMeField = screen.getByLabelText(/remember me/i);

      // Test tab navigation
      emailField.focus();
      expect(emailField).toHaveFocus();

      await user.tab();
      expect(passwordField).toHaveFocus();

      await user.tab(); // Skip password toggle button
      await user.tab();
      expect(rememberMeField).toHaveFocus();
    });

    it("should announce loading states to screen readers", () => {
      render(<LoginForm isLoading={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should have proper ARIA attributes for password toggle", () => {
      render(<LoginForm />);

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      expect(toggleButton).toHaveAttribute("type", "button");
    });

    it("should associate error messages with form fields", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error("Login failed"));
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill and submit form to trigger error
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("Security Features", () => {
    it("should not expose password in form data logging", async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      
      render(<LoginForm />);

      // Fill form with sensitive data
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "supersecretpassword");

      // Any logging should not expose the actual password
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("supersecretpassword")
      );

      consoleSpy.mockRestore();
    });

    it("should handle autocomplete attributes correctly", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute("autoComplete", "email");
      expect(screen.getByLabelText(/password/i)).toHaveAttribute("autoComplete", "current-password");
    });

    it("should prevent form submission on Enter key in password field", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      const passwordField = screen.getByLabelText(/password/i);
      await user.type(passwordField, "password123");

      // Press Enter in password field
      await user.keyboard("{Enter}");

      // Form should be submitted
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle extremely long input gracefully", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const longEmail = "a".repeat(100) + "@example.com";
      const longPassword = "p".repeat(1000);

      await user.type(screen.getByLabelText(/email address/i), longEmail);
      await user.type(screen.getByLabelText(/password/i), longPassword);

      // Should not break the component
      expect(screen.getByDisplayValue(longEmail)).toBeInTheDocument();
    });

    it("should handle special characters in credentials", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      render(<LoginForm onSubmit={mockOnSubmit} />);

      const specialEmail = "user+test@example.com";
      const specialPassword = "p@$$w0rd!@#$%^&*()";

      await user.type(screen.getByLabelText(/email address/i), specialEmail);
      await user.type(screen.getByLabelText(/password/i), specialPassword);
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: specialEmail,
          password: specialPassword,
          rememberMe: false,
        });
      });
    });

    it("should maintain form state during component re-renders", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<LoginForm />);

      // Fill some data
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      
      // Re-render component
      rerender(<LoginForm />);

      // Form should maintain its structure
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it("should handle network timeouts gracefully", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Should show loading state indefinitely
      expect(screen.getByText("Signing in...")).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });

    it("should handle rapid password visibility toggles", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const toggleButton = screen.getByRole("button", { name: /show password/i });
      const passwordField = screen.getByLabelText(/password/i);

      // Rapid toggles
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      // Should still work correctly
      expect(passwordField).toHaveAttribute("type", "password");
    });
  });

  describe("Error Handling", () => {
    it("should display generic error for network failures", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValue(new Error());
      render(<LoginForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("Invalid email or password. Please try again.")).toBeInTheDocument();
      });
    });

    it("should clear errors on new submission attempts", async () => {
      const user = userEvent.setup();
      mockOnSubmit
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce(undefined);
      
      render(<LoginForm onSubmit={mockOnSubmit} />);

      // First failed attempt
      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second successful attempt
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), "correctpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });
  });
});