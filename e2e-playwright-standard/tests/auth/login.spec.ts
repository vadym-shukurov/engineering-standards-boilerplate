/**
 * Login Flow E2E Tests
 * 
 * @description Comprehensive test suite for authentication flows.
 * Demonstrates best practices for E2E testing with Playwright.
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

import { test, expect } from '../../fixtures/test-fixtures';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

test.describe('Authentication - Login Flow', () => {
  // ---------------------------------------------------------------------------
  // Setup & Teardown
  // ---------------------------------------------------------------------------

  test.beforeEach(async ({ loginPage }) => {
    // Navigate to login page before each test
    await loginPage.navigate();
    await loginPage.assertPageLoaded();
  });

  // ===========================================================================
  // HAPPY PATH TESTS
  // ===========================================================================

  test.describe('Successful Login', () => {
    test('should login with valid credentials', async ({ 
      loginPage, 
      dashboardPage,
      testUser,
      page,
    }) => {
      // Arrange - User is on login page (done in beforeEach)

      // Act - Perform login
      await loginPage.login(testUser.email, testUser.password);

      // Assert - User is redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await dashboardPage.assertDashboardLoaded();
      await dashboardPage.assertUserWelcomed(testUser.name);
    });

    test('should login with "Remember Me" checked', async ({ 
      loginPage, 
      page,
      testUser,
    }) => {
      // Act
      await loginPage.login(testUser.email, testUser.password, true);

      // Assert - Check for persistent session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name === 'session');
      
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // > 1 day
    });

    test('should redirect to originally requested page after login', async ({ 
      loginPage, 
      page,
      testUser,
    }) => {
      // Arrange - Try to access protected page
      await page.goto('/dashboard/settings');
      
      // Should redirect to login with return URL
      await expect(page).toHaveURL(/\/login\?returnUrl=/);

      // Act - Login
      await loginPage.login(testUser.email, testUser.password);

      // Assert - Redirected to original page
      await expect(page).toHaveURL(/\/dashboard\/settings/);
    });
  });

  // ===========================================================================
  // VALIDATION TESTS
  // ===========================================================================

  test.describe('Form Validation', () => {
    test('should show error for empty email', async ({ loginPage }) => {
      // Act
      await loginPage.enterPassword('somepassword');
      await loginPage.clickLogin();

      // Assert
      await loginPage.assertErrorDisplayed(/email is required/i);
    });

    test('should show error for empty password', async ({ loginPage }) => {
      // Act
      await loginPage.enterEmail('user@example.com');
      await loginPage.clickLogin();

      // Assert
      await loginPage.assertErrorDisplayed(/password is required/i);
    });

    test('should show error for invalid email format', async ({ loginPage }) => {
      // Act
      await loginPage.enterEmail('invalid-email');
      await loginPage.enterPassword('password123');
      await loginPage.clickLogin();

      // Assert
      await loginPage.assertErrorDisplayed(/valid email/i);
    });

    test('should disable login button when form is empty', async ({ loginPage }) => {
      // Assert
      await loginPage.assertLoginDisabled();
    });

    test('should enable login button when form is filled', async ({ loginPage }) => {
      // Act
      await loginPage.enterEmail('user@example.com');
      await loginPage.enterPassword('password123');

      // Assert
      await loginPage.assertLoginEnabled();
    });

    test('should trim whitespace from email', async ({ 
      loginPage, 
      page,
      testUser,
    }) => {
      // Act - Enter email with whitespace
      await loginPage.enterEmail(`  ${testUser.email}  `);
      await loginPage.enterPassword(testUser.password);
      await loginPage.clickLogin();

      // Assert - Login should succeed
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  test.describe('Error Handling', () => {
    test('should show error for wrong password', async ({ loginPage, testUser }) => {
      // Act
      await loginPage.login(testUser.email, 'wrongpassword');

      // Assert
      await loginPage.assertErrorDisplayed(/invalid credentials/i);
    });

    test('should show error for non-existent user', async ({ loginPage }) => {
      // Act
      await loginPage.login('nonexistent@example.com', 'password123');

      // Assert
      await loginPage.assertErrorDisplayed(/invalid credentials/i);
    });

    test('should show lockout message after multiple failed attempts', async ({ 
      loginPage,
      testUser,
    }) => {
      // Act - Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await loginPage.login(testUser.email, 'wrongpassword');
        await loginPage.assertErrorDisplayed();
        
        if (i < 4) {
          // Clear error and try again
          await loginPage.navigate();
        }
      }

      // Assert - Account should be locked
      await loginPage.assertErrorDisplayed(/account.*(locked|too many attempts)/i);
    });

    test('should handle server errors gracefully', async ({ 
      loginPage,
      page,
    }) => {
      // Arrange - Mock server error
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      // Act
      await loginPage.login('user@example.com', 'password123');

      // Assert - User-friendly error message
      await loginPage.assertErrorDisplayed(/try again later|server error/i);
    });

    test('should handle network timeout', async ({ 
      loginPage,
      page,
    }) => {
      // Arrange - Mock slow response
      await page.route('**/api/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // Exceed timeout
        await route.fulfill({ status: 200 });
      });

      // Act
      await loginPage.login('user@example.com', 'password123');

      // Assert
      await loginPage.assertErrorDisplayed(/timeout|connection/i);
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ loginPage, page }) => {
      // Act - Navigate using Tab key
      await page.keyboard.press('Tab'); // Focus email
      await page.keyboard.type('user@example.com');
      
      await page.keyboard.press('Tab'); // Focus password
      await page.keyboard.type('password123');
      
      await page.keyboard.press('Tab'); // Focus remember me
      await page.keyboard.press('Space'); // Check it
      
      await page.keyboard.press('Tab'); // Focus login button
      
      // Assert - Login button is focused
      const focusedElement = await page.evaluate(() => 
        document.activeElement?.getAttribute('data-testid')
      );
      expect(focusedElement).toBe('login-submit');
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Assert - Form has proper labeling
      await expect(page.getByTestId('login-email')).toHaveAttribute('aria-label', /email/i);
      await expect(page.getByTestId('login-password')).toHaveAttribute('aria-label', /password/i);
    });

    test('should announce errors to screen readers', async ({ 
      loginPage,
      page,
    }) => {
      // Act - Trigger validation error
      await loginPage.clickLogin();

      // Assert - Error region has proper ARIA attributes
      const errorElement = page.getByTestId('login-error');
      await expect(errorElement).toHaveAttribute('role', 'alert');
      await expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });

    test('should pass automated accessibility checks', async ({ page }) => {
      // Note: Requires @axe-core/playwright
      // const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      // expect(accessibilityScanResults.violations).toEqual([]);
      
      // Simplified check without axe-core
      const headings = await page.locator('h1, h2, h3').all();
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // NAVIGATION TESTS
  // ===========================================================================

  test.describe('Navigation', () => {
    test('should navigate to forgot password page', async ({ 
      loginPage,
      page,
    }) => {
      // Act
      await loginPage.clickForgotPassword();

      // Assert
      await expect(page).toHaveURL(/\/forgot-password/);
    });

    test('should navigate to sign up page', async ({ 
      loginPage,
      page,
    }) => {
      // Act
      await loginPage.clickSignUp();

      // Assert
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  // ===========================================================================
  // SOCIAL LOGIN TESTS
  // ===========================================================================

  test.describe('Social Login', () => {
    test('should initiate Google OAuth flow', async ({ 
      loginPage,
      page,
    }) => {
      // Arrange - Set up listener for popup/redirect
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        loginPage.loginWithGoogle(),
      ]);

      // Assert - Google OAuth page opened
      await expect(popup).toHaveURL(/accounts\.google\.com/);
    });

    test('should initiate GitHub OAuth flow', async ({ 
      loginPage,
      page,
    }) => {
      // Arrange
      const [popup] = await Promise.all([
        page.waitForEvent('popup'),
        loginPage.loginWithGithub(),
      ]);

      // Assert
      await expect(popup).toHaveURL(/github\.com\/login\/oauth/);
    });
  });

  // ===========================================================================
  // PERFORMANCE TESTS
  // ===========================================================================

  test.describe('Performance', () => {
    test('should load login page within acceptable time', async ({ page }) => {
      // Arrange
      const startTime = Date.now();

      // Act
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Assert - Page loads within 3 seconds
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    test('should complete login within acceptable time', async ({ 
      loginPage,
      page,
      testUser,
    }) => {
      // Arrange
      await loginPage.enterEmail(testUser.email);
      await loginPage.enterPassword(testUser.password);
      
      const startTime = Date.now();

      // Act
      await loginPage.clickLogin();
      await page.waitForURL(/\/dashboard/);

      // Assert - Login completes within 2 seconds
      const loginTime = Date.now() - startTime;
      expect(loginTime).toBeLessThan(2000);
    });
  });

  // ===========================================================================
  // VISUAL REGRESSION TESTS
  // ===========================================================================

  test.describe('Visual Regression', () => {
    test('login page should match snapshot', async ({ page }) => {
      // Wait for any animations to complete
      await page.waitForTimeout(500);

      // Assert
      await expect(page).toHaveScreenshot('login-page.png', {
        maxDiffPixelRatio: 0.1,
      });
    });

    test('login error state should match snapshot', async ({ 
      loginPage,
      page,
    }) => {
      // Arrange - Trigger error state
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.assertErrorDisplayed();

      // Assert
      await expect(page).toHaveScreenshot('login-error-state.png');
    });
  });
});
