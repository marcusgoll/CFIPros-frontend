/**
 * Accessibility Audit Script for ACS Database Integration
 * 
 * This script performs comprehensive accessibility testing for:
 * - ACS detail pages with action buttons
 * - AKTR batch result pages with database links
 * - Study plan generation components
 * - Performance data displays
 * 
 * Requirements: WCAG 2.1 AA compliance
 */

const { chromium } = require('playwright');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('fs').promises;
const path = require('path');

class AccessibilityAuditor {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    this.browser = await chromium.launch({ headless: true });
    this.context = await this.browser.newContext({
      viewport: { width: 1200, height: 800 },
    });
    this.page = await this.context.newPage();
    
    // Disable animations for consistent testing
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async auditPage(url, pageName, options = {}) {
    console.log(`🔍 Auditing ${pageName}: ${url}`);
    
    try {
      await this.page.goto(url, { waitUntil: 'networkidle' });
      
      // Wait for dynamic content to load
      if (options.waitForSelector) {
        await this.page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }
      
      // Additional wait for React hydration
      await this.page.waitForTimeout(2000);

      const axeBuilder = new AxeBuilder({ page: this.page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('#clerk-components'); // Exclude third-party components

      const results = await axeBuilder.analyze();
      
      const pageResult = {
        url,
        pageName,
        timestamp: new Date().toISOString(),
        violations: results.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.length,
          examples: violation.nodes.slice(0, 3).map(node => ({
            html: node.html.substring(0, 200),
            target: node.target,
          })),
        })),
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
      };

      this.results.push(pageResult);
      
      if (results.violations.length > 0) {
        console.log(`❌ ${pageName}: ${results.violations.length} violations found`);
        results.violations.forEach(violation => {
          console.log(`  - ${violation.id}: ${violation.impact} - ${violation.help}`);
        });
      } else {
        console.log(`✅ ${pageName}: No violations found`);
      }

      return pageResult;
    } catch (error) {
      console.error(`❌ Error auditing ${pageName}:`, error.message);
      return {
        url,
        pageName,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async auditKeyboardNavigation(url, pageName) {
    console.log(`⌨️  Testing keyboard navigation for ${pageName}`);
    
    await this.page.goto(url, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    const keyboardTest = {
      pageName,
      url,
      issues: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // Test tab navigation
      const focusableElements = await this.page.$$eval(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
        elements => elements.map(el => ({
          tagName: el.tagName,
          type: el.type,
          text: el.textContent?.substring(0, 50) || '',
          hasVisibleFocus: window.getComputedStyle(el, ':focus').outlineWidth !== '0px',
        }))
      );

      if (focusableElements.length === 0) {
        keyboardTest.issues.push('No focusable elements found on page');
      }

      // Test Enter and Space key activation on buttons
      const buttons = await this.page.$$('button');
      for (const button of buttons) {
        const isVisible = await button.isVisible();
        if (isVisible) {
          await button.focus();
          // Check if button has proper focus styles
          const focusStyles = await button.evaluate(btn => {
            const styles = window.getComputedStyle(btn, ':focus');
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              boxShadow: styles.boxShadow,
            };
          });

          if (focusStyles.outlineWidth === '0px' && !focusStyles.boxShadow.includes('rgb')) {
            keyboardTest.issues.push(`Button "${await button.textContent()}" lacks visible focus indicator`);
          }
        }
      }

      keyboardTest.focusableElementCount = focusableElements.length;
    } catch (error) {
      keyboardTest.issues.push(`Error during keyboard testing: ${error.message}`);
    }

    console.log(`⌨️  ${pageName}: ${keyboardTest.issues.length} keyboard issues found`);
    return keyboardTest;
  }

  async auditColorContrast(url, pageName) {
    console.log(`🎨 Testing color contrast for ${pageName}`);
    
    await this.page.goto(url, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    // Use axe-core for color contrast testing
    const axeBuilder = new AxeBuilder({ page: this.page })
      .withTags(['color-contrast']);

    const results = await axeBuilder.analyze();
    
    return {
      pageName,
      url,
      contrastViolations: results.violations.filter(v => v.id === 'color-contrast'),
      timestamp: new Date().toISOString(),
    };
  }

  async generateReport() {
    const report = {
      auditDate: new Date().toISOString(),
      summary: {
        totalPages: this.results.length,
        totalViolations: this.results.reduce((sum, r) => sum + (r.violations?.length || 0), 0),
        criticalViolations: this.results.reduce((sum, r) => 
          sum + (r.violations?.filter(v => v.impact === 'critical').length || 0), 0),
        seriousViolations: this.results.reduce((sum, r) => 
          sum + (r.violations?.filter(v => v.impact === 'serious').length || 0), 0),
      },
      results: this.results,
    };

    const reportPath = path.join(process.cwd(), 'accessibility-audit-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 ACCESSIBILITY AUDIT SUMMARY');
    console.log('================================');
    console.log(`Total pages audited: ${report.summary.totalPages}`);
    console.log(`Total violations: ${report.summary.totalViolations}`);
    console.log(`Critical violations: ${report.summary.criticalViolations}`);
    console.log(`Serious violations: ${report.summary.seriousViolations}`);
    console.log(`\n📄 Full report saved to: ${reportPath}`);

    return report;
  }
}

async function runAccessibilityAudit() {
  const auditor = new AccessibilityAuditor();
  
  try {
    await auditor.setup();
    
    const baseUrl = process.env.AUDIT_BASE_URL || 'http://localhost:3000';
    
    // Test pages for ACS Database integration
    const pagesToTest = [
      {
        url: `${baseUrl}/acs-database`,
        name: 'ACS Database Home',
        waitForSelector: '[data-testid="acs-search-bar"]',
      },
      {
        url: `${baseUrl}/acs-database/pa-i-a-k1`,
        name: 'ACS Detail Page with Action Buttons',
        waitForSelector: 'h3:has-text("Training Actions")',
      },
      {
        url: `${baseUrl}/tools/aktr-to-acs`,
        name: 'AKTR Upload Tool',
        waitForSelector: 'h2:has-text("Upload Knowledge Test Reports")',
      },
      // Note: Batch results page would need a valid batch ID in real testing
      // {
      //   url: `${baseUrl}/batches/test-batch-id`,
      //   name: 'Batch Results with ACS Links',
      //   waitForSelector: 'h4:has-text("ACS Codes Found")',
      // },
    ];

    // Run accessibility audits
    for (const pageConfig of pagesToTest) {
      await auditor.auditPage(pageConfig.url, pageConfig.name, pageConfig);
      
      // Test keyboard navigation
      await auditor.auditKeyboardNavigation(pageConfig.url, pageConfig.name);
      
      // Test color contrast
      await auditor.auditColorContrast(pageConfig.url, pageConfig.name);
    }

    // Generate and save report
    const report = await auditor.generateReport();
    
    // Exit with error code if critical issues found
    if (report.summary.criticalViolations > 0) {
      console.error('\n❌ CRITICAL ACCESSIBILITY ISSUES FOUND');
      process.exit(1);
    } else if (report.summary.seriousViolations > 0) {
      console.warn('\n⚠️  SERIOUS ACCESSIBILITY ISSUES FOUND');
      process.exit(1);
    } else {
      console.log('\n✅ NO CRITICAL ACCESSIBILITY ISSUES FOUND');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.teardown();
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runAccessibilityAudit().catch(console.error);
}

module.exports = { AccessibilityAuditor, runAccessibilityAudit };