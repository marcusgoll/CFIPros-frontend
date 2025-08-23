# Tech Stack Standards

Standardized technology choices for CFI Pros API projects. These decisions promote consistency, maintainability, and team efficiency.

## Core Technologies

### Backend
- **Runtime**: Node.js 22 LTS
- **Framework**: Express.js or Fastify (depending on performance needs)
- **Language**: JavaScript (ES2022+) or TypeScript for complex projects
- **Package Manager**: npm or pnpm
- **Process Manager**: PM2 for production

### Database
- **Primary Database**: PostgreSQL 15+
- **ORM/Query Builder**: Prisma or Drizzle ORM
- **Migrations**: Database-first with version control
- **Connection Pooling**: Built-in or pgBouncer for high load

### Frontend (if applicable)
- **Framework**: React 18+ or Next.js 14+
- **Build Tool**: Vite or Next.js built-in
- **CSS**: TailwindCSS 3.4+
- **Icons**: Lucide React or Heroicons

## Development Tools

### Code Quality
- **Linting**: ESLint with standard config
- **Formatting**: Prettier with 2-space indentation
- **Type Checking**: TypeScript (when used)
- **Pre-commit**: Husky + lint-staged

### Testing
- **Unit Testing**: Jest or Vitest
- **Integration Testing**: Supertest for APIs
- **E2E Testing**: Playwright (when needed)
- **Test Coverage**: Built-in coverage tools

### Documentation
- **API Documentation**: OpenAPI/Swagger
- **Code Documentation**: JSDoc for public APIs
- **README**: Comprehensive setup and usage guide

## Infrastructure

### Hosting & Deployment
- **Application Hosting**: Railway, Heroku, or DigitalOcean App Platform
- **Database Hosting**: Managed PostgreSQL (DigitalOcean, AWS RDS, or similar)
- **File Storage**: AWS S3 or DigitalOcean Spaces
- **CDN**: CloudFront or DigitalOcean CDN

### CI/CD
- **Platform**: GitHub Actions
- **Triggers**: Pull requests and pushes to main/staging
- **Pipeline**: Lint → Test → Build → Deploy
- **Environments**: staging (develop branch) → production (main branch)

### Monitoring & Logging
- **Application Monitoring**: Built-in metrics or simple APM
- **Error Tracking**: Sentry or similar service
- **Logging**: Structured JSON logs with Winston or Pino
- **Health Checks**: Basic HTTP endpoints

## Security

### Authentication & Authorization
- **Authentication**: JWT tokens or session-based
- **Password Hashing**: bcrypt or argon2
- **Rate Limiting**: express-rate-limit or similar
- **CORS**: Properly configured for production

### Data Protection
- **Environment Variables**: .env files (never committed)
- **Secrets Management**: Platform-provided or HashiCorp Vault
- **SSL/TLS**: Always enabled in production
- **Input Validation**: Joi, Zod, or similar validation library

## Configuration Guidelines

### Environment Configuration
```javascript
// config/index.js
module.exports = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL,
    pool: {
      min: 2,
      max: 10
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  }
};
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  }
}
```

## Decision Criteria

When evaluating new technologies:
1. **Maintenance**: Active development and community
2. **Documentation**: Clear, comprehensive documentation
3. **Performance**: Meets current and projected needs
4. **Security**: Regular updates and security patches
5. **Team Knowledge**: Learning curve and available expertise
6. **Ecosystem**: Compatible with existing tools

## Migration Strategy

When adopting new technologies:
1. Start with non-critical components
2. Run parallel implementations during transition
3. Measure performance and reliability
4. Train team members on new tools
5. Document migration process and lessons learned