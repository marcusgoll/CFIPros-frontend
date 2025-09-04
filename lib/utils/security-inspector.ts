/**
 * Security Header Inspector for Development
 * 
 * Provides development-mode inspection of security headers including CSP
 * to help developers verify security configurations
 */

interface CSPAnalysis {
  header: string;
  directives: Record<string, string[]>;
  unsafeDirectives: string[];
  securityScore: number;
  recommendations: string[];
}

interface SecurityHeaders {
  csp?: string | undefined;
  frameOptions?: string | undefined;
  contentTypeOptions?: string | undefined;
  referrerPolicy?: string | undefined;
  permissionsPolicy?: string | undefined;
}

/**
 * Analyze CSP header for security issues
 */
export function analyzeCSP(cspHeader: string): CSPAnalysis {
  const directives: Record<string, string[]> = {};
  const unsafeDirectives: string[] = [];
  const recommendations: string[] = [];
  
  // Parse CSP directives
  const directiveList = cspHeader.split(';').map(d => d.trim()).filter(Boolean);
  
  directiveList.forEach(directive => {
    const [name, ...values] = directive.split(/\s+/);
    if (name) {
      directives[name] = values;
      
      // Check for unsafe directives
      values.forEach(value => {
        if (value.includes('unsafe-')) {
          unsafeDirectives.push(`${name}: ${value}`);
        }
      });
    }
  });
  
  // Security score calculation (0-100)
  let score = 100;
  
  // Penalize unsafe directives
  score -= unsafeDirectives.length * 15;
  
  // Check for missing security directives
  const requiredDirectives = [
    'default-src', 'script-src', 'object-src', 'base-uri', 'frame-ancestors'
  ];
  
  requiredDirectives.forEach(required => {
    if (!directives[required]) {
      score -= 10;
      recommendations.push(`Add ${required} directive for enhanced security`);
    }
  });
  
  // Check for overly permissive directives
  Object.entries(directives).forEach(([directive, values]) => {
    if (values.includes('*')) {
      score -= 20;
      recommendations.push(`Avoid wildcard (*) in ${directive}, use specific domains`);
    }
    if (values.includes('data:') && directive !== 'img-src') {
      score -= 10;
      recommendations.push(`Consider restricting data: URIs in ${directive}`);
    }
  });
  
  // Recommendations for unsafe directives
  if (unsafeDirectives.length > 0) {
    recommendations.push('Consider using nonces or hashes instead of unsafe-inline');
    recommendations.push('Remove unsafe-eval if not absolutely necessary');
  }
  
  return {
    header: cspHeader,
    directives,
    unsafeDirectives,
    securityScore: Math.max(0, score),
    recommendations
  };
}

/**
 * Inspect all security headers
 */
export function inspectSecurityHeaders(headers: SecurityHeaders): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // Only run in development
  }
  
  // eslint-disable-next-line no-console
  console.group('🔒 Security Headers Inspector');
  
  // CSP Analysis
  if (headers.csp) {
    const analysis = analyzeCSP(headers.csp);
    // eslint-disable-next-line no-console
    console.log('📋 CSP Analysis:', {
      score: `${analysis.securityScore}/100`,
      unsafeDirectives: analysis.unsafeDirectives,
      recommendations: analysis.recommendations.slice(0, 3) // Show top 3
    });
    
    if (analysis.securityScore < 70) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ CSP Security Score is below 70. Consider improvements.');
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('❌ No CSP header found');
  }
  
  // Other security headers
  const headerChecks = [
    { name: 'X-Frame-Options', value: headers.frameOptions, expected: 'DENY' },
    { name: 'X-Content-Type-Options', value: headers.contentTypeOptions, expected: 'nosniff' },
    { name: 'Referrer-Policy', value: headers.referrerPolicy, expected: 'origin-when-cross-origin' }
  ];
  
  headerChecks.forEach(({ name, value, expected }) => {
    if (!value) {
      // eslint-disable-next-line no-console
      console.warn(`❌ Missing ${name} header`);
    } else if (value === expected) {
      // eslint-disable-next-line no-console
      console.log(`✅ ${name}: ${value}`);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`⚠️ ${name}: ${value} (expected: ${expected})`);
    }
  });
  
  // eslint-disable-next-line no-console
  console.groupEnd();
}

/**
 * Auto-inspect security headers from middleware response
 * Call this in middleware for automatic development inspection
 */
export function autoInspectMiddlewareHeaders(response: Response): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const headers: SecurityHeaders = {
    csp: response.headers.get('Content-Security-Policy') || undefined,
    frameOptions: response.headers.get('X-Frame-Options') || undefined,
    contentTypeOptions: response.headers.get('X-Content-Type-Options') || undefined,
    referrerPolicy: response.headers.get('Referrer-Policy') || undefined,
    permissionsPolicy: response.headers.get('Permissions-Policy') || undefined
  };
  
  // Only inspect on page loads, not API calls
  const url = new URL(response.url || '');
  if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/_next/')) {
    inspectSecurityHeaders(headers);
  }
}

/**
 * Create browser-side CSP violation detector for development
 */
export function setupCSPViolationDetector(): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (e) => {
    // eslint-disable-next-line no-console
    console.error('🚨 CSP Violation Detected:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      effectiveDirective: e.effectiveDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber
    });
  });
  
  // eslint-disable-next-line no-console
  console.log('🛡️ CSP Violation detector enabled for development');
}