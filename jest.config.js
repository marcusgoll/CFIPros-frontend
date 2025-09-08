const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/__tests__/__utils__/jest-extended.d.ts",
    "<rootDir>/__tests__/integration/frontend/setup/dom-environment.ts",
  ],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  
  // Coverage Configuration - Optimized for current state and growth
  collectCoverageFrom: [
    // Core application directories
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    
    // Exclude configuration and generated files
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!jest.setup.js",
    "!jest.setup.mjs",
    "!next.config.ts",
    "!tailwind.config.ts",
    "!postcss.config.mjs",
    
    // Exclude scripts and build artifacts
    "!scripts/**",
    "!public/**",
    "!*.config.{js,ts,mjs}",
    "!**/*.config.{js,ts,mjs}",
  ],
  
  // Coverage thresholds - Phase 1 targets (50% baseline)
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 45,
      functions: 50,
      lines: 50,
    },
    // Higher thresholds for critical modules
    "./lib/security/**": {
      statements: 75,
      branches: 70,
      functions: 75,
      lines: 75,
    },
    "./app/api/**": {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  
  // Performance optimizations
  maxWorkers: "50%", // Use half available CPU cores
  cache: true,
  cacheDirectory: "<rootDir>/.jest-cache",
  
  // Memory leak detection for integration tests
  detectOpenHandles: true,
  forceExit: false,
  
  // Coverage reporting
  coverageReporters: [
    "text",
    "lcov",
    "html",
    "json-summary",
  ],
  coverageDirectory: "<rootDir>/coverage",
  
  // Test organization and execution
  testMatch: [
    "**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "**/?(*.)+(spec|test).{js,jsx,ts,tsx}",
  ],
  
  // Ignore utility files and helpers that aren't tests
  testPathIgnorePatterns: [
    "<rootDir>/.next/", 
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/__utils__/",
    "<rootDir>/__tests__/integration/test-helpers.ts",
  ],
  
  // Timeouts and performance
  testTimeout: 10000, // 10 seconds for async tests
  
  // Verbose reporting for debugging
  verbose: false,
  
  // Transform configuration for better Next.js 15 support
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
