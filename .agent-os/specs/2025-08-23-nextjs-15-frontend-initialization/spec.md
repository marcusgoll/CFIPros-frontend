# CFIPros Next.js 15 Frontend - Technical Specification

## 1. Overview & Purpose

Initialize a production-ready Next.js 15 frontend for the CFIPros platform that serves as the user interface for the ACS Code extraction and study plan generation service. This frontend will proxy API requests to the FastAPI backend while providing SEO-optimized public pages and authenticated premium features.

**Project Goals:**
- Provide intuitive file upload and result viewing experience
- Support anonymous usage with seamless conversion to registered users
- Enable premium subscription features via Stripe integration
- Generate organic traffic through SEO-optimized public ACS code pages

## 2. Architecture Overview

### Application Structure
- **Next.js 15** with App Router for optimal performance and developer experience
- **TypeScript** for type safety and better developer experience
- **Tailwind CSS** for consistent, utility-first styling
- **BFF (Backend for Frontend) Pattern** via API routes proxying to api.cfipros.com/v1

### Core User Flows
1. **Anonymous Flow**: Upload → Process → View Results → Email Capture → Register
2. **Authenticated Flow**: Upload → Process → Save Results → View History → Manage Subscription
3. **SEO Flow**: ACS Code Pages → Study Resources → Lead Capture → Convert to User

## 3. Tech Stack & Dependencies

### Core Framework
- **Next.js**: 15.1.0 (Latest stable with App Router)
- **React**: 19.x (React Server Components support)
- **TypeScript**: 5.8.x (Latest stable)
- **Node.js**: 22 LTS (Runtime)

### Styling & UI
- **Tailwind CSS**: 3.4.x (Latest stable)
- **@tailwindcss/typography**: For rich text content
- **@tailwindcss/forms**: For enhanced form styling
- **Lucide React**: For consistent iconography
- **@headlessui/react**: For accessible UI components

### Data Fetching & State
- **SWR**: For client-side data fetching and caching
- **@tanstack/react-query**: For server state management (alternative to SWR)
- **Zustand**: For client-side state management

### Authentication & Payments
- **NextAuth.js**: For authentication management
- **@stripe/stripe-js**: For payment processing
- **@stripe/react-stripe-js**: For React Stripe components

### Development & Quality
- **ESLint**: Code linting with Next.js config
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **lint-staged**: Pre-commit linting
- **@types/node**: Node.js type definitions

### Backend Integration
- **@cfipros/client**: JavaScript SDK for API communication
- **httpx**: HTTP client for BFF endpoints

## 4. Project Initialization

### Step 1: Initialize Next.js Project

```bash
npx create-next-app@latest cfipros-frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

### Step 2: Install Dependencies

```json
{
  "name": "cfipros-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@next/third-parties": "^15.1.0",
    "@headlessui/react": "^2.2.0",
    "@heroicons/react": "^2.2.0",
    "lucide-react": "^0.468.0",
    "swr": "^2.3.0",
    "@tanstack/react-query": "^5.61.3",
    "zustand": "^5.0.2",
    "next-auth": "5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.4",
    "@stripe/stripe-js": "^5.3.0",
    "@stripe/react-stripe-js": "^3.1.0",
    "zod": "^3.24.1",
    "react-hook-form": "^7.54.0",
    "@hookform/resolvers": "^3.10.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "date-fns": "^4.1.0",
    "uuid": "^11.0.3"
  },
  "devDependencies": {
    "typescript": "5.8.4",
    "@types/node": "22.10.2",
    "@types/react": "19.0.2",
    "@types/react-dom": "19.0.2",
    "@types/uuid": "^10.0.0",
    "eslint": "9.16.0",
    "eslint-config-next": "15.1.0",
    "@typescript-eslint/eslint-plugin": "^8.18.1",
    "@typescript-eslint/parser": "^8.18.1",
    "prettier": "^3.4.2",
    "prettier-plugin-tailwindcss": "^0.6.9",
    "tailwindcss": "3.4.17",
    "postcss": "8.5.4",
    "autoprefixer": "^10.4.20",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15",
    "husky": "^9.1.7",
    "lint-staged": "^15.2.10"
  }
}
```

### Step 3: Configuration Files

#### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### Tailwind Configuration (`tailwind.config.ts`)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
```

#### Next.js Configuration (`next.config.ts`)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@headlessui/react"],
  },
  images: {
    domains: ["cfipros.com", "api.cfipros.com"],
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.cfipros.com/v1",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_BASE_URL || "https://api.cfipros.com/v1"}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### ESLint Configuration (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### Prettier Configuration (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "tabWidth": 2,
  "useTabs": false,
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

## 5. Project Structure

```
cfipros-frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│       ├── hero-background.jpg
│       └── acs-codes/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Landing page
│   │   ├── loading.tsx             # Global loading UI
│   │   ├── error.tsx               # Global error UI
│   │   ├── not-found.tsx           # 404 page
│   │   │
│   │   ├── (public)/               # Public routes (no auth required)
│   │   │   ├── upload/
│   │   │   │   └── page.tsx        # File upload interface
│   │   │   ├── results/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Public results view
│   │   │   ├── acs-codes/
│   │   │   │   ├── page.tsx        # ACS codes index (SEO)
│   │   │   │   └── [code]/
│   │   │   │       └── page.tsx    # Individual ACS code page
│   │   │   ├── study-plans/
│   │   │   │   └── page.tsx        # Public study plans
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx        # Pricing page
│   │   │   ├── about/
│   │   │   │   └── page.tsx        # About page
│   │   │   └── contact/
│   │   │       └── page.tsx        # Contact page
│   │   │
│   │   ├── (auth)/                 # Authentication routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Login page
│   │   │   ├── register/
│   │   │   │   └── page.tsx        # Registration page
│   │   │   └── verify-email/
│   │   │       └── page.tsx        # Email verification
│   │   │
│   │   ├── (dashboard)/            # Protected routes
│   │   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Dashboard home
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx        # Reports list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Report details
│   │   │   ├── study-plans/
│   │   │   │   ├── page.tsx        # Study plans list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx    # Study plan details
│   │   │   ├── subscription/
│   │   │   │   └── page.tsx        # Subscription management
│   │   │   └── settings/
│   │   │       └── page.tsx        # User settings
│   │   │
│   │   └── api/                    # API routes (BFF)
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # NextAuth configuration
│   │       ├── stripe/
│   │       │   ├── webhook/
│   │       │   │   └── route.ts    # Stripe webhook handler
│   │       │   └── create-checkout/
│   │       │       └── route.ts    # Checkout session creation
│   │       └── proxy/
│   │           └── [...path]/
│   │               └── route.ts    # API proxy to FastAPI backend
│   │
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── progress-bar.tsx
│   │   │   └── badge.tsx
│   │   ├── forms/                  # Form components
│   │   │   ├── file-upload.tsx
│   │   │   ├── contact-form.tsx
│   │   │   ├── email-capture.tsx
│   │   │   └── subscription-form.tsx
│   │   ├── layout/                 # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── navigation.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── breadcrumbs.tsx
│   │   ├── features/               # Feature-specific components
│   │   │   ├── upload/
│   │   │   │   ├── file-dropzone.tsx
│   │   │   │   ├── upload-progress.tsx
│   │   │   │   └── upload-summary.tsx
│   │   │   ├── results/
│   │   │   │   ├── results-display.tsx
│   │   │   │   ├── acs-codes-table.tsx
│   │   │   │   └── study-plan-view.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── stats-overview.tsx
│   │   │   │   ├── recent-reports.tsx
│   │   │   │   └── quick-actions.tsx
│   │   │   └── subscription/
│   │   │       ├── pricing-card.tsx
│   │   │       ├── billing-history.tsx
│   │   │       └── plan-comparison.tsx
│   │   └── providers/              # Context providers
│   │       ├── auth-provider.tsx
│   │       ├── query-provider.tsx
│   │       ├── theme-provider.tsx
│   │       └── toast-provider.tsx
│   │
│   ├── lib/                        # Utility libraries
│   │   ├── utils.ts                # General utilities
│   │   ├── cn.ts                   # Tailwind class merger
│   │   ├── validations.ts          # Zod schemas
│   │   ├── constants.ts            # App constants
│   │   ├── api.ts                  # API client configuration
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── stripe.ts               # Stripe client setup
│   │   └── hooks/                  # Custom React hooks
│   │       ├── use-upload.ts
│   │       ├── use-auth.ts
│   │       ├── use-subscription.ts
│   │       └── use-local-storage.ts
│   │
│   ├── stores/                     # State management
│   │   ├── auth-store.ts           # Authentication state
│   │   ├── upload-store.ts         # Upload state
│   │   ├── results-store.ts        # Results state
│   │   └── ui-store.ts             # UI state (modals, toasts)
│   │
│   ├── styles/                     # Styling
│   │   ├── globals.css             # Global styles
│   │   └── components.css          # Component-specific styles
│   │
│   └── types/                      # TypeScript types
│       ├── api.ts                  # API response types
│       ├── auth.ts                 # Authentication types
│       ├── subscription.ts         # Subscription types
│       └── global.ts               # Global type definitions
│
├── .env.local                      # Environment variables (local)
├── .env.example                    # Environment variables template
├── .gitignore
├── .husky/
│   └── pre-commit                  # Pre-commit hooks
├── lint-staged.config.js           # Lint-staged configuration
└── README.md
```

## 6. Initial File Scaffolding

### Root Layout (`src/app/layout.tsx`)
```typescript
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export const metadata: Metadata = {
  title: "CFIPros - ACS Code Extractor & Study Plans",
  description: "Extract ACS codes from FAA Knowledge Test reports and generate personalized study plans for aviation professionals.",
  keywords: ["CFI", "aviation", "ACS codes", "FAA", "study plans", "flight training"],
  authors: [{ name: "CFIPros Team" }],
  openGraph: {
    title: "CFIPros - ACS Code Extractor & Study Plans",
    description: "Extract ACS codes from FAA Knowledge Test reports and generate personalized study plans for aviation professionals.",
    url: "https://cfipros.com",
    siteName: "CFIPros",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CFIPros - ACS Code Extractor & Study Plans",
    description: "Extract ACS codes from FAA Knowledge Test reports and generate personalized study plans for aviation professionals.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-white font-sans antialiased">
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Landing Page (`src/app/page.tsx`)
```typescript
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">CFIPros</h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/acs-codes" className="text-gray-600 hover:text-gray-900">
                ACS Codes
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">
                About
              </Link>
              <Link href="/login" className="text-primary-600 hover:text-primary-700">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Extract ACS Codes from FAA Reports{" "}
              <span className="text-primary-600">Instantly</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Upload your FAA Knowledge Test reports and get accurate ACS code extraction 
              with personalized study plans in minutes, not hours.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/upload"
                className="rounded-md bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Try it Free
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to ace your next checkride
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Our AI-powered extraction identifies weak areas and creates targeted study plans.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  Multi-Format Support
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Process PDF reports, scanned documents, and mobile photos with 95%+ accuracy.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  Intelligent Study Plans
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Get personalized study recommendations based on your specific weak areas.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  Comprehensive ACS Database
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Access 10,257+ ACS codes from 18 official FAA publications.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">© 2025 CFIPros. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### Upload Page (`src/app/(public)/upload/page.tsx`)
```typescript
import { FileUploadDropzone } from "@/components/features/upload/file-dropzone";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Upload Your FAA Knowledge Test Report
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload up to 5 files (PDF, JPG, PNG) to extract ACS codes and generate your study plan.
          </p>
        </div>

        <div className="mt-12">
          <FileUploadDropzone />
        </div>
      </div>
    </div>
  );
}
```

### Environment Variables (`.env.example`)
```bash
# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/v1
API_BASE_URL=http://localhost:8000/v1
API_KEY=your-api-key

# Database (if needed for NextAuth)
DATABASE_URL=postgresql://username:password@localhost:5432/cfipros_frontend

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## 7. Development Setup

### Step 1: Environment Setup
```bash
# Copy environment variables
cp .env.example .env.local

# Install dependencies
npm install

# Set up Git hooks
npm run prepare
```

### Step 2: Development Scripts
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Build for production
npm run build
npm run start
```

### Step 3: Git Configuration
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

```javascript
// lint-staged.config.js
module.exports = {
  "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,mdx,css,yaml}": ["prettier --write"],
};
```

## 8. API Integration Strategy

### BFF Pattern Implementation
- **API Routes**: `/api/proxy/[...path]` to proxy requests to FastAPI backend
- **Authentication**: NextAuth.js with database session storage
- **Error Handling**: Centralized error handling with user-friendly messages
- **Type Safety**: Generate TypeScript types from OpenAPI spec

### Key Integration Points
1. **File Upload**: Direct upload to backend with progress tracking
2. **Results Retrieval**: Public results access with PII filtering
3. **Email Capture**: Lead generation integration
4. **Subscription Management**: Stripe integration for premium features

## 9. SEO Optimization Strategy

### Public ACS Code Pages
- **Dynamic Routes**: `/acs-codes/[code]` for individual code pages
- **Static Generation**: Pre-generate popular ACS code pages
- **Meta Tags**: Rich meta descriptions and structured data
- **Internal Linking**: Cross-link related codes and study materials

### Content Strategy
- **Code Descriptions**: Detailed explanations of each ACS code
- **Study Resources**: Links to official FAA materials
- **Practice Questions**: Sample questions for each code area
- **Video Tutorials**: Embedded instructional content

## 10. Performance Optimization

### Core Web Vitals
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Code Splitting**: Automatic route-based code splitting
- **Bundle Analysis**: Regular bundle size monitoring
- **Performance Monitoring**: Real User Monitoring (RUM)

### Caching Strategy
- **Static Assets**: CDN caching for images and static files
- **API Responses**: SWR caching for data fetching
- **Page Caching**: Static generation for public pages
- **Service Worker**: Offline support for critical pages

## 11. Security Implementation

### Client-Side Security
- **Input Validation**: Zod schemas for all form inputs
- **XSS Prevention**: Proper sanitization of user content
- **CSRF Protection**: NextAuth.js built-in CSRF protection
- **Content Security Policy**: Strict CSP headers

### Authentication Flow
1. **Registration**: Email verification required
2. **Login**: NextAuth.js with database sessions
3. **Password Reset**: Secure token-based reset flow
4. **Session Management**: Automatic session refresh

## 12. Testing Strategy

### Testing Framework
- **Unit Tests**: Jest with React Testing Library
- **Integration Tests**: API route testing with supertest
- **E2E Tests**: Playwright for critical user flows
- **Visual Regression**: Chromatic for UI component testing

### Key Test Coverage
- File upload functionality
- Results display accuracy
- Authentication flows
- Subscription management
- SEO page generation

## 13. Deployment Configuration

### Production Build
```bash
# Build optimization
npm run build

# Start production server
npm start
```

### Environment-Specific Configuration
- **Development**: Hot reloading, source maps, debug logging
- **Staging**: Production build, test payments, staging API
- **Production**: Optimized build, real payments, production API

## 14. Monitoring & Analytics

### User Analytics
- **PostHog**: User behavior tracking and feature flags
- **Conversion Tracking**: Upload → Email → Registration → Subscription
- **Performance Metrics**: Core Web Vitals monitoring
- **Error Tracking**: Sentry for error monitoring

### Business Metrics
- **Upload Success Rate**: File processing success metrics
- **Conversion Funnel**: Anonymous → Registered → Paid users
- **Feature Adoption**: Premium feature usage tracking
- **SEO Performance**: Organic traffic and search rankings

## 15. Success Criteria

### Technical Requirements
- ✅ Next.js 15 with App Router successfully configured
- ✅ TypeScript strict mode enabled with zero errors
- ✅ Tailwind CSS responsive design system implemented
- ✅ API proxy routes functional with FastAPI backend
- ✅ File upload with progress tracking working
- ✅ Public results display without authentication
- ✅ SEO-optimized ACS code pages generated

### Performance Requirements
- ✅ Lighthouse score >90 for all Core Web Vitals
- ✅ First Contentful Paint <1.5s
- ✅ Time to Interactive <3s
- ✅ Bundle size <500KB (gzipped)

### Business Requirements
- ✅ Anonymous upload flow functional
- ✅ Email capture integration working
- ✅ User registration and authentication
- ✅ Stripe subscription skeleton implemented
- ✅ Mobile-responsive design completed

## 16. Next Steps (Post-Initialization)

### Phase 1: Core Implementation
1. Implement file upload with drag-and-drop
2. Create results display components
3. Build authentication flows
4. Integrate Stripe for subscriptions

### Phase 2: SEO & Content
1. Generate ACS code pages with rich content
2. Implement structured data markup
3. Create study resource pages
4. Build internal linking system

### Phase 3: Premium Features
1. User dashboard with upload history
2. Advanced study plan features
3. Progress tracking and analytics
4. Instructor tools for bulk uploads

---

**This specification provides a comprehensive foundation for implementing the CFIPros Next.js 15 frontend as Phase 0 of the product roadmap, ready for immediate development and deployment.**