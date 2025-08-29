# Contributing to CFIPros Frontend

Welcome to the CFIPros community! We're excited that you want to contribute to making aviation training better for everyone. ✈️

## 🌟 Ways to Contribute

### 🐛 Bug Reports
Found something that doesn't work as expected? Help us fix it!

**Before reporting:**
- Check if the issue already exists in [GitHub Issues](https://github.com/marcusgoll/CFIPros-frontend/issues)
- Try to reproduce the issue with the latest version
- Test in different browsers if it's a UI issue

### 💡 Feature Requests
Have ideas for improving aviation training workflows? We'd love to hear them!

**Great feature requests include:**
- Clear description of the problem you're solving
- Specific use cases from aviation training
- Mockups or wireframes (if applicable)
- Consideration of how it fits with existing features

### 🔧 Code Contributions
Whether you're fixing bugs or building new features, every contribution helps!

**What we especially need help with:**
- Increasing test coverage (currently 38.57%)
- Accessibility improvements
- Performance optimizations  
- Aviation-specific UI components
- Mobile responsiveness enhancements
- Security enhancements

## 🚀 Development Setup

### Prerequisites
- **Node.js 18+** (we recommend using the latest LTS)
- **npm 9+** (comes with Node.js)
- **Git** for version control

### Local Development

1. **Fork and Clone**
   ```bash
   # Fork the repo on GitHub, then:
   git clone https://github.com/YOUR-USERNAME/CFIPros-frontend.git
   cd CFIPros-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit .env.local with your settings
   # You'll need to set up your own backend API or use mock data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Integration

This frontend requires a backend API. You have several options:

1. **Mock Development**: Use the existing API route patterns with mock data
2. **Own Backend**: Build your own following the API patterns in `app/api/`
3. **CFIPros API**: Contact us at [hello@cfipros.com](mailto:hello@cfipros.com) for API access

## 🧪 Testing

We take testing seriously. All contributions should include appropriate tests.

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch          # Watch mode for development
npm run test:coverage       # Generate coverage report
npm run test:security       # Run security-specific tests
```

### Writing Tests
- **Unit Tests**: For individual components and utilities
- **Integration Tests**: For component interactions and API routes
- **Security Tests**: For file upload validation and security features

Example test structure:
```typescript
// __tests__/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## 📝 Code Standards

### TypeScript
- Use strict TypeScript configuration
- Prefer `interface` over `type` for object shapes
- Use Zod schemas for runtime validation
- Avoid `any` types - use proper typing or `unknown`

### React/Next.js
- Use functional components with hooks
- Prefer Server Components when possible (Next.js App Router)
- Use proper error boundaries
- Implement loading and error states

### Styling
- Use Tailwind CSS classes
- Follow existing design patterns
- Ensure mobile responsiveness
- Test accessibility (use screen readers, keyboard navigation)

### Code Formatting
We use automated formatting tools:
```bash
npm run lint                # ESLint checks
npm run lint:fix           # Auto-fix linting issues
npm run type-check         # TypeScript validation
```

## 📋 Pull Request Process

### Before Submitting
1. **Test Everything**
   ```bash
   npm test                 # All tests pass
   npm run build           # Build succeeds
   npm run type-check      # No TypeScript errors
   npm run lint            # No linting errors
   ```

2. **Update Documentation**
   - Update README if you changed core functionality
   - Add JSDoc comments for new functions
   - Update type definitions if needed

3. **Follow Commit Convention**
   We use [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add new aviation-specific component
   fix: resolve mobile navigation issue
   docs: update contributing guidelines
   test: add tests for file upload security
   refactor: improve performance monitoring
   ```

### PR Template
When you create a pull request, please include:

```markdown
## What does this PR do?
Brief description of the changes

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Aviation Context
How does this change improve the aviation training experience?

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested this change on mobile devices

## Screenshots (if applicable)
Include screenshots for UI changes

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

### Review Process
1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Manual testing for UI/UX changes
4. **Aviation Review**: Aviation-specific changes reviewed by CFI team

## 🎯 Aviation-Specific Guidelines

### Understanding Our Users
CFIPros serves flight instructors and students who:
- Study complex aviation regulations and procedures
- Need mobile access for studying during travel
- Work with large PDF documents and training materials
- Require efficient search and organization tools

### UI/UX Considerations
- **Mobile-First**: Many users study on phones/tablets
- **Accessibility**: Support for various vision abilities
- **Performance**: Fast loading for large training documents  
- **Offline**: Consider offline functionality where possible

### Aviation Terminology
- Use proper aviation terminology (ACS, PTS, CFI, DPE, etc.)
- Follow FAA standards for abbreviations and formatting
- Consider international users (ICAO standards)

## 🤝 Community Guidelines

### Be Respectful
- Treat all contributors with respect and professionalism
- Welcome newcomers and help them get started
- Provide constructive feedback on code and ideas
- Remember we're all working toward safer aviation

### Communication
- Use clear, professional language in issues and PRs
- Ask questions if something isn't clear
- Share knowledge and help others learn
- Keep discussions on-topic and productive

## 🏷️ Issue Labels

We use labels to organize and prioritize work:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `good-first-issue` - Good for newcomers
- `help-wanted` - Extra attention needed
- `aviation` - Aviation-specific functionality
- `security` - Security-related issues
- `performance` - Performance improvements
- `accessibility` - Accessibility improvements

## 📞 Getting Help

### Development Questions
- Create a [GitHub Discussion](https://github.com/marcusgoll/CFIPros-frontend/discussions)
- Join our community channels (links in README)
- Review existing issues and PRs for examples

### Aviation Questions
- Contact our CFI team at [hello@cfipros.com](mailto:hello@cfipros.com)
- Reference FAA publications and ACS standards
- Consider real-world training scenarios

## 🎉 Recognition

Contributors are recognized in several ways:
- Listed in our `CONTRIBUTORS.md` file
- Mentioned in release notes for significant contributions
- Featured on our website (with permission)
- Invited to join our contributor Discord community

## 📚 Resources

### CFIPros Resources
- [CFIPros Website](https://cfipros.com)
- [CFIPros Blog](https://cfipros.com/blog) - Aviation training insights
- [API Documentation](https://docs.cfipros.com/api)

### Development Resources
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Aviation Resources
- [FAA ACS Standards](https://www.faa.gov/training_testing/testing/acs/)
- [CFI Resources](https://www.faa.gov/pilots/training/cfi/)
- [Aviation Regulations](https://www.ecfr.gov/current/title-14)

---

Thank you for contributing to CFIPros! Together, we're making aviation training more accessible, efficient, and effective for flight instructors and students worldwide. 🛩️

**Questions?** Reach out to us at [hello@cfipros.com](mailto:hello@cfipros.com) or create a [GitHub Discussion](https://github.com/marcusgoll/CFIPros-frontend/discussions).