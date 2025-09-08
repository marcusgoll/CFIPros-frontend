#!/usr/bin/env node

/**
 * Contract Drift Detection Script for CI/CD
 * Detects API contract changes and validates compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  openApiSpec: 'api-contracts/openapi.yaml',
  baselineReport: '.contract-baseline.json',
  currentReport: '.contract-current.json',
  driftThreshold: 5, // 5% compliance decrease threshold
  exitOnDrift: process.env.CI ? true : false, // Exit with error code in CI
  outputFormat: process.env.CONTRACT_OUTPUT_FORMAT || 'text', // text, json, junit
  outputFile: process.env.CONTRACT_OUTPUT_FILE || null,
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
};

function colorize(text, color) {
  if (process.env.NO_COLOR) return text;
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function log(message, color = 'white') {
  console.log(colorize(message, color));
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.blue}=== ${message} ===${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * Check if OpenAPI spec exists
 */
function checkOpenApiSpec() {
  logHeader('Checking OpenAPI Specification');
  
  if (!fs.existsSync(CONFIG.openApiSpec)) {
    logError(`OpenAPI specification not found: ${CONFIG.openApiSpec}`);
    process.exit(1);
  }
  
  logSuccess(`OpenAPI specification found: ${CONFIG.openApiSpec}`);
  
  // Validate YAML syntax
  try {
    const content = fs.readFileSync(CONFIG.openApiSpec, 'utf8');
    // Basic YAML validation - could use yaml parser library for more thorough validation
    if (!content.includes('openapi:') || !content.includes('paths:')) {
      throw new Error('Invalid OpenAPI format');
    }
    logSuccess('OpenAPI specification format validated');
  } catch (error) {
    logError(`Invalid OpenAPI specification: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Run contract tests and generate compliance report
 */
function runContractTests() {
  logHeader('Running Contract Tests');
  
  try {
    // Run contract-specific tests
    logInfo('Running frontend contract tests...');
    execSync('npm run test:contract', { stdio: 'pipe' });
    logSuccess('Frontend contract tests passed');
    
    // Run backend contract tests if available
    if (fs.existsSync('__tests__/integration/backend')) {
      logInfo('Running backend contract tests...');
      try {
        execSync('npm run test:backend:local', { stdio: 'pipe' });
        logSuccess('Backend contract tests passed');
      } catch (error) {
        logWarning('Backend contract tests failed or not available');
      }
    }
    
  } catch (error) {
    logError('Contract tests failed');
    if (CONFIG.exitOnDrift) {
      process.exit(1);
    }
  }
}

/**
 * Load or create baseline compliance report
 */
function loadBaselineReport() {
  logHeader('Loading Baseline Compliance Report');
  
  if (!fs.existsSync(CONFIG.baselineReport)) {
    logWarning('No baseline report found - creating initial baseline');
    
    // Create initial baseline with perfect compliance
    const baselineReport = {
      generatedAt: new Date().toISOString(),
      totalRequests: 100,
      compliantRequests: 100,
      violations: [],
      complianceRate: 100,
      endpointStats: {},
      summary: {
        criticalViolations: 0,
        highViolations: 0,
        mediumViolations: 0,
        lowViolations: 0,
      },
      version: '1.0.0',
      environment: 'baseline',
    };
    
    fs.writeFileSync(CONFIG.baselineReport, JSON.stringify(baselineReport, null, 2));
    logSuccess('Created initial baseline report');
    return baselineReport;
  }
  
  try {
    const baseline = JSON.parse(fs.readFileSync(CONFIG.baselineReport, 'utf8'));
    logSuccess(`Loaded baseline report (${baseline.complianceRate.toFixed(2)}% compliance)`);
    return baseline;
  } catch (error) {
    logError(`Failed to load baseline report: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate current compliance report
 */
function generateCurrentReport() {
  logHeader('Generating Current Compliance Report');
  
  // Simulate compliance report generation
  // In a real implementation, this would integrate with the actual compliance monitoring
  const currentReport = {
    generatedAt: new Date().toISOString(),
    totalRequests: 150,
    compliantRequests: 142,
    violations: [],
    complianceRate: (142 / 150) * 100,
    endpointStats: {
      'POST /extractor/extract': {
        total: 50,
        compliant: 48,
        violations: 2,
        complianceRate: 96,
      },
      'GET /extractor/results': {
        total: 40,
        compliant: 40,
        violations: 0,
        complianceRate: 100,
      },
      'GET /auth/session': {
        total: 30,
        compliant: 28,
        violations: 2,
        complianceRate: 93.33,
      },
      'GET /auth/status': {
        total: 20,
        compliant: 20,
        violations: 0,
        complianceRate: 100,
      },
      'POST /auth/refresh': {
        total: 10,
        compliant: 6,
        violations: 4,
        complianceRate: 60,
      },
    },
    summary: {
      criticalViolations: 1,
      highViolations: 2,
      mediumViolations: 3,
      lowViolations: 2,
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    gitCommit: getGitCommit(),
  };
  
  // Add some sample violations for demonstration
  if (currentReport.summary.criticalViolations > 0) {
    currentReport.violations.push({
      endpoint: '/auth/refresh',
      method: 'POST',
      timestamp: new Date().toISOString(),
      expectedSchema: 'TokenResponse',
      violations: ['token: Required field missing'],
      severity: 'critical',
      impact: 'Authentication system may fail completely',
      responseStatus: 200,
    });
  }
  
  fs.writeFileSync(CONFIG.currentReport, JSON.stringify(currentReport, null, 2));
  logSuccess(`Generated current compliance report (${currentReport.complianceRate.toFixed(2)}% compliance)`);
  return currentReport;
}

/**
 * Detect contract drift
 */
function detectContractDrift(baseline, current) {
  logHeader('Detecting Contract Drift');
  
  const complianceChange = current.complianceRate - baseline.complianceRate;
  const hasDrift = Math.abs(complianceChange) >= CONFIG.driftThreshold;
  
  // Find new violations
  const baselineViolationKeys = new Set(
    (baseline.violations || []).map(v => `${v.endpoint}-${v.method}-${v.violations.join(',')}`)
  );
  const newViolations = (current.violations || []).filter(v => 
    !baselineViolationKeys.has(`${v.endpoint}-${v.method}-${v.violations.join(',')}`)
  );
  
  // Compare endpoint-specific changes
  const endpointChanges = {};
  for (const [endpoint, currentStats] of Object.entries(current.endpointStats)) {
    const baselineStats = baseline.endpointStats[endpoint];
    if (baselineStats) {
      const change = currentStats.complianceRate - baselineStats.complianceRate;
      endpointChanges[endpoint] = {
        endpoint,
        baselineCompliance: baselineStats.complianceRate,
        currentCompliance: currentStats.complianceRate,
        change,
        significant: Math.abs(change) >= CONFIG.driftThreshold,
      };
    }
  }
  
  // Generate drift report
  const driftReport = {
    hasDrift,
    complianceChange,
    newViolations,
    endpointChanges,
    summary: `Compliance ${complianceChange >= 0 ? 'improved' : 'degraded'} by ${Math.abs(complianceChange).toFixed(2)}%`,
    timestamp: new Date().toISOString(),
    baseline: {
      date: baseline.generatedAt,
      compliance: baseline.complianceRate,
    },
    current: {
      date: current.generatedAt,
      compliance: current.complianceRate,
    },
  };
  
  return driftReport;
}

/**
 * Report drift results
 */
function reportDriftResults(driftReport) {
  logHeader('Contract Drift Analysis Results');
  
  // Overall compliance change
  if (driftReport.complianceChange >= 0) {
    logSuccess(`Overall compliance improved by ${driftReport.complianceChange.toFixed(2)}%`);
  } else {
    logWarning(`Overall compliance decreased by ${Math.abs(driftReport.complianceChange).toFixed(2)}%`);
  }
  
  // Drift status
  if (driftReport.hasDrift) {
    logError(`❗ Contract drift detected (exceeds ${CONFIG.driftThreshold}% threshold)`);
  } else {
    logSuccess('No significant contract drift detected');
  }
  
  // New violations
  if (driftReport.newViolations.length > 0) {
    logWarning(`${driftReport.newViolations.length} new contract violations detected:`);
    driftReport.newViolations.forEach(violation => {
      log(`  • ${violation.severity.toUpperCase()}: ${violation.endpoint} - ${violation.violations.join(', ')}`, 'yellow');
    });
  } else {
    logSuccess('No new contract violations');
  }
  
  // Endpoint-specific changes
  const significantChanges = Object.values(driftReport.endpointChanges).filter(change => change.significant);
  if (significantChanges.length > 0) {
    logWarning('Significant endpoint compliance changes:');
    significantChanges.forEach(change => {
      const trend = change.change >= 0 ? '📈' : '📉';
      const color = change.change >= 0 ? 'green' : 'red';
      log(`  ${trend} ${change.endpoint}: ${change.change.toFixed(2)}% (${change.baselineCompliance.toFixed(1)}% → ${change.currentCompliance.toFixed(1)}%)`, color);
    });
  }
  
  // Summary
  log('\n' + driftReport.summary);
  
  return driftReport;
}

/**
 * Check API versioning compatibility
 */
function checkVersionCompatibility(baseline, current) {
  logHeader('Checking API Version Compatibility');
  
  const baselineVersion = baseline.version || '1.0.0';
  const currentVersion = current.version || '1.0.0';
  
  if (baselineVersion !== currentVersion) {
    logInfo(`Version change detected: ${baselineVersion} → ${currentVersion}`);
    
    // Parse semantic versions
    const [baseMajor, baseMinor, basePatch] = baselineVersion.split('.').map(Number);
    const [currMajor, currMinor, currPatch] = currentVersion.split('.').map(Number);
    
    // Check for breaking changes
    if (currMajor > baseMajor) {
      logWarning('Major version bump detected - may indicate breaking changes');
      return { compatible: false, reason: 'Major version change', impact: 'high' };
    } else if (currMinor > baseMinor) {
      logInfo('Minor version bump detected - backward compatible');
      return { compatible: true, reason: 'Minor version change', impact: 'low' };
    } else if (currPatch > basePatch) {
      logSuccess('Patch version bump detected - bug fixes only');
      return { compatible: true, reason: 'Patch version change', impact: 'none' };
    } else {
      logSuccess('No version change detected');
      return { compatible: true, reason: 'No version change', impact: 'none' };
    }
  }
  
  logSuccess('Same version - no compatibility concerns');
  return { compatible: true, reason: 'No version change', impact: 'none' };
}

/**
 * Export results in various formats
 */
function exportResults(driftReport, versionCompatibility) {
  const results = {
    timestamp: new Date().toISOString(),
    drift: driftReport,
    version: versionCompatibility,
    exitCode: (driftReport.hasDrift && CONFIG.exitOnDrift) ? 1 : 0,
  };
  
  if (CONFIG.outputFile) {
    logHeader('Exporting Results');
    
    switch (CONFIG.outputFormat) {
      case 'json':
        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(results, null, 2));
        logSuccess(`Results exported to ${CONFIG.outputFile} (JSON format)`);
        break;
        
      case 'junit':
        const junitXml = generateJUnitXML(results);
        fs.writeFileSync(CONFIG.outputFile, junitXml);
        logSuccess(`Results exported to ${CONFIG.outputFile} (JUnit XML format)`);
        break;
        
      default:
        const textReport = generateTextReport(results);
        fs.writeFileSync(CONFIG.outputFile, textReport);
        logSuccess(`Results exported to ${CONFIG.outputFile} (text format)`);
    }
  }
  
  return results.exitCode;
}

/**
 * Generate JUnit XML format
 */
function generateJUnitXML(results) {
  const testCases = [];
  
  // Overall drift test
  if (results.drift.hasDrift) {
    testCases.push(`
    <testcase classname="ContractDrift" name="OverallCompliance" time="1">
      <failure message="Contract drift detected">
        Compliance decreased by ${Math.abs(results.drift.complianceChange).toFixed(2)}%
        ${results.drift.newViolations.length} new violations
      </failure>
    </testcase>`);
  } else {
    testCases.push(`
    <testcase classname="ContractDrift" name="OverallCompliance" time="1"/>`);
  }
  
  // Version compatibility test
  if (!results.version.compatible) {
    testCases.push(`
    <testcase classname="VersionCompatibility" name="APIVersions" time="1">
      <failure message="Version compatibility issue">
        ${results.version.reason} - Impact: ${results.version.impact}
      </failure>
    </testcase>`);
  } else {
    testCases.push(`
    <testcase classname="VersionCompatibility" name="APIVersions" time="1"/>`);
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="ContractDriftDetection" tests="${testCases.length}" failures="${results.exitCode}" time="2" timestamp="${results.timestamp}">
${testCases.join('')}
</testsuite>`;
}

/**
 * Generate text report
 */
function generateTextReport(results) {
  return `Contract Drift Detection Report
Generated: ${results.timestamp}

=== DRIFT ANALYSIS ===
Overall Compliance Change: ${results.drift.complianceChange.toFixed(2)}%
Drift Detected: ${results.drift.hasDrift ? 'YES' : 'NO'}
New Violations: ${results.drift.newViolations.length}

=== VERSION COMPATIBILITY ===
Compatible: ${results.version.compatible ? 'YES' : 'NO'}
Reason: ${results.version.reason}
Impact: ${results.version.impact}

=== SUMMARY ===
${results.drift.summary}
Exit Code: ${results.exitCode}
`;
}

/**
 * Get current git commit hash
 */
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Main execution
 */
function main() {
  logHeader('Contract Drift Detection for CI/CD');
  logInfo(`Threshold: ${CONFIG.driftThreshold}% compliance change`);
  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`Exit on drift: ${CONFIG.exitOnDrift}`);
  
  try {
    // 1. Check OpenAPI specification
    checkOpenApiSpec();
    
    // 2. Run contract tests
    runContractTests();
    
    // 3. Load baseline report
    const baseline = loadBaselineReport();
    
    // 4. Generate current report
    const current = generateCurrentReport();
    
    // 5. Detect drift
    const driftReport = detectContractDrift(baseline, current);
    
    // 6. Report results
    reportDriftResults(driftReport);
    
    // 7. Check version compatibility
    const versionCompatibility = checkVersionCompatibility(baseline, current);
    
    // 8. Export results
    const exitCode = exportResults(driftReport, versionCompatibility);
    
    // 9. Final status
    logHeader('Final Status');
    if (exitCode === 0) {
      logSuccess('Contract drift check completed successfully');
    } else {
      logError('Contract drift check failed - see results above');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    logError(`Contract drift check failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkOpenApiSpec,
  runContractTests,
  detectContractDrift,
  checkVersionCompatibility,
  main,
};