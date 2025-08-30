/**
 * Simple Performance Monitor
 * Lightweight Web Vitals tracking for development
 */

'use client';

import React, { useEffect, useState } from 'react';
import { trackWebVitals, logWebVital, type WebVital } from '@/lib/utils/webVitals';

interface SimplePerformanceMonitorProps {
  enabled?: boolean;
  showDevOverlay?: boolean;
}

export function SimplePerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  showDevOverlay = false,
}: SimplePerformanceMonitorProps) {
  const [vitals, setVitals] = useState<WebVital[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    trackWebVitals((vital) => {
      logWebVital(vital);
      if (showDevOverlay) {
        setVitals(prev => {
          const existing = prev.find(v => v.name === vital.name);
          if (existing) {
            return prev.map(v => v.name === vital.name ? vital : v);
          }
          return [...prev, vital];
        });
      }
    });
  }, [enabled, showDevOverlay]);

  // Only show overlay in development with showDevOverlay enabled
  if (!showDevOverlay || process.env.NODE_ENV !== 'development' || vitals.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-popover border border-border text-popover-foreground p-3 rounded-lg text-xs font-mono max-w-xs shadow-lg z-50">
      <h3 className="font-bold mb-2">Web Vitals</h3>
      {vitals.map(vital => (
        <div key={vital.name} className="flex justify-between items-center mb-1">
          <span>{vital.name}:</span>
          <span className={`ml-2 ${
            vital.rating === 'good' ? 'text-green-400' : 
            vital.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(vital.value)}{vital.name === 'CLS' ? '' : 'ms'}
          </span>
        </div>
      ))}
    </div>
  );
}
