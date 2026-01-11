/**
 * Cypress E2E Support File
 * 
 * @description Global configuration, custom commands, and hooks for all E2E tests.
 * This file is automatically loaded before every spec file.
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import './commands';

// =============================================================================
// GLOBAL HOOKS
// =============================================================================

beforeEach(() => {
  // Clear local storage before each test for isolation
  cy.clearLocalStorage();
  
  // Clear cookies (except session if needed)
  cy.clearCookies();

  // Log test start
  cy.log(`Starting test: ${Cypress.currentTest.title}`);
});

afterEach(function () {
  // Log test result
  const testState = this.currentTest?.state;
  cy.log(`Test ${testState}: ${Cypress.currentTest.title}`);

  // Take screenshot on failure (additional to automatic)
  if (testState === 'failed') {
    cy.task('log', `FAILED: ${Cypress.currentTest.title}`);
  }
});

// =============================================================================
// UNCAUGHT EXCEPTION HANDLING
// =============================================================================

Cypress.on('uncaught:exception', (err, runnable) => {
  // Log the error but don't fail the test for known issues
  console.error('Uncaught exception:', err.message);
  
  // Return false to prevent the error from failing the test
  // Only do this for known, non-critical errors
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  
  // Return true to let Cypress fail the test for unknown errors
  return true;
});

// =============================================================================
// VIEWPORT PRESETS
// =============================================================================

export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  largeDesktop: { width: 1920, height: 1080 },
} as const;

// =============================================================================
// TEST DATA TYPES
// =============================================================================

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

export const testUsers: Record<string, TestUser> = {
  standard: {
    email: Cypress.env('testUserEmail') ?? 'test@example.com',
    password: Cypress.env('testUserPassword') ?? 'TestPassword123!',
    name: 'Test User',
    role: 'user',
  },
  admin: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    name: 'Admin User',
    role: 'admin',
  },
};
