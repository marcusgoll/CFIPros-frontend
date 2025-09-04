import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Reporting Endpoint
 * 
 * Receives CSP violation reports from the browser and logs them
 * for security monitoring and analysis
 */
export async function POST(request: NextRequest) {
  try {
    const violation = await request.json();
    
    // Log CSP violation for monitoring
    // eslint-disable-next-line no-console
    console.warn('CSP Violation Detected:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      violation: {
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        effectiveDirective: violation['effective-directive'],
        originalPolicy: violation['original-policy'],
        referrer: violation.referrer,
        violatedDirective: violation['violated-directive']
      }
    });

    // In production, you might want to send violations to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(violation);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing CSP violation report:', error);
    return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  }
}

/**
 * Handle GET requests to provide CSP violation endpoint info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/security/csp-violations',
    purpose: 'CSP violation reporting',
    status: 'active'
  });
}