# CFIPros Frontend - Claude Development Guide

## Project Overview
CFIPros Frontend is a Next.js 15 application for aviation training and certification services. Features secure file uploads, performance monitoring, and type-safe forms.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.1.0 with App Router
- **Language**: TypeScript 5.8.4 (strict mode)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library
- **Authentication**: Clerk (integrated)

### Key Features
- 🛡️ **Security**: File upload validation, rate limiting, security headers
- 📊 **Performance**: Web Vitals tracking, bundle analysis, memory monitoring
- 🏗️ **Modern Stack**: Server Components, type-safe APIs, error handling
- 🧪 **Testing**: 38.57% test coverage, TypeScript strict mode

## Project Structure

```
frontend/
├── app/                     # Next.js 15 App Router
│   ├── api/                 # API routes with security middleware
│   ├── globals.css          # Global styles
│   └── layout.tsx           # Root layout with performance monitoring
├── components/              # Reusable UI components
│   ├── forms/              # Form components with validation
│   └── ui/                 # Basic UI components
├── lib/                    # Core utilities and services
│   ├── api/                # API client, middleware, validation
│   ├── hooks/              # Custom React hooks
│   ├── security/           # Security modules (file upload, etc.)
│   ├── utils/              # Utility functions
│   └── validation/         # Zod schemas
├── __tests__/              # Test suites
└── public/                 # Static assets
```

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Type checking
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build

# Bundle analysis
npm run analyze
```

### Testing Strategy
- **Unit Tests**: Components, hooks, utilities
- **Integration Tests**: API routes, form validation
- **Security Tests**: File upload validation, rate limiting
- **Performance Tests**: Memory leak detection, Web Vitals

## Git Workflow Best Practices

### Daily Development
```bash
# Always push after completing features
git add .
git commit -m "feat: add new feature"
git push origin master
```

### Important Rules
- **Push Early, Push Often**: Always push to remote after big changes
- **Test Before Push**: Run `npm test` before pushing
- **Build Verification**: Run `npm run build` for major changes
- **Branch Strategy**: Use feature branches for experimental work

## Security Implementation

### File Upload Security
- **File Type Verification**: Checks magic bytes and MIME types
- **Content Scanning**: Detects dangerous patterns and scripts
- **Rate Limiting**: 10 uploads per hour per client
- **Safe Filenames**: Sanitizes names, prevents path traversal

### API Security
- **Security Headers**: CSP, XSS protection, content type validation
- **Rate Limiting**: Per-endpoint request limits
- **Input Validation**: Zod schemas for all requests
- **Error Handling**: Consistent error responses

## Performance Monitoring

### Web Vitals Tracking
- **Core Web Vitals**: CLS, FID, LCP monitoring
- **Memory Usage**: Leak detection and cleanup
- **Bundle Analysis**: Code splitting optimization
- **Performance Diagnostics**: Real-time overlay in development

### Implementation Details
- Performance tracker singleton with observer pattern
- React component for performance overlay
- Bundle analyzer integration for optimization insights
- Memory leak prevention in form hooks

## Key Development Patterns

### Error Handling
```typescript
// Use standardized error handling
import { CommonErrors, handleAPIError } from '@/lib/api/errors';

// In API routes
if (!validation.isValid) {
  return handleAPIError(CommonErrors.VALIDATION_ERROR(validation.error));
}
```

### Form Validation
```typescript
// Use typed form hooks with Zod
import { useForm } from '@/lib/hooks/useForm';
import { loginSchema } from '@/lib/validation/schemas';

const { register, handleSubmit, formState } = useForm({
  schema: loginSchema,
  onSubmit: async (data) => { /* handle submission */ }
});
```

### File Upload Security
```typescript
// Comprehensive security validation
import { FileUploadSecurity } from '@/lib/security/fileUpload';

const securityCheck = await FileUploadSecurity.validateFile(file);
if (!securityCheck.isSecure) {
  throw new Error(securityCheck.error);
}
```

## API Integration

### Backend Integration
- **Base URL**: Set via `BACKEND_API_URL` environment variable
- **Authentication**: Clerk token integration
- **Rate Limiting**: Per-endpoint limits configured
- **Proxy Pattern**: Frontend proxy for backend API calls

### Environment Variables
```bash
# Required
BACKEND_API_URL=https://api.cfipros.com/v1

# Optional
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=https://cfipros.com,https://www.cfipros.com
NODE_ENV=development
```

## Testing Guidelines

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- __tests__/lib/security/fileUpload.test.ts

# Run tests with coverage
npm test -- --coverage

# Watch mode for development
npm test -- --watch
```

### Test Coverage Goals
- **Target**: 80%+ coverage for all new code
- **Current**: 38.57% overall (strong foundation)
- **Priority**: Security modules, API routes, core utilities

## Troubleshooting

### Common Issues
```bash
# Build fails with type errors
npm run type-check

# Tests failing
npm test -- --verbose

# Development server issues
rm -rf .next && npm run dev

# Bundle size too large
npm run analyze
```

### Quick Fixes
- **Type errors**: Check imports and Zod schemas
- **Test failures**: Run individual test files to isolate issues
- **Performance issues**: Check Web Vitals in browser dev tools
- **Auth issues**: Verify Clerk configuration and API keys

## Known Issues & Technical Debt

### Current Issues
1. **Static Generation**: Some pages have event handlers in Server Components
2. **ESLint**: Temporarily disabled strict rules during development
3. **Type Coverage**: Some legacy `any` types in older files

### Next Steps
1. Re-enable ESLint configuration
2. Fix TypeScript strict mode issues
3. Increase test coverage to 80%+
4. Add E2E testing

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Bundle analysis reviewed (`npm run analyze`)
- [ ] Environment variables configured
- [ ] Security headers verified

### Production Configuration
- Set `NODE_ENV=production`
- Configure `BACKEND_API_URL` for production API
- Set up Redis for rate limiting (optional but recommended)
- Configure allowed origins for CORS

## Version History

### v1.0.0 (Current)
- ✅ Next.js 15 foundation with App Router
- ✅ Comprehensive file upload security
- ✅ Performance monitoring with Web Vitals
- ✅ 38.57% test coverage achieved
- ✅ Type-safe API layer with Zod validation
- ✅ Production-ready build system

### Future Roadmap
- **v1.0.1**: Fix static generation issues, improve test coverage
- **v1.1.0**: E2E testing suite, enhanced performance optimizations
- **v1.2.0**: PWA features, advanced caching strategies

## Development Notes for Claude

### Common Tasks
1. **Adding Components**: Follow patterns in `components/ui/`
2. **Creating API Routes**: Use middleware from `lib/api/middleware`
3. **Building Forms**: Use `lib/hooks/useForm` with Zod schemas
4. **Adding Security**: Extend `lib/security/` modules
5. **Writing Tests**: Mirror structure in `__tests__/`
6. **After Big Changes**: Always run tests and push to remote

### Code Style
- Use TypeScript strict mode
- Prefer functional components with hooks
- Follow Next.js 15 App Router patterns
- Implement comprehensive error handling
- Write tests for all new features

### Performance Considerations
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks
- Monitor bundle size with analyzer
- Track Web Vitals in development

### Security Best Practices
- Validate all inputs with Zod schemas
- Rate limit sensitive endpoints
- Use security headers and CSP
- Follow file upload security patterns
- Never commit secrets or API keys
- Push to remote after security updates

## Repository Information
- **Remote**: https://github.com/marcusgoll/CFIPros-frontend
- **Branch Strategy**: Main branch for production, feature branches for development
- **Commit Style**: Conventional commits with emoji prefixes
- **Release Process**: Semantic versioning with annotated tags

Last updated: 2025-08-23 (v1.0.0 release)