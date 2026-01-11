/**
 * Login Page Object
 * 
 * @description Encapsulates all interactions with the login page.
 * Provides a clean API for authentication flows in Cypress E2E tests.
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ===========================================================================
  // PAGE METADATA
  // ===========================================================================

  readonly url = '/login';
  readonly pageTitle = 'Login';

  // ===========================================================================
  // ELEMENT GETTERS (Private implementation detail)
  // ===========================================================================

  private get emailInput() {
    return this.getByTestId('login-email');
  }

  private get passwordInput() {
    return this.getByTestId('login-password');
  }

  private get loginButton() {
    return this.getByTestId('login-submit');
  }

  private get forgotPasswordLink() {
    return cy.contains('a', /forgot password/i);
  }

  private get signUpLink() {
    return cy.contains('a', /sign up/i);
  }

  private get errorMessage() {
    return this.getByTestId('login-error');
  }

  private get rememberMeCheckbox() {
    return cy.get('input[type="checkbox"]').filter('[name="rememberMe"]');
  }

  private get socialLoginGoogle() {
    return this.getByTestId('login-google');
  }

  private get socialLoginGithub() {
    return this.getByTestId('login-github');
  }

  private get loadingSpinner() {
    return this.getByTestId('login-loading');
  }

  // ===========================================================================
  // PAGE ACTIONS (Public API)
  // ===========================================================================

  /**
   * Performs complete login flow with email and password.
   * 
   * @param email User's email address
   * @param password User's password
   * @param rememberMe Whether to check "Remember Me"
   * 
   * @example
   * ```typescript
   * loginPage.login('user@example.com', 'password123');
   * ```
   */
  login(email: string, password: string, rememberMe = false): this {
    this.enterEmail(email);
    this.enterPassword(password);
    
    if (rememberMe) {
      this.checkRememberMe();
    }
    
    this.clickLogin();
    return this;
  }

  /**
   * Performs login via API and sets session cookie.
   * Faster than UI login for tests that don't test auth flow.
   */
  loginViaApi(email: string, password: string): Cypress.Chainable {
    return cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/auth/login`,
      body: { email, password },
    }).then((response) => {
      expect(response.status).to.eq(200);
      // Session cookie is automatically set by cy.request
    });
  }

  /**
   * Enters email address.
   */
  enterEmail(email: string): this {
    this.typeIntoInput(this.emailInput, email);
    return this;
  }

  /**
   * Enters password.
   */
  enterPassword(password: string): this {
    this.typeIntoInput(this.passwordInput, password);
    return this;
  }

  /**
   * Checks the "Remember Me" checkbox.
   */
  checkRememberMe(): this {
    this.setCheckbox(this.rememberMeCheckbox, true);
    return this;
  }

  /**
   * Unchecks the "Remember Me" checkbox.
   */
  uncheckRememberMe(): this {
    this.setCheckbox(this.rememberMeCheckbox, false);
    return this;
  }

  /**
   * Clicks the login button.
   */
  clickLogin(): this {
    this.clickElement(this.loginButton);
    return this;
  }

  /**
   * Clicks "Forgot Password" link.
   */
  clickForgotPassword(): Cypress.Chainable {
    return this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Clicks "Sign Up" link.
   */
  clickSignUp(): Cypress.Chainable {
    return this.clickElement(this.signUpLink);
  }

  /**
   * Initiates Google OAuth login.
   */
  loginWithGoogle(): Cypress.Chainable {
    return this.clickElement(this.socialLoginGoogle);
  }

  /**
   * Initiates GitHub OAuth login.
   */
  loginWithGithub(): Cypress.Chainable {
    return this.clickElement(this.socialLoginGithub);
  }

  /**
   * Clears all form fields.
   */
  clearForm(): this {
    this.emailInput.clear();
    this.passwordInput.clear();
    return this;
  }

  // ===========================================================================
  // PAGE STATE QUERIES
  // ===========================================================================

  /**
   * Gets the current error message text.
   */
  getErrorMessage(): Cypress.Chainable<string> {
    return this.errorMessage.invoke('text');
  }

  /**
   * Checks if loading spinner is visible.
   */
  isLoading(): Cypress.Chainable<boolean> {
    return this.loadingSpinner.then(($el) => $el.is(':visible'));
  }

  // ===========================================================================
  // PAGE ASSERTIONS
  // ===========================================================================

  /**
   * Asserts the login page is displayed correctly.
   */
  assertPageLoaded(): this {
    this.assertVisible(this.emailInput);
    this.assertVisible(this.passwordInput);
    this.assertVisible(this.loginButton);
    return this;
  }

  /**
   * Asserts an error message is displayed.
   */
  assertErrorDisplayed(expectedText?: string | RegExp): this {
    this.assertVisible(this.errorMessage);
    
    if (expectedText) {
      this.assertContainsText(this.errorMessage, expectedText as string);
    }
    return this;
  }

  /**
   * Asserts no error message is displayed.
   */
  assertNoError(): this {
    this.assertNotExists(this.errorMessage);
    return this;
  }

  /**
   * Asserts email field shows validation error.
   */
  assertEmailInvalid(): this {
    this.emailInput.should('have.class', 'error')
      .or('have.attr', 'aria-invalid', 'true');
    return this;
  }

  /**
   * Asserts login button is disabled.
   */
  assertLoginDisabled(): this {
    this.assertDisabled(this.loginButton);
    return this;
  }

  /**
   * Asserts login button is enabled.
   */
  assertLoginEnabled(): this {
    this.assertEnabled(this.loginButton);
    return this;
  }

  /**
   * Asserts loading state is shown.
   */
  assertLoadingDisplayed(): this {
    this.assertVisible(this.loadingSpinner);
    return this;
  }

  /**
   * Asserts loading state is hidden.
   */
  assertLoadingHidden(): this {
    this.assertHidden(this.loadingSpinner);
    return this;
  }

  /**
   * Asserts successful redirect after login.
   */
  assertLoginSuccess(): Cypress.Chainable {
    return cy.url().should('match', /\/(dashboard|home)/);
  }
}

// Export singleton instance for convenience
export const loginPage = new LoginPage();
