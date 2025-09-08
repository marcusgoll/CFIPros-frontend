# Project Structure & Standards

This document defines file placement, naming, and cleanup standards for production readiness.

## Directory Layout

- `app/`: Next.js App Router (routes, layouts, pages, api routes).
- `components/`: Reusable UI components (PascalCase file/folder names).
- `lib/`: Core logic: hooks, api clients, validation, security, services, utils, types.
- `public/`: Static assets (images, fonts, videos); web-accessible only.
- `__tests__/`: Jest test suites and helpers (or colocated `*.test.ts(x)`).
- `scripts/`: Maintenance utilities and developer tooling.
- `docs/`: Architecture notes, ADRs, standards.

## Hooks

- Location: `lib/hooks/` only.
- Imports: `@/hooks/<name>` (alias maps to `lib/hooks`).
- No top-level `hooks/` directory.

## Naming

- Components: PascalCase (`FeatureSpotlightMenu.tsx`).
- Hooks/utilities: camelCase (`useDebounce.ts`).
- Route segments follow Next.js conventions (`page.tsx`, `layout.tsx`).

## Testing

- Prefer user-centric tests; avoid implementation details.
- Accessibility checks via `jest-axe` when relevant.
- Coverage goal: maintain or improve current project baseline.

## Cleanup Rules

- Do not commit artifacts/caches: `.next/`, `.swc/`, `coverage*/`, `.jest-cache/`.
- Do not commit ad-hoc logs: `*results.log`, `*validation.log`, `test-*.log`.
- No temp/backup files: `*.bak`, `*.backup`.
- Use `scripts/cleanup-repo.sh` before opening PRs.

### Review Folder Policy

- When unsure about deleting a file, move it to a local `review/` folder that is git-ignored.
- Record the move in `docs/REORGANIZATION_LOG.md` with date, path, and rationale.
- Seek confirmation before permanent deletion of any code/data files.

## Environment & Secrets

- Only commit `.env.example` templates.
- Never commit `.env*` files with secrets.

## PR Readiness

- `npm run lint:fix`, `npm run type-check`, `npm run test`.
- Confirm `npm run build` passes and bundle size is reasonable (`npm run analyze`).
