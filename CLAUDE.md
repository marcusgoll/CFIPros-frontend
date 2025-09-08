Project Structure, Cleanup Rules, and Production Readiness

This repository follows a Next.js App Router layout with strict TypeScript and Jest. Use this document as the single source of truth for file placement, cleanup practices, and production-readiness checks.

Directory Layout (authoritative)
- `app/` — Next.js routes, segments, layouts, pages, server routes.
- `components/` — Reusable UI components (PascalCase files/folders). Group by domain when helpful (e.g., `components/acs`, `components/layout`).
- `lib/` — Core logic: hooks, services, utilities, validation, security, types, config, SEO.
- `public/` — Static, web‑served assets only (images, fonts, icons). No code.
- `__tests__/` — Jest test suites and helpers. Colocation as `*.test.ts(x)` is also allowed.
- `scripts/` — Maintenance/dev tooling. Nothing in here ships to production.
- `docs/` — Architecture notes, ADRs, release/phase docs, internal guides.

Paths & Imports
- Use the `@/` alias for root‑relative imports. Example: `import { fetchResults } from "@/lib/api/client"`.
- Hooks import alias: `@/hooks/*` maps to `lib/hooks/*`.

Naming Conventions
- Components: PascalCase (e.g., `FeatureSpotlightMenu.tsx`).
- Hooks/utilities/services: camelCase (e.g., `useDebounce.ts`, `analysisService.ts`).
- Route files follow Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`).

Placement Standards
- Hooks live only in `lib/hooks/`.
- UI primitives live in `components/ui/`; domain groupings live under `components/<domain>/`.
- Do not create top‑level `hooks/`, `utils/`, or `services/` folders outside `lib/`.
- Public assets (images, fonts) belong in `public/` and must not import code.
- Internal docs (release notes, integration summaries) belong in `docs/` (moved from root).

Cleanup Rules (pre‑PR and pre‑release)
- Remove build/test artifacts: `.next/`, `.swc/`, `coverage*/`, `.jest-cache/`, `*.log`.
- Remove temp/backup files: `*.bak`, `*.backup`, editor swap files.
- Keep only canonical configs at root: `package.json`, `tsconfig.json`, `jest.config.js`, `postcss.config.mjs`, `tailwind.config.ts`, `next.config.ts`, repo policies (`README.md`, `LICENSE`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `AGENTS.md`, this `CLAUDE.md`). All other docs -> `docs/`.
- Scripts that are debugging/experimental stay inside `scripts/` and are not bundled.

Production Readiness Checklist
- Lint/types/tests: `npm run lint:fix`, `npm run type-check`, `npm run test` (or `test:coverage`).
- Build: `npm run build`. Serve: `npm start`. Bundle analysis: `npm run analyze`.
- Env: Keep `.env.example` up to date. Never commit `.env*` files with secrets.
- Middleware/headers: Coordinate changes in `middleware.ts` with security/auth owners.

Testing Standards
- Frameworks: Jest + React Testing Library (jsdom). Prefer user‑centric tests; avoid implementation details.
- Place tests under `__tests__/` or as `*.test.ts(x)` beside source. Use `@/` alias in tests.
- Accessibility: Use `jest-axe` where relevant.

Known Duplications and Consolidation Policy
- Error Boundaries: Two implementations exist today: `components/ErrorBoundary.tsx` and `components/common/ErrorBoundary.tsx` (referenced by PricingSection and tests). Do not delete either until a consolidation PR updates imports and merges feature differences (e.g., `FeatureTableErrorFallback`, `UploadErrorBoundary`). Prefer standardizing on a single export under `components/common/` with a follow‑up refactor.

New Files: Where to Put Them
- New route/UI: `app/` for routes; presentational pieces in `components/`.
- New hook: `lib/hooks/<name>.ts`.
- New service/business logic: `lib/services/<name>.ts`.
- New config/enums/constants: `lib/config/` or `lib/constants.ts` (if shared).
- New utility: `lib/utils/<name>.ts`.
- New types: `lib/types/`.
- New docs: `docs/`.
- New maintenance/dev scripts: `scripts/`.

Process Notes
- Keep changes minimal and focused; avoid unrelated refactors in the same PR.
- Update this file and `docs/STRUCTURE_AND_STANDARDS.md` when adjusting structure policy.

References
- See `docs/STRUCTURE_AND_STANDARDS.md` for deeper guidance and PR checks.

Review Folder Policy and Safeguards
- Destructive changes require explicit confirmation. When uncertain, do not delete — move to a local, git‑ignored `review/` folder instead.
- The `review/` folder is for temporary quarantine of files pending human review. Add brief notes in `docs/REORGANIZATION_LOG.md` when quarantining.
- Never place executable secrets or production keys in `review/`. It is local only; keep it out of version control.

Systematic Execution Steps (for structural changes)
- Scan and categorize: inventory files by type/purpose; identify duplicates and misplaced items.
- Dependency analysis: use ripgrep to find imports/usages before any move or deletion (e.g., `rg -n "components/common/ErrorBoundary"`).
- Plan: write a short, verifiable plan of moves (source → destination) and expected config/test updates.
- Execute: move files; update imports and configuration (`tsconfig.json` paths, Jest `moduleNameMapper`, barrel files).
- Validate: `npm run type-check`, `npm run test`, `npm run build` and a quick local smoke test.
- Document: append a dated entry to `docs/REORGANIZATION_LOG.md` summarizing moves/deletions and rationale.

Deletion and Data Handling
- Never delete files that might contain important code or data without approval. Prefer moving to `review/` first.
- Build artifacts, caches, and logs are safe to delete: `.next/`, `.swc/`, `coverage*/`, `.jest-cache/`, `*.log`.
