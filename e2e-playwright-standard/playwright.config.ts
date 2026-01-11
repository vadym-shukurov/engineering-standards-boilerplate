/**
 * Playwright Configuration
 * 
 * @description Enterprise-grade configuration for E2E testing with
 * parallel execution, multiple browsers, and CI/CD optimization.
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

// =============================================================================
// PLAYWRIGHT CONFIGURATION
// =============================================================================

export default defineConfig({
  // ---------------------------------------------------------------------------
  // Test Directory & Matching
  // ---------------------------------------------------------------------------
  testDir: './tests',
  testMatch: '**/*.spec.ts',

  // ---------------------------------------------------------------------------
  // Parallel Execution
  // ---------------------------------------------------------------------------
  fullyParallel: true,
  workers: isCI ? 2 : undefined, // Limit workers in CI for stability

  // ---------------------------------------------------------------------------
  // Failure Handling
  // ---------------------------------------------------------------------------
  forbidOnly: isCI, // Fail if test.only is left in CI
  retries: isCI ? 2 : 0, // Retry flaky tests in CI
  maxFailures: isCI ? 10 : undefined, // Stop after 10 failures in CI

  // ---------------------------------------------------------------------------
  // Reporting
  // ---------------------------------------------------------------------------
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ...(isCI ? [['github'] as const] : []),
  ],

  // ---------------------------------------------------------------------------
  // Output Directories
  // ---------------------------------------------------------------------------
  outputDir: 'test-results',

  // ---------------------------------------------------------------------------
  // Global Setup/Teardown
  // ---------------------------------------------------------------------------
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  globalTeardown: path.join(__dirname, 'global-teardown.ts'),

  // ---------------------------------------------------------------------------
  // Shared Settings for All Projects
  // ---------------------------------------------------------------------------
  use: {
    // Base URL for navigation
    baseURL,

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording
    video: isCI ? 'retain-on-failure' : 'off',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 15000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },

    // Ignore HTTPS errors in non-production
    ignoreHTTPSErrors: !isCI,
  },

  // ---------------------------------------------------------------------------
  // Browser Projects
  // ---------------------------------------------------------------------------
  projects: [
    // Setup project - runs first
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop Browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // Mobile Browsers
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  // ---------------------------------------------------------------------------
  // Web Server (Development)
  // ---------------------------------------------------------------------------
  webServer: isCI
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120000,
      },

  // ---------------------------------------------------------------------------
  // Expect Configuration
  // ---------------------------------------------------------------------------
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },
});
