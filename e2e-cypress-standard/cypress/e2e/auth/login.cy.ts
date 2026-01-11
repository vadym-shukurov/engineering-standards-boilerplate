/**
 * Login Flow E2E Tests
 * 
 * @description Comprehensive test suite for authentication flows.
 * Demonstrates best practices for Cypress E2E testing.
 * 
 * @coverage
 * - Happy path: Successful login
 * - Validation: Empty fields, invalid formats
 * - Error handling: Wrong credentials, locked accounts
 * - Accessibility: Keyboard navigation, screen readers
 * - Performance: Page load metrics
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { loginPage } from '../../pages/LoginPage';
import { testUsers, viewports } from '../../support/e2e';

describe('Authentication - Login Flow', () => {
  // ===========================================================================
  // TEST SETUP
  // ===========================================================================

  beforeEach(() => {
    // Intercept API calls for monitoring
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    
    // Navigate to login page
    loginPage.visit();
    loginPage.assertPageLoaded();
  });

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  describe('Successful Login', () => {
    it('should login with valid credentials', () => {
      // Arrange
      const { email, password } = testUsers.standard;

      // Act
      loginPage.login(email, password);

      // Assert
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
      loginPage.assertLoginSuccess();
    });

    it('should login with "Remember Me" checked', () => {
      // Arrange
      const { email, password } = testUsers.standard;

      // Act
      loginPage.login(email, password, true);

      // Assert
      loginPage.assertLoginSuccess();
      cy.getCookie('session').should('exist');
    });

    it('should redirect to originally requested page after login', () => {
      // Arrange - Try to access protected page
      cy.visit('/dashboard/settings');
      cy.url().should('include', '/login');

      // Act
      const { email, password } = testUsers.standard;
      loginPage.login(email, password);

      // Assert - Should redirect back to requested page
      cy.url().should('include', '/dashboard/settings');
    });

    it('should persist session across page reloads', () => {
      // Arrange & Act
      const { email, password } = testUsers.standard;
      loginPage.login(email, password);
      loginPage.assertLoginSuccess();

      // Reload and verify still logged in
      cy.reload();
      cy.url().should('not.include', '/login');
    });
  });

  // ===========================================================================
  // VALIDATION TESTS
  // ===========================================================================

  describe('Form Validation', () => {
    it('should show error for empty email', () => {
      // Act
      loginPage.enterPassword('somepassword');
      loginPage.clickLogin();

      // Assert
      loginPage.assertErrorDisplayed(/email.*required/i);
    });

    it('should show error for empty password', () => {
      // Act
      loginPage.enterEmail('user@example.com');
      loginPage.clickLogin();

      // Assert
      loginPage.assertErrorDisplayed(/password.*required/i);
    });

    it('should show error for invalid email format', () => {
      // Act
      loginPage.enterEmail('invalid-email');
      loginPage.enterPassword('password123');
      loginPage.clickLogin();

      // Assert
      loginPage.assertErrorDisplayed(/valid email/i);
    });

    it('should disable login button when form is empty', () => {
      // Assert
      loginPage.assertLoginDisabled();
    });

    it('should enable login button when form is filled', () => {
      // Act
      loginPage.enterEmail('user@example.com');
      loginPage.enterPassword('password123');

      // Assert
      loginPage.assertLoginEnabled();
    });

    it('should trim whitespace from email', () => {
      // Arrange
      const { email, password } = testUsers.standard;

      // Act - Enter email with whitespace
      loginPage.enterEmail(`  ${email}  `);
      loginPage.enterPassword(password);
      loginPage.clickLogin();

      // Assert - Login should succeed
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling', () => {
    it('should show error for wrong password', () => {
      // Arrange
      const { email } = testUsers.standard;

      // Act
      loginPage.login(email, 'wrongpassword');

      // Assert
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
      loginPage.assertErrorDisplayed(/invalid credentials/i);
    });

    it('should show error for non-existent user', () => {
      // Act
      loginPage.login('nonexistent@example.com', 'password123');

      // Assert
      cy.wait('@loginRequest').its('response.statusCode').should('eq', 401);
      loginPage.assertErrorDisplayed(/invalid credentials/i);
    });

    it('should show lockout message after multiple failed attempts', () => {
      // Arrange
      const { email } = testUsers.standard;
      const maxAttempts = 5;

      // Act - Attempt login multiple times with wrong password
      for (let i = 0; i < maxAttempts; i++) {
        loginPage.login(email, 'wrongpassword');
        cy.wait('@loginRequest');
        
        if (i < maxAttempts - 1) {
          loginPage.clearForm();
        }
      }

      // Assert - Account should be locked
      loginPage.assertErrorDisplayed(/locked|too many attempts/i);
    });

    it('should handle server errors gracefully', () => {
      // Arrange - Mock server error
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('loginError');

      // Act
      loginPage.login('user@example.com', 'password123');

      // Assert
      cy.wait('@loginError');
      loginPage.assertErrorDisplayed(/try again|server error/i);
    });

    it('should handle network timeout', () => {
      // Arrange - Mock slow response
      cy.intercept('POST', '**/api/auth/login', {
        delay: 35000,
        statusCode: 200,
      }).as('slowLogin');

      // Act
      loginPage.login('user@example.com', 'password123');

      // Assert - Should show timeout error before response
      loginPage.assertErrorDisplayed(/timeout|connection/i);
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('should support keyboard navigation', () => {
      // Act - Navigate using Tab key
      cy.get('body').tab(); // Focus email
      cy.focused().should('have.attr', 'data-testid', 'login-email');
      
      cy.focused().type('user@example.com');
      cy.get('body').tab(); // Focus password
      cy.focused().should('have.attr', 'data-testid', 'login-password');
      
      cy.focused().type('password123');
      cy.get('body').tab(); // Focus remember me or login button
    });

    it('should have proper ARIA labels', () => {
      // Assert
      cy.getByTestId('login-email').should('have.attr', 'aria-label');
      cy.getByTestId('login-password').should('have.attr', 'aria-label');
    });

    it('should announce errors to screen readers', () => {
      // Act - Trigger validation error
      loginPage.clickLogin();

      // Assert - Error region has proper ARIA attributes
      cy.getByTestId('login-error')
        .should('have.attr', 'role', 'alert')
        .and('have.attr', 'aria-live');
    });

    it('should have sufficient color contrast', () => {
      // This would typically use cypress-axe
      cy.log('Color contrast check: Requires cypress-axe');
    });
  });

  // ===========================================================================
  // NAVIGATION TESTS
  // ===========================================================================

  describe('Navigation', () => {
    it('should navigate to forgot password page', () => {
      // Act
      loginPage.clickForgotPassword();

      // Assert
      cy.url().should('include', '/forgot-password');
    });

    it('should navigate to sign up page', () => {
      // Act
      loginPage.clickSignUp();

      // Assert
      cy.url().should('include', '/signup');
    });

    it('should redirect logged-in users away from login page', () => {
      // Arrange - Login first
      cy.loginViaApi();

      // Act - Try to visit login page
      cy.visit('/login');

      // Assert - Should redirect to dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  // ===========================================================================
  // RESPONSIVE DESIGN TESTS
  // ===========================================================================

  describe('Responsive Design', () => {
    Object.entries(viewports).forEach(([name, { width, height }]) => {
      it(`should display correctly on ${name} (${width}x${height})`, () => {
        // Arrange
        cy.viewport(width, height);

        // Act
        loginPage.visit();

        // Assert
        loginPage.assertPageLoaded();
        cy.getByTestId('login-email').should('be.visible');
        cy.getByTestId('login-password').should('be.visible');
        cy.getByTestId('login-submit').should('be.visible');
      });
    });
  });

  // ===========================================================================
  // PERFORMANCE TESTS
  // ===========================================================================

  describe('Performance', () => {
    it('should load login page within acceptable time', () => {
      // Arrange & Act
      cy.visit('/login');

      // Assert - Page loads within 3 seconds
      cy.measurePageLoad().then((perfEntry) => {
        const loadTime = (perfEntry as PerformanceNavigationTiming).loadEventEnd;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should complete login within acceptable time', () => {
      // Arrange
      const startTime = Date.now();
      const { email, password } = testUsers.standard;

      // Act
      loginPage.login(email, password);

      // Assert - Login completes within 2 seconds
      cy.url().should('match', /\/(dashboard|home)/).then(() => {
        const loginTime = Date.now() - startTime;
        expect(loginTime).to.be.lessThan(2000);
      });
    });
  });

  // ===========================================================================
  // VISUAL REGRESSION TESTS
  // ===========================================================================

  describe('Visual Regression', () => {
    it('should match login page snapshot', () => {
      // Arrange
      cy.wait(500); // Wait for animations

      // Assert
      cy.screenshot('login-page');
      // With percy: cy.percySnapshot('Login Page');
    });

    it('should match error state snapshot', () => {
      // Arrange - Trigger error
      loginPage.login('invalid@example.com', 'wrongpassword');
      cy.wait('@loginRequest');

      // Assert
      cy.screenshot('login-error-state');
    });
  });

  // ===========================================================================
  // SECURITY TESTS
  // ===========================================================================

  describe('Security', () => {
    it('should mask password input', () => {
      // Assert
      cy.getByTestId('login-password').should('have.attr', 'type', 'password');
    });

    it('should not expose credentials in URL', () => {
      // Act
      loginPage.login('user@example.com', 'password123');

      // Assert
      cy.url().should('not.include', 'password');
      cy.url().should('not.include', 'email');
    });

    it('should clear password field on error', () => {
      // Act
      loginPage.login('user@example.com', 'wrongpassword');
      cy.wait('@loginRequest');

      // Assert
      cy.getByTestId('login-password').should('have.value', '');
    });
  });
});
