# CSP Security Audit Findings

## Critical Security Issues Found

### 1. Duplicate CSP Configuration (🔴 HIGH RISK)

**Location 1: middleware.ts lines 57-68**
```typescript
"Content-Security-Policy",
[
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.dev",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://api.cfipros.com https://*.clerk.accounts.dev https://*.clerk.dev https://us.i.posthog.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev",
].join("; ")
```

**Location 2: next.config.ts lines 81-93**
```typescript
"Content-Security-Policy",
value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev https://api.cfipros.com https://us.i.posthog.com wss:",
  "frame-src https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev https://safe-rooster-9.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
].join("; "),
```

### 2. Unsafe Directives Present (🔴 HIGH RISK)

Both configurations contain dangerous unsafe directives:
- `'unsafe-eval'` - Allows eval() and related functions (XSS risk)
- `'unsafe-inline'` - Allows inline scripts and styles (XSS risk)

### 3. Configuration Conflicts

**Differences between the two CSP configurations:**
1. **Object-src directive**: Only in next.config.ts (good)
2. **Base-uri directive**: Only in next.config.ts (good) 
3. **Frame-src differences**: 
   - middleware: `'self'` + clerk domains
   - next.config: stripe + clerk + specific clerk subdomain
4. **Connect-src differences**:
   - middleware: Missing wss: protocol
   - next.config: Includes wss: for WebSocket connections
5. **Stripe integration**: Only in next.config.ts

### 4. Security Assessment

**Current Risk Level: HIGH** 🔴

**Issues:**
1. Two different CSP policies create confusion and potential bypasses
2. Both contain unsafe directives that violate security best practices
3. Inconsistent domain allowlists between configurations
4. Missing some security-critical directives in middleware version

**Recommendations:**
1. **IMMEDIATE**: Consolidate to single CSP source (middleware.ts)
2. **IMMEDIATE**: Remove unsafe-eval and unsafe-inline where possible
3. **IMMEDIATE**: Include all required security directives
4. **IMMEDIATE**: Implement consistent domain allowlists

## Proposed Consolidated CSP

```typescript
const secureCSP = [
  "default-src 'self'",
  "script-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.dev",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.dev https://api.cfipros.com https://us.i.posthog.com wss:",
  "frame-src https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.dev",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join("; ");
```

**Security Improvements:**
- ❌ Removed `'unsafe-eval'` (eliminates eval-based XSS)  
- ⚠️ Kept `'unsafe-inline'` for styles only (required for dynamic styling)
- ✅ Added `form-action 'self'` (prevents form submission attacks)
- ✅ Added `frame-ancestors 'none'` (prevents clickjacking)
- ✅ Consolidated all required domains
- ✅ Single source of truth in middleware.ts