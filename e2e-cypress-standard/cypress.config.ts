/**
 * Cypress Configuration
 * 
 * @description Enterprise-grade configuration for E2E testing with
 * parallel execution, multiple viewports, and CI/CD optimization.
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { defineConfig } from 'cypress';

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

const isCI = process.env.CI === 'true';

// =============================================================================
// CYPRESS CONFIGURATION
// =============================================================================

export default defineConfig({
  // ---------------------------------------------------------------------------
  // E2E Testing Configuration
  // ---------------------------------------------------------------------------
  e2e: {
    // Base URL for all cy.visit() calls
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://localhost:3000',

    // Test file patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    supportFile: 'cypress/support/e2e.ts',

    // Setup Node events for plugins
    setupNodeEvents(on, config) {
      // Task for logging to terminal
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        table(data: Record<string, unknown>) {
          console.table(data);
          return null;
        },
        // Database seeding task
        'db:seed': async (scenario: string) => {
          // Implementation would connect to test database
          console.log(`Seeding database with scenario: ${scenario}`);
          return null;
        },
        // Database reset task
        'db:reset': async () => {
          console.log('Resetting database');
          return null;
        },
      });

      // Return modified config
      return config;
    },

    // Experimental features
    experimentalRunAllSpecs: true,
  },

  // ---------------------------------------------------------------------------
  // Viewport Configuration
  // ---------------------------------------------------------------------------
  viewportWidth: 1280,
  viewportHeight: 720,

  // ---------------------------------------------------------------------------
  // Timeouts
  // ---------------------------------------------------------------------------
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 30000,
  requestTimeout: 10000,
  responseTimeout: 30000,

  // ---------------------------------------------------------------------------
  // Retries (Higher in CI for flaky test resilience)
  // ---------------------------------------------------------------------------
  retries: {
    runMode: isCI ? 2 : 0,    // CI retries
    openMode: 0,              // Interactive mode - no retries
  },

  // ---------------------------------------------------------------------------
  // Screenshots & Videos
  // ---------------------------------------------------------------------------
  screenshotOnRunFailure: true,
  screenshotsFolder: 'cypress/screenshots',
  video: isCI,
  videoCompression: 32,
  videosFolder: 'cypress/videos',

  // ---------------------------------------------------------------------------
  // Reporter Configuration
  // ---------------------------------------------------------------------------
  reporter: isCI ? 'junit' : 'spec',
  reporterOptions: {
    mochaFile: 'cypress/results/results-[hash].xml',
    toConsole: true,
  },

  // ---------------------------------------------------------------------------
  // Browser Configuration
  // ---------------------------------------------------------------------------
  chromeWebSecurity: false, // Allow cross-origin requests in tests

  // ---------------------------------------------------------------------------
  // Environment Variables
  // ---------------------------------------------------------------------------
  env: {
    // API endpoints
    apiUrl: process.env.CYPRESS_API_URL ?? 'http://localhost:3001/api',
    
    // Test user credentials (use secrets in CI)
    testUserEmail: process.env.CYPRESS_TEST_USER_EMAIL ?? 'test@example.com',
    testUserPassword: process.env.CYPRESS_TEST_USER_PASSWORD ?? 'TestPassword123!',
    
    // Feature flags
    enableVisualTesting: false,
    enableA11yTesting: true,
  },

  // ---------------------------------------------------------------------------
  // Project Settings
  // ---------------------------------------------------------------------------
  projectId: process.env.CYPRESS_PROJECT_ID,
  numTestsKeptInMemory: isCI ? 0 : 50, // Reduce memory in CI
  watchForFileChanges: !isCI,
});
