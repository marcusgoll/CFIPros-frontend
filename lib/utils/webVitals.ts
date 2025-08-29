/**
 * Simple Web Vitals tracking
 * Focuses on core performance metrics with minimal complexity
 */

export interface WebVital {
  name: 'CLS' | 'FID' | 'LCP' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export type WebVitalsCallback = (vital: WebVital) => void;

// Simplified thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  CLS: [0.1, 0.25],
  FID: [100, 300], 
  LCP: [2500, 4000],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
} as const;

function getRating(name: WebVital['name'], value: number): WebVital['rating'] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) {return 'good';}
  if (value <= poor) {return 'needs-improvement';}
  return 'poor';
}

export function trackWebVitals(callback: WebVitalsCallback): void {
  if (typeof window === 'undefined') {return;}

  // Track Core Web Vitals using the standard API
  try {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      onCLS((metric) => callback({
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
      }));
      
      onINP((metric) => callback({
        name: 'FID', 
        value: metric.value,
        rating: getRating('FID', metric.value),
      }));
      
      onLCP((metric) => callback({
        name: 'LCP',
        value: metric.value, 
        rating: getRating('LCP', metric.value),
      }));
      
      onFCP((metric) => callback({
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value), 
      }));
      
      onTTFB((metric) => callback({
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
      }));
    });
  } catch (error) {
    // Silently fail if web-vitals package is not available
    console.warn('Web Vitals tracking unavailable:', error);
  }
}

// Simple analytics integration
export function logWebVital(vital: WebVital): void {
  // Log to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to your analytics service
    // gtag('event', vital.name, { value: vital.value, rating: vital.rating });
  } else {
    console.log(`${vital.name}: ${vital.value} (${vital.rating})`);
  }
}