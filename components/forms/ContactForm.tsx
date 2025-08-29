/**
 * Contact form component with Zod validation
 * Example implementation of form validation with React Hook Form and Zod
 */

import React, { useState } from 'react';
import { useForm } from '@/lib/hooks/useForm';
import { contactSchema, type ContactFormData } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/ErrorMessage';
import { LoadingState } from '@/components/ui/LoadingState';
import { cn } from '@/lib/utils';

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

export function ContactForm({ onSubmit, className, isLoading: externalLoading = false }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm({
    schema: contactSchema,
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
      category: 'general' as const,
    },
    onSubmit: async (data) => {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(false);

      try {
        if (onSubmit) {
          await onSubmit(data);
        } else {
          // Default behavior - simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setSubmitSuccess(true);
        form.reset();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to send message. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const isLoading = externalLoading || isSubmitting;

  if (submitSuccess) {
    return (
      <div className={cn('max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg', className)}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Message Sent Successfully!
          </h3>
          <p className="text-green-600 mb-4">
            Thank you for contacting us. We'll get back to you within 24 hours.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitSuccess(false);
              form.reset();
            }}
          >
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form 
      onSubmit={form.handleSubmit(form.submitForm)}
      className={cn('max-w-md mx-auto space-y-6', className)}
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <Input
          {...form.register('name')}
          id="name"
          type="text"
          placeholder="Your full name"
          disabled={isLoading}
          className={form.hasError('name') ? 'border-red-300 focus:border-red-500' : ''}
        />
        <FormError error={form.getError('name')} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <Input
          {...form.register('email')}
          id="email"
          type="email"
          placeholder="your.email@example.com"
          disabled={isLoading}
          className={form.hasError('email') ? 'border-red-300 focus:border-red-500' : ''}
        />
        <FormError error={form.getError('email')} />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category *
        </label>
        <select
          {...form.register('category')}
          id="category"
          disabled={isLoading}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-75',
            form.hasError('category') && 'border-red-300 focus:border-red-500'
          )}
        >
          <option value="general">General Inquiry</option>
          <option value="support">Technical Support</option>
          <option value="billing">Billing Question</option>
          <option value="feedback">Feedback</option>
        </select>
        <FormError error={form.getError('category')} />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Subject *
        </label>
        <Input
          {...form.register('subject')}
          id="subject"
          type="text"
          placeholder="Brief subject line"
          disabled={isLoading}
          className={form.hasError('subject') ? 'border-red-300 focus:border-red-500' : ''}
        />
        <FormError error={form.getError('subject')} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          {...form.register('message')}
          id="message"
          rows={5}
          placeholder="Please describe your inquiry in detail..."
          disabled={isLoading}
          className={cn(
            'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:opacity-75 resize-vertical',
            form.hasError('message') && 'border-red-300 focus:border-red-500'
          )}
        />
        <div className="flex justify-between items-center mt-1">
          <FormError error={form.getError('message')} />
          <span className="text-xs text-gray-500">
            {form.watch('message')?.length || 0}/1000
          </span>
        </div>
      </div>

      {submitError && (
        <FormError error={submitError} className="text-center" />
      )}

      <LoadingState loading={isLoading}>
        <Button
          type="submit"
          disabled={!form.isValid || isLoading}
          className="w-full"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
      </LoadingState>

      <p className="text-xs text-gray-500 text-center">
        * Required fields. We'll never share your information.
      </p>
    </form>
  );
}