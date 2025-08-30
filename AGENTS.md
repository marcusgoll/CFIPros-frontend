# Repository Guidelines

## Project Structure & Module Organization
- app/: Next.js App Router (route segments, page.tsx, layout.tsx).
- components/: Reusable UI in PascalCase folders/files.
- lib/: Utilities, hooks, and services.
- public/: Static assets (images, fonts).
- __tests__/ and tests/: Jest test suites and helpers.
- content/ and scripts/: Project content and maintenance scripts.
- Import alias: use `@/` for root-relative imports (see tsconfig paths).
 - Example: `import { fetchResults } from '@/lib/api/client';`

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server.
- `npm run build`: Production build (Next.js 15).
- `npm start`: Serve the production build.
- `npm run test` | `test:watch` | `test:coverage`: Run Jest, watch, or collect coverage.
- `npm run lint` | `lint:fix`: Lint code, optionally auto-fix.
- `npm run type-check`: TypeScript check without emit.
- `npm run format` | `format:check`: Prettier write or verify formatting.
- `npm run analyze`: Build with bundle analyzer enabled.
- `npm run analyze:server` / `analyze:browser`: Analyze server or client bundles only.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Node >= 18.
- Formatting (Prettier): 2 spaces, semicolons, trailingComma=es5, printWidth=80, double quotes; Tailwind classes sorted via prettier-plugin-tailwindcss.
- ESLint: prefer-const, no-var, eqeqeq, curly; console warns. Run `lint:fix` before PRs.
- Naming: Components PascalCase; hooks/utilities camelCase; route folders/files follow Next.js conventions.

## Testing Guidelines
- Frameworks: Jest + React Testing Library (jsdom). Setup in `jest.config.js` and `jest.setup.js`.
- Locations: Place tests in `__tests__/` or beside source as `*.test.ts(x)`.
- Coverage: Use `npm run test:coverage`; keep/improve current coverage. Test critical paths and utilities in `lib/`.
- Patterns: Prefer user-centric tests; avoid implementation details; use `@/` alias in imports.
- Accessibility: Use `jest-axe` for a11y checks where relevant.

## Commit & Pull Request Guidelines
- Commits: Imperative, concise. Use Conventional Commits with optional emojis as in history. Examples: `feat: add ACS search filters`; `fix(upload): handle empty files`; `chore(deps): bump jest`; `🎨 style: replace hardcoded colors with tokens`.
- PRs: Include summary, linked issues, screenshots for UI, and test notes. Ensure `lint`, `type-check`, and `test` pass. Update docs (README/CHANGELOG) when relevant.

## Security & Configuration
- Environment: Copy `.env.example` to `.env.local`; never commit secrets. Primary auth: Clerk (see `app/layout.tsx`). NextAuth appears in tests/legacy paths—configure only if you use those.
- Headers/middleware: Changes in `middleware.ts` affect auth and security—coordinate in reviews.
