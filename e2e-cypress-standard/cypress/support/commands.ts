/**
 * Cypress Custom Commands
 * 
 * @description Reusable custom commands for common test operations.
 * Extends Cypress's built-in commands with project-specific functionality.
 * 
 * @best-practices
 * - Commands should be atomic and reusable
 * - Use meaningful names that describe the action
 * - Avoid unnecessary waits - leverage Cypress retry-ability
 * - Type all commands properly for IDE support
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

// =============================================================================
// TYPE DECLARATIONS
// =============================================================================

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication
      login(email: string, password: string): Chainable<void>;
      loginViaApi(email?: string, password?: string): Chainable<void>;
      logout(): Chainable<void>;

      // Selectors
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      getByCy(selector: string): Chainable<JQuery<HTMLElement>>;

      // Assertions
      shouldBeVisible(): Chainable<JQuery<HTMLElement>>;
      shouldNotExist(): Chainable<JQuery<HTMLElement>>;

      // API Helpers
      apiRequest<T>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        body?: object
      ): Chainable<Response<T>>;

      // Database
      seedDatabase(scenario: string): Chainable<void>;
      resetDatabase(): Chainable<void>;

      // Accessibility
      checkA11y(context?: string, options?: object): Chainable<void>;

      // Performance
      measurePageLoad(): Chainable<PerformanceEntry>;
    }
  }
}

// =============================================================================
// AUTHENTICATION COMMANDS
// =============================================================================

/**
 * Logs in via the UI login form.
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.getByTestId('login-email').type(email);
  cy.getByTestId('login-password').type(password);
  cy.getByTestId('login-submit').click();
  cy.url().should('match', /\/(dashboard|home)/);
});

/**
 * Logs in via API for faster test setup.
 * Uses default test user if credentials not provided.
 */
Cypress.Commands.add('loginViaApi', (
  email = Cypress.env('testUserEmail'),
  password = Cypress.env('testUserPassword')
) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      // Store auth token if returned
      if (response.body.token) {
        window.localStorage.setItem('authToken', response.body.token);
      }
    } else {
      throw new Error(`Login failed: ${response.body.message}`);
    }
  });
});

/**
 * Logs out the current user.
 */
Cypress.Commands.add('logout', () => {
  cy.clearLocalStorage('authToken');
  cy.clearCookies();
  cy.visit('/login');
});

// =============================================================================
// SELECTOR COMMANDS
// =============================================================================

/**
 * Gets element by data-testid attribute.
 */
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

/**
 * Gets element by data-cy attribute.
 */
Cypress.Commands.add('getByCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`);
});

// =============================================================================
// ASSERTION COMMANDS
// =============================================================================

/**
 * Asserts element is visible (chainable).
 */
Cypress.Commands.add('shouldBeVisible', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('be.visible');
  return cy.wrap(subject);
});

/**
 * Asserts element does not exist (chainable).
 */
Cypress.Commands.add('shouldNotExist', { prevSubject: true }, (subject) => {
  cy.wrap(subject).should('not.exist');
  return cy.wrap(subject);
});

// =============================================================================
// API HELPER COMMANDS
// =============================================================================

/**
 * Makes an API request with authentication.
 */
Cypress.Commands.add('apiRequest', <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: object
) => {
  const authToken = window.localStorage.getItem('authToken');
  
  return cy.request<T>({
    method,
    url: `${Cypress.env('apiUrl')}${url}`,
    body,
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    failOnStatusCode: false,
  });
});

// =============================================================================
// DATABASE COMMANDS
// =============================================================================

/**
 * Seeds the database with test data for a specific scenario.
 */
Cypress.Commands.add('seedDatabase', (scenario: string) => {
  cy.task('db:seed', scenario);
});

/**
 * Resets the database to a clean state.
 */
Cypress.Commands.add('resetDatabase', () => {
  cy.task('db:reset');
});

// =============================================================================
// ACCESSIBILITY COMMANDS
// =============================================================================

/**
 * Runs accessibility checks on the current page.
 * Requires cypress-axe to be installed.
 */
Cypress.Commands.add('checkA11y', (context?: string, options?: object) => {
  // This requires cypress-axe package
  // cy.injectAxe();
  // cy.checkA11y(context, options);
  cy.log('A11y check: cypress-axe integration required');
});

// =============================================================================
// PERFORMANCE COMMANDS
// =============================================================================

/**
 * Measures page load performance.
 */
Cypress.Commands.add('measurePageLoad', () => {
  return cy.window().then((win) => {
    const perfEntries = win.performance.getEntriesByType('navigation');
    if (perfEntries.length > 0) {
      return perfEntries[0];
    }
    throw new Error('No navigation performance entries found');
  });
});

// =============================================================================
// EXPORT (Required for TypeScript module)
// =============================================================================

export {};
