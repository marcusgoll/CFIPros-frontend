# PRD — CFIPros Frontend (Next.js 15 on Vercel)

Public SEO ACS pages + auth-gated lessons + Stripe subscription skeleton + BFF to FastAPI (`https://api.cfipros.com`)

## 1) Summary

Build a production Next.js 15 (App Router) site on Vercel that:

* Exposes **public, indexable ACS code pages** to capture search traffic.
* Keeps **full lessons, study plans, and uploads behind auth**.
* Uses a **BFF (backend-for-frontend) layer** via Route Handlers that proxy to `https://api.cfipros.com` to avoid CORS and protect secrets.
* Ships a **Stripe subscription skeleton** (free for now) that can be flipped on later.

**Success metrics (MVP):**

* SEO: ≥200 ACS code pages discoverable/crawlable; impressions within 14 days; CTR ≥2% on top codes.
* UX: time-to-first-byte (TTFB) ≤200ms on cached ACS pages; a11y ≥95 Lighthouse on key pages.
* Stability: error rate <1% on BFF endpoints; 0 secrets leaked client-side.

## 2) Users & Top Jobs

* **Student pilots**: look up an ACS code → understand scope/pitfalls → sign up to view lesson.
* **CFIs/schools**: evaluate content quality → consider white-label later.

## 3) In-Scope (MVP)

**Public routes (indexable):**

* `/` Home
* `/acs` ACS index (search/filter)
* `/acs/[code]` ACS detail (canonical SEO page)

**Auth-gated (noindex):**

* `/(authed)/dashboard`
* `/(authed)/lesson/[slug]` (MDX reader)
* `/(authed)/upload` → extract → `/(authed)/study-plan/[id]`
* `/(authed)/settings`

**BFF Route Handlers:**

* `/api/acs` (list/search), `/api/acs/[code]` (detail)
* `/api/reports`, `/api/reports/[id]`, `/api/upload`, `/api/study-plans/[id]`
* `/api/stripe/create-checkout-session`, `/api/stripe/create-portal-session`, `/api/stripe/webhook`

**Stripe skeleton:** free plan now; paid plans wired but hidden.

## 4) Out-of-Scope (MVP)

* White-label theming controls
* Offline/PWA
* Full payments go-live (we only scaffold)

## 5) Information Architecture & URL Strategy

* **Canonical pattern:** `/acs/[code]` (e.g., `/acs/PA.I.B.K1`)
* **Index page:** `/acs` with server-rendered list + client search UI
* **Lessons remain behind `/(authed)`**; link teasers on ACS pages CTA to login.

## 6) SEO Requirements

* **Rendering:** RSC/SSR pages with `generateMetadata()`; use **ISR**: pre-generate top codes at build, others `revalidate: 86400`.
* **Canonical & robots:** canonical per code; `robots.ts` allows `/acs*`, disallows `/(authed)/*`.
* **Structured data:** JSON-LD `CreativeWork/LearningResource` with `name`, `identifier` (code), `about` (area/task), `isPartOf`.
* **OpenGraph/Twitter:** per-code OG title/desc; fallback image by area.
* **Sitemap:** `sitemap.ts` with `/`, `/acs`, and batched `/acs/[code]`.

## 7) UX Requirements (MVP)

* **ACS index:** search box, filters (Area/Task/Element), paginated list; row shows `{code, title}` + “View code” and “See lesson (login)”.
* **ACS detail:** H1 “ACS {code}”, official title, 1–2 paragraph summary, **Common pitfalls** (3–5 bullets), related codes. CTA → auth.
* **Uploader:** drag-drop, file validation, progress; job status (poll or SSE) with retry button.
* **Lesson reader:** MDX, readable typography, progress ring; deep links from study plans.

## 8) Technical Architecture

**Next.js 15 (App Router) on Vercel**

* Default **RSC**; client components for uploader/search only.
* **BFF via Route Handlers** proxies to `https://api.cfipros.com` (adds auth headers, normalizes Problem Details).
* **Caching:**

  * Lessons & ACS detail: ISR (`revalidate: 3600–86400`)
  * User data, uploads, reports: `cache: 'no-store'`
* **Runtime:** Edge for simple GETs (e.g., ACS list/detail) where feasible; Node runtime for upload/Stripe/webhooks.

**Auth (pluggable):** Clerk or NextAuth; `middleware.ts` protects `/(authed)/*`.
**Subscription gate:** `hasActiveSubscription(user)` returns `true` (free phase) but is wired to Stripe events for later.

**Directory layout (key files):**

```
/app
  page.tsx
  /acs/page.tsx
  /acs/[code]/page.tsx
  /(authed)/lesson/[slug]/page.tsx
  /(authed)/upload/page.tsx
  /(authed)/study-plan/[id]/page.tsx
  /api/acs/route.ts
  /api/acs/[code]/route.ts
  /api/stripe/create-portal-session/route.ts
  /api/stripe/create-checkout-session/route.ts
  /api/stripe/webhook/route.ts
  /robots.ts
  /sitemap.ts
/components/acs/*
/content/lessons/*.mdx
/lib/bff.ts  /lib/seo.ts  /lib/subscription.ts  /lib/auth.ts
/middleware.ts
```

## 9) Data Contracts (BFF ↔ FastAPI)

* **GET** `/acs?search=&area=&task=&page=` → `{ items:[{code,title,area,task,element?}], page, total }`
* **GET** `/acs/{code}` → `{ code, title, area, task, element?, official_text?, summary? }`
* **Reports** (auth required): create/list/get (upload via streaming), study-plans get.
* **Errors:** **Problem Details** `{ type, title, detail, status, code }`—UI shows friendly message + retry.

## 10) Stripe Subscription Skeleton

* **Plans (Stripe Dashboard):** `free` (default), `pro-monthly`, `pro-annual` (hidden for now).
* **Env:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_PRO_*`.
* **Routes:**

  * `POST /api/stripe/create-checkout-session` → currently returns `{ disabled: true }`.
  * `POST /api/stripe/create-portal-session` → returns a safe placeholder URL.
  * `POST /api/stripe/webhook` → 200 OK; later: verify & upsert `subscription_status`.
* **State storage (later on):** `stripe_customer_id`, `subscription_status` stored in API user profile.

## 11) Non-Functional Requirements

**Performance**

* TTFB ≤200ms cached ACS pages; LCP ≤2.5s on 4G; Next Image; avoid client waterfalls.
* Keyset pagination for large ACS lists (API).

**Security**

* Secrets in Vercel env only; strict CSP/HSTS; SameSite cookies; CSRF for cookie-based sessions.
* Zod/Pydantic validation at boundaries; dependency/container scans in CI; secret scans pre-commit & CI.

**Accessibility**

* WCAG 2.1 AA: keyboard nav, focus management, color contrast; axe CI on Home/ACS/lesson.

**Observability**

* Add `x-request-id` in BFF; OpenTelemetry traces for BFF calls; Vercel logs/Analytics; dashboards for latency/error rate.

## 12) Environments & Config

* **Vercel envs:**
  `API_BASE=https://api.cfipros.com`
  `NEXT_PUBLIC_APP_URL=https://cfipros.com`
  Stripe keys (skeleton), auth provider keys
* **robots/sitemap:** ship with MVP and verify in Search Console.

## 13) Acceptance Criteria (MVP)

1. `/acs` renders with server data; search & filters functional; OG tags correct.
2. `/acs/[code]` includes canonical, JSON-LD, passes Lighthouse SEO ≥90/a11y ≥95; served via ISR.
3. `/(authed)/lesson/[slug]` redirects unauthenticated users to `/login`; authenticated users can view lesson MDX.
4. Upload → extract → study plan shows at least 3 actionable sections; error paths show friendly toasts and request ID.
5. BFF never exposes `API_BASE` secrets client-side; all API calls route through BFF.
6. Stripe skeleton routes respond without errors; webhook returns 200.

## 14) Milestones

* **M1 (Day-1 deploy):** Shell pages, BFF scaffolds, robots/sitemap, ACS list/detail wired, lessons gated, Stripe skeleton reachable.
* **M2:** ISR pregen for top 200 codes, improved ACS content, analytics dashboards, basic a11y tests.
* **M3:** Uploader + study plan end-to-end via API, error boundaries, request IDs, Search Console green.

## 15) Risks & Mitigations

* **SEO cannibalization** (duplicate titles). *Mitigate:* strict canonical + unique per-code metadata.
* **Leak of gated content** via indexable routes. *Mitigate:* `/(authed)` behind middleware + `noindex`.
* **CORS/headers drift** between BFF and API. *Mitigate:* contract tests in CI + Problem Details normalization.

## 16) Deliverables

* Vercel-ready Next.js repo with routes/components above.
* CI: lint, types, tests, a11y smoke, Trivy image scan (reuse existing CI patterns).
* PR template & ADR for SEO page strategy and BFF error model.

---


