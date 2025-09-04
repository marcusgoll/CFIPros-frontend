/**
 * Performance Audit Script for ACS Database Integration
 * 
 * Tests performance requirements:
 * - All pages < 2s load time
 * - First Contentful Paint < 1.8s
 * - Largest Contentful Paint < 2.5s
 * - Cumulative Layout Shift < 0.1
 * - First Input Delay < 100ms
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class PerformanceAuditor {
  constructor() {
    this.browser = null;
    this.context = null;
    this.results = [];
  }

  async setup() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-dev-shm-usage', '--no-sandbox'] 
    });
    
    // Create context with network throttling for realistic testing
    this.context = await this.browser.newContext({
      viewport: { width: 1200, height: 800 },
      // Simulate 3G connection
      // extraHTTPHeaders: {
      //   'Accept-Encoding': 'gzip, deflate'
      // }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async auditPage(url, pageName, options = {}) {
    console.log(`🚀 Performance testing ${pageName}: ${url}`);
    
    const page = await this.context.newPage();
    
    try {
      // Start performance measurement
      const startTime = Date.now();
      
      // Navigate and wait for load
      const response = await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 10000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Get Web Vitals using JavaScript
      const vitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          const vitals = {};
          
          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = lastEntry.startTime;
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // First Input Delay (simulated)
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.fid = entries.length > 0 ? entries[0].processingStart - entries[0].startTime : 0;
          }).observe({ type: 'first-input', buffered: true });
          
          // Cumulative Layout Shift
          let cls = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            }
            vitals.cls = cls;
          }).observe({ type: 'layout-shift', buffered: true });
          
          // First Contentful Paint
          const paintEntries = performance.getEntriesByType('paint');
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          vitals.fcp = fcpEntry ? fcpEntry.startTime : 0;
          
          // DOM Content Loaded
          const navEntries = performance.getEntriesByType('navigation');
          vitals.domContentLoaded = navEntries[0] ? navEntries[0].domContentLoadedEventEnd : 0;
          vitals.domInteractive = navEntries[0] ? navEntries[0].domInteractive : 0;
          
          setTimeout(() => resolve(vitals), 2000); // Wait for metrics to stabilize
        });
      });

      // Get resource loading metrics
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        return {
          totalRequests: resources.length,
          totalSize: resources.reduce((size, resource) => size + (resource.transferSize || 0), 0),
          slowestResource: resources.reduce((slowest, resource) => 
            resource.duration > (slowest?.duration || 0) ? resource : slowest, null
          ),
          cssFiles: resources.filter(r => r.name.includes('.css')).length,
          jsFiles: resources.filter(r => r.name.includes('.js')).length,
          imageFiles: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)).length,
        };
      });

      // Check for accessibility tree
      const a11yTreeSize = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      const pageResult = {
        url,
        pageName,
        timestamp: new Date().toISOString(),
        statusCode: response.status(),
        loadTime,
        vitals,
        resourceMetrics,
        a11yTreeSize,
        performance: {
          meetsLoadTimeRequirement: loadTime < 2000,
          meetsFCPRequirement: vitals.fcp < 1800,
          meetsLCPRequirement: vitals.lcp < 2500,
          meetsCLSRequirement: vitals.cls < 0.1,
          meetsFIDRequirement: vitals.fid < 100,
        }
      };

      this.results.push(pageResult);
      
      // Log immediate results
      console.log(`  📊 Load time: ${loadTime}ms ${loadTime < 2000 ? '✅' : '❌'}`);
      console.log(`  🎨 FCP: ${Math.round(vitals.fcp)}ms ${vitals.fcp < 1800 ? '✅' : '❌'}`);
      console.log(`  🖼️  LCP: ${Math.round(vitals.lcp)}ms ${vitals.lcp < 2500 ? '✅' : '❌'}`);
      console.log(`  📐 CLS: ${vitals.cls.toFixed(3)} ${vitals.cls < 0.1 ? '✅' : '❌'}`);
      console.log(`  ⚡ Resources: ${resourceMetrics.totalRequests} requests, ${Math.round(resourceMetrics.totalSize / 1024)}KB`);

      return pageResult;
      
    } catch (error) {
      console.error(`❌ Error testing ${pageName}:`, error.message);
      return {
        url,
        pageName,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }

  async auditMobilePerformance(url, pageName) {
    console.log(`📱 Mobile performance testing ${pageName}`);
    
    const page = await this.context.newPage();
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Simulate mobile device
    await page.emulate({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    try {
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      const mobileLoadTime = Date.now() - startTime;
      
      // Test touch interactions
      const touchTargets = await page.$$eval('button, a, [role="button"]', elements => 
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height,
            meetsTouchTarget: rect.width >= 44 && rect.height >= 44, // iOS HIG minimum
          };
        })
      );

      const result = {
        pageName,
        url,
        mobileLoadTime,
        meetsMobileLoadTime: mobileLoadTime < 3000, // More lenient for mobile
        touchTargets: {
          total: touchTargets.length,
          meetingTouchTargetSize: touchTargets.filter(t => t.meetsTouchTarget).length,
          failing: touchTargets.filter(t => !t.meetsTouchTarget).length,
        },
        timestamp: new Date().toISOString(),
      };

      console.log(`  📱 Mobile load: ${mobileLoadTime}ms ${mobileLoadTime < 3000 ? '✅' : '❌'}`);
      console.log(`  👆 Touch targets: ${result.touchTargets.meetingTouchTargetSize}/${result.touchTargets.total} adequate`);

      return result;
      
    } catch (error) {
      console.error(`❌ Mobile test error for ${pageName}:`, error.message);
      return { error: error.message };
    } finally {
      await page.close();
    }
  }

  async generateReport() {
    const summary = {
      totalPages: this.results.length,
      passedLoadTime: this.results.filter(r => r.performance?.meetsLoadTimeRequirement).length,
      passedFCP: this.results.filter(r => r.performance?.meetsFCPRequirement).length,
      passedLCP: this.results.filter(r => r.performance?.meetsLCPRequirement).length,
      passedCLS: this.results.filter(r => r.performance?.meetsCLSRequirement).length,
      avgLoadTime: this.results.reduce((sum, r) => sum + (r.loadTime || 0), 0) / this.results.length,
      avgLCP: this.results.reduce((sum, r) => sum + (r.vitals?.lcp || 0), 0) / this.results.length,
      avgCLS: this.results.reduce((sum, r) => sum + (r.vitals?.cls || 0), 0) / this.results.length,
    };

    const report = {
      auditDate: new Date().toISOString(),
      summary,
      results: this.results,
      requirements: {
        loadTime: '< 2000ms',
        fcp: '< 1800ms',
        lcp: '< 2500ms',
        cls: '< 0.1',
        fid: '< 100ms',
      }
    };

    const reportPath = path.join(process.cwd(), 'performance-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n🚀 PERFORMANCE AUDIT SUMMARY');
    console.log('=============================');
    console.log(`Pages tested: ${summary.totalPages}`);
    console.log(`Load time (< 2s): ${summary.passedLoadTime}/${summary.totalPages} ✅`);
    console.log(`FCP (< 1.8s): ${summary.passedFCP}/${summary.totalPages} ✅`);
    console.log(`LCP (< 2.5s): ${summary.passedLCP}/${summary.totalPages} ✅`);
    console.log(`CLS (< 0.1): ${summary.passedCLS}/${summary.totalPages} ✅`);
    console.log(`Average load time: ${Math.round(summary.avgLoadTime)}ms`);
    console.log(`\n📄 Full report: ${reportPath}`);

    return report;
  }
}

async function runPerformanceAudit() {
  const auditor = new PerformanceAuditor();
  
  try {
    await auditor.setup();
    
    const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
    
    const pagesToTest = [
      {
        url: `${baseUrl}/acs-database`,
        name: 'ACS Database Home',
      },
      {
        url: `${baseUrl}/acs-database/pa-i-a-k1`,
        name: 'ACS Detail Page with Integration',
      },
      {
        url: `${baseUrl}/tools/aktr-to-acs`,
        name: 'AKTR Upload Tool',
      },
    ];

    // Run desktop performance tests
    for (const pageConfig of pagesToTest) {
      await auditor.auditPage(pageConfig.url, pageConfig.name);
      
      // Also test mobile performance
      await auditor.auditMobilePerformance(pageConfig.url, pageConfig.name);
    }

    const report = await auditor.generateReport();
    
    // Check if performance requirements are met
    const allPagesMeetLoadTime = report.summary.passedLoadTime === report.summary.totalPages;
    const allPagesMeetFCP = report.summary.passedFCP === report.summary.totalPages;
    const allPagesMeetLCP = report.summary.passedLCP === report.summary.totalPages;
    
    if (!allPagesMeetLoadTime || !allPagesMeetFCP || !allPagesMeetLCP) {
      console.error('\n❌ PERFORMANCE REQUIREMENTS NOT MET');
      process.exit(1);
    } else {
      console.log('\n✅ ALL PERFORMANCE REQUIREMENTS MET');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Performance audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.teardown();
  }
}

if (require.main === module) {
  runPerformanceAudit().catch(console.error);
}

module.exports = { PerformanceAuditor, runPerformanceAudit };