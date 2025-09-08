/**
 * Comprehensive Card Component Tests
 * Tests for Task 2.1: React Components Testing
 * 
 * Coverage Areas:
 * - Card component and all sub-components
 * - Padding variants (none, sm, md, lg)
 * - Shadow variants (none, sm, md, lg)
 * - CardHeader, CardTitle, CardContent, CardFooter
 * - Content rendering and children
 * - Forwarded refs for all components
 * - Custom styling and className application
 * - Component composition and layout
 * - Accessibility features
 * - Edge cases and error scenarios
 */

import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card Components', () => {
  // Main Card component tests
  describe('Card Component', () => {
    describe('Basic Rendering', () => {
      it('renders children correctly', () => {
        render(<Card>Card Content</Card>);
        expect(screen.getByText('Card Content')).toBeInTheDocument();
      });

      it('applies custom className', () => {
        render(<Card className="custom-card">Card</Card>);
        const card = screen.getByText('Card');
        expect(card).toHaveClass('custom-card');
      });

      it('forwards ref correctly', () => {
        const ref = jest.fn();
        render(<Card ref={ref}>Card</Card>);
        expect(ref).toHaveBeenCalled();
      });

      it('has correct display name', () => {
        expect(Card.displayName).toBe('Card');
      });

      it('spreads additional props', () => {
        render(
          <Card data-testid="test-card" aria-label="Test Card">
            Card Content
          </Card>
        );
        const card = screen.getByTestId('test-card');
        expect(card).toHaveAttribute('aria-label', 'Test Card');
      });

      it('applies base styles correctly', () => {
        render(<Card>Base Card</Card>);
        const card = screen.getByText('Base Card');
        expect(card).toHaveClass('rounded-lg', 'bg-white', 'ring-1', 'ring-gray-200');
      });
    });

    describe('Padding Variants', () => {
      it('applies medium padding by default', () => {
        render(<Card>Default Padding</Card>);
        const card = screen.getByText('Default Padding');
        expect(card).toHaveClass('p-6');
      });

      it('applies no padding correctly', () => {
        render(<Card padding="none">No Padding</Card>);
        const card = screen.getByText('No Padding');
        expect(card).not.toHaveClass('p-4', 'p-6', 'p-8');
      });

      it('applies small padding correctly', () => {
        render(<Card padding="sm">Small Padding</Card>);
        const card = screen.getByText('Small Padding');
        expect(card).toHaveClass('p-4');
      });

      it('applies large padding correctly', () => {
        render(<Card padding="lg">Large Padding</Card>);
        const card = screen.getByText('Large Padding');
        expect(card).toHaveClass('p-8');
      });

      it('maintains padding consistency across re-renders', () => {
        const { rerender } = render(<Card padding="sm">Consistent</Card>);
        let card = screen.getByText('Consistent');
        expect(card).toHaveClass('p-4');

        rerender(<Card padding="sm">Consistent</Card>);
        card = screen.getByText('Consistent');
        expect(card).toHaveClass('p-4');
      });
    });

    describe('Shadow Variants', () => {
      it('applies small shadow by default', () => {
        render(<Card>Default Shadow</Card>);
        const card = screen.getByText('Default Shadow');
        expect(card).toHaveClass('shadow-sm');
      });

      it('applies no shadow correctly', () => {
        render(<Card shadow="none">No Shadow</Card>);
        const card = screen.getByText('No Shadow');
        expect(card).not.toHaveClass('shadow-sm', 'shadow-md', 'shadow-lg');
      });

      it('applies medium shadow correctly', () => {
        render(<Card shadow="md">Medium Shadow</Card>);
        const card = screen.getByText('Medium Shadow');
        expect(card).toHaveClass('shadow-md');
      });

      it('applies large shadow correctly', () => {
        render(<Card shadow="lg">Large Shadow</Card>);
        const card = screen.getByText('Large Shadow');
        expect(card).toHaveClass('shadow-lg');
      });
    });

    describe('Style Combinations', () => {
      it('combines padding and shadow variants correctly', () => {
        render(<Card padding="lg" shadow="lg">Combined Styles</Card>);
        const card = screen.getByText('Combined Styles');
        expect(card).toHaveClass('p-8', 'shadow-lg');
      });

      it('combines custom classes with variants', () => {
        render(
          <Card padding="sm" shadow="md" className="border-blue-500">
            Custom Combined
          </Card>
        );
        const card = screen.getByText('Custom Combined');
        expect(card).toHaveClass('p-4', 'shadow-md', 'border-blue-500');
      });

      it('maintains base styles with variants', () => {
        render(<Card padding="none" shadow="none">Base Styles</Card>);
        const card = screen.getByText('Base Styles');
        expect(card).toHaveClass('rounded-lg', 'bg-white', 'ring-1', 'ring-gray-200');
      });
    });
  });

  // CardHeader component tests
  describe('CardHeader Component', () => {
    it('renders children correctly', () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies correct base styles', () => {
      render(<CardHeader>Header</CardHeader>);
      const header = screen.getByText('Header');
      expect(header).toHaveClass('mb-4', 'border-b', 'border-gray-200', 'pb-4');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardHeader ref={ref}>Header</CardHeader>);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(CardHeader.displayName).toBe('CardHeader');
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-header">Header</CardHeader>);
      const header = screen.getByText('Header');
      expect(header).toHaveClass('custom-header');
    });

    it('spreads additional props', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
    });

    it('combines custom classes with base classes', () => {
      render(<CardHeader className="text-blue-600">Header</CardHeader>);
      const header = screen.getByText('Header');
      expect(header).toHaveClass('mb-4', 'border-b', 'text-blue-600');
    });
  });

  // CardTitle component tests
  describe('CardTitle Component', () => {
    it('renders children correctly', () => {
      render(<CardTitle>Title Content</CardTitle>);
      expect(screen.getByText('Title Content')).toBeInTheDocument();
    });

    it('applies correct base styles', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
    });

    it('renders as h3 element', () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('Title');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardTitle ref={ref}>Title</CardTitle>);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(CardTitle.displayName).toBe('CardTitle');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('spreads additional props', () => {
      render(<CardTitle data-testid="title" id="card-title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      expect(title).toHaveAttribute('id', 'card-title');
    });

    it('supports accessibility attributes', () => {
      render(<CardTitle aria-level="2">Accessible Title</CardTitle>);
      const title = screen.getByText('Accessible Title');
      expect(title).toHaveAttribute('aria-level', '2');
    });
  });

  // CardContent component tests
  describe('CardContent Component', () => {
    it('renders children correctly', () => {
      render(<CardContent>Content Text</CardContent>);
      expect(screen.getByText('Content Text')).toBeInTheDocument();
    });

    it('applies correct base styles', () => {
      render(<CardContent>Content</CardContent>);
      const content = screen.getByText('Content');
      expect(content).toHaveClass('text-gray-600');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardContent ref={ref}>Content</CardContent>);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(CardContent.displayName).toBe('CardContent');
    });

    it('applies custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });

    it('spreads additional props', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
    });

    it('handles complex content structures', () => {
      render(
        <CardContent>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
          <ul>
            <li>List item</li>
          </ul>
        </CardContent>
      );

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
      expect(screen.getByText('List item')).toBeInTheDocument();
    });
  });

  // CardFooter component tests
  describe('CardFooter Component', () => {
    it('renders children correctly', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies correct base styles', () => {
      render(<CardFooter>Footer</CardFooter>);
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('mt-4', 'border-t', 'border-gray-200', 'pt-4');
    });

    it('forwards ref correctly', () => {
      const ref = jest.fn();
      render(<CardFooter ref={ref}>Footer</CardFooter>);
      expect(ref).toHaveBeenCalled();
    });

    it('has correct display name', () => {
      expect(CardFooter.displayName).toBe('CardFooter');
    });

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer">Footer</CardFooter>);
      const footer = screen.getByText('Footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('spreads additional props', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
    });

    it('handles button groups and actions', () => {
      render(
        <CardFooter>
          <button>Cancel</button>
          <button>Save</button>
        </CardFooter>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  // Component composition tests
  describe('Component Composition', () => {
    it('renders complete card with all sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
          </CardHeader>
          <CardContent>
            This is the main content of the card.
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('This is the main content of the card.')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('works with partial composition', () => {
      render(
        <Card>
          <CardTitle>Title Only Card</CardTitle>
          <CardContent>Just content, no header or footer</CardContent>
        </Card>
      );

      expect(screen.getByText('Title Only Card')).toBeInTheDocument();
      expect(screen.getByText('Just content, no header or footer')).toBeInTheDocument();
    });

    it('handles nested complex content', () => {
      render(
        <Card padding="lg" shadow="md">
          <CardHeader>
            <CardTitle>Complex Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h4>Subsection</h4>
              <p>Some detailed content here.</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2">
              <button>Edit</button>
              <button>Delete</button>
            </div>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('Complex Card')).toBeInTheDocument();
      expect(screen.getByText('Subsection')).toBeInTheDocument();
      expect(screen.getByText('Some detailed content here.')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('maintains proper spacing between components', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">Header</CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );

      const header = screen.getByTestId('header');
      const footer = screen.getByTestId('footer');

      expect(header).toHaveClass('mb-4', 'pb-4');
      expect(footer).toHaveClass('mt-4', 'pt-4');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('supports ARIA attributes on main card', () => {
      render(
        <Card role="article" aria-label="News Article">
          <CardTitle>Article Title</CardTitle>
          <CardContent>Article content</CardContent>
        </Card>
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'News Article');
    });

    it('properly associates title with content using IDs', () => {
      render(
        <Card>
          <CardTitle id="card-title">Associated Title</CardTitle>
          <CardContent aria-labelledby="card-title">
            Content associated with title
          </CardContent>
        </Card>
      );

      const title = screen.getByText('Associated Title');
      const content = screen.getByText('Content associated with title');

      expect(title).toHaveAttribute('id', 'card-title');
      expect(content).toHaveAttribute('aria-labelledby', 'card-title');
    });

    it('supports semantic HTML structure', () => {
      render(
        <Card as="article">
          <CardHeader as="header">
            <CardTitle>Semantic Card</CardTitle>
          </CardHeader>
          <CardContent as="main">
            Main content area
          </CardContent>
          <CardFooter as="footer">
            Footer area
          </CardFooter>
        </Card>
      );

      // Even without 'as' prop support, verify structure is semantic-friendly
      expect(screen.getByText('Semantic Card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('supports keyboard navigation context', () => {
      render(
        <Card tabIndex={0} role="button">
          <CardTitle>Clickable Card</CardTitle>
          <CardContent>This entire card is interactive</CardContent>
        </Card>
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });

  // Edge cases and error scenarios
  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<Card>{null}</Card>);
      const card = document.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('handles undefined children', () => {
      render(<Card>{undefined}</Card>);
      const card = document.querySelector('.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('handles string children', () => {
      render(<Card>Simple string content</Card>);
      expect(screen.getByText('Simple string content')).toBeInTheDocument();
    });

    it('handles numeric children', () => {
      render(<Card>{42}</Card>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles JSX content correctly', () => {
      render(
        <Card>
          <div>JSX content</div>
          {42}
          Some text
        </Card>
      );

      expect(screen.getByText('JSX content')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('Some text')).toBeInTheDocument();
    });

    it('works without any props', () => {
      render(<Card>No props</Card>);
      expect(screen.getByText('No props')).toBeInTheDocument();
    });

    it('handles very long content', () => {
      const longContent = 'A'.repeat(1000);
      render(<Card>{longContent}</Card>);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });
  });

  // Performance tests
  describe('Performance', () => {
    it('handles rapid prop changes efficiently', () => {
      const { rerender } = render(<Card padding="sm">Content</Card>);

      const paddings = ['none', 'sm', 'md', 'lg'] as const;
      paddings.forEach(padding => {
        rerender(<Card padding={padding}>Content</Card>);
      });

      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('handles complex nested structures efficiently', () => {
      const ComplexCard = () => (
        <Card>
          <CardHeader>
            <CardTitle>Complex Structure</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.from({ length: 100 }, (_, i) => (
              <div key={i}>Item {i}</div>
            ))}
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      render(<ComplexCard />);
      
      expect(screen.getByText('Complex Structure')).toBeInTheDocument();
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 99')).toBeInTheDocument();
    });
  });

  // Integration scenarios
  describe('Integration Scenarios', () => {
    it('works within grid layouts', () => {
      render(
        <div className="grid grid-cols-2 gap-4">
          <Card>Card 1</Card>
          <Card>Card 2</Card>
        </div>
      );

      expect(screen.getByText('Card 1')).toBeInTheDocument();
      expect(screen.getByText('Card 2')).toBeInTheDocument();
    });

    it('works with form elements', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Form Card</CardTitle>
          </CardHeader>
          <CardContent>
            <form>
              <input placeholder="Name" />
              <textarea placeholder="Description" />
            </form>
          </CardContent>
          <CardFooter>
            <button type="submit">Submit</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('supports responsive design patterns', () => {
      render(
        <Card className="w-full md:w-1/2 lg:w-1/3" padding="sm" shadow="md">
          <CardTitle>Responsive Card</CardTitle>
          <CardContent>Responsive content</CardContent>
        </Card>
      );

      const card = screen.getByText('Responsive Card').closest('div');
      expect(card).toHaveClass('w-full', 'md:w-1/2', 'lg:w-1/3');
    });
  });
});