/**
 * Login Page Object
 * 
 * @description Encapsulates all interactions with the login page.
 * Provides a clean API for authentication flows in E2E tests.
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ===========================================================================
  // PAGE METADATA
  // ===========================================================================

  readonly url = '/login';
  readonly pageTitle = 'Login';

  // ===========================================================================
  // LOCATORS (Private - Implementation Detail)
  // ===========================================================================

  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly forgotPasswordLink: Locator;
  private readonly signUpLink: Locator;
  private readonly errorMessage: Locator;
  private readonly rememberMeCheckbox: Locator;
  private readonly socialLoginGoogle: Locator;
  private readonly socialLoginGithub: Locator;

  // ===========================================================================
  // CONSTRUCTOR
  // ===========================================================================

  constructor(page: Page) {
    super(page);

    // Initialize locators using best practices:
    // - data-testid for stability
    // - Semantic selectors as fallback
    // - Avoid CSS classes (fragile)
    this.emailInput = page.getByTestId('login-email');
    this.passwordInput = page.getByTestId('login-password');
    this.loginButton = page.getByTestId('login-submit');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.signUpLink = page.getByRole('link', { name: /sign up/i });
    this.errorMessage = page.getByTestId('login-error');
    this.rememberMeCheckbox = page.getByLabel(/remember me/i);
    this.socialLoginGoogle = page.getByTestId('login-google');
    this.socialLoginGithub = page.getByTestId('login-github');
  }

  // ===========================================================================
  // PAGE ACTIONS (Public API)
  // ===========================================================================

  /**
   * Performs login with email and password.
   * 
   * @param email User's email address
   * @param password User's password
   * @param rememberMe Whether to check "Remember Me"
   * @returns Promise that resolves when login form is submitted
   * 
   * @example
   * ```typescript
   * await loginPage.login('user@example.com', 'password123');
   * ```
   */
  async login(email: string, password: string, rememberMe = false): Promise<void> {
    await this.enterEmail(email);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.checkRememberMe();
    }
    
    await this.clickLogin();
  }

  /**
   * Enters email address.
   */
  async enterEmail(email: string): Promise<this> {
    await this.fillInput(this.emailInput, email);
    return this;
  }

  /**
   * Enters password.
   */
  async enterPassword(password: string): Promise<this> {
    await this.fillInput(this.passwordInput, password);
    return this;
  }

  /**
   * Checks the "Remember Me" checkbox.
   */
  async checkRememberMe(): Promise<this> {
    await this.setCheckbox(this.rememberMeCheckbox, true);
    return this;
  }

  /**
   * Clicks the login button.
   */
  async clickLogin(): Promise<void> {
    await this.clickElement(this.loginButton);
  }

  /**
   * Clicks "Forgot Password" link.
   */
  async clickForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink);
  }

  /**
   * Clicks "Sign Up" link.
   */
  async clickSignUp(): Promise<void> {
    await this.clickElement(this.signUpLink);
  }

  /**
   * Initiates Google OAuth login.
   */
  async loginWithGoogle(): Promise<void> {
    await this.clickElement(this.socialLoginGoogle);
  }

  /**
   * Initiates GitHub OAuth login.
   */
  async loginWithGithub(): Promise<void> {
    await this.clickElement(this.socialLoginGithub);
  }

  // ===========================================================================
  // PAGE STATE QUERIES
  // ===========================================================================

  /**
   * Gets the current error message text.
   */
  async getErrorMessage(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  /**
   * Checks if login button is enabled.
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
  }

  // ===========================================================================
  // PAGE ASSERTIONS
  // ===========================================================================

  /**
   * Asserts the login page is displayed correctly.
   */
  async assertPageLoaded(): Promise<void> {
    await this.assertVisible(this.emailInput);
    await this.assertVisible(this.passwordInput);
    await this.assertVisible(this.loginButton);
  }

  /**
   * Asserts an error message is displayed.
   */
  async assertErrorDisplayed(expectedText?: string | RegExp): Promise<void> {
    await this.assertVisible(this.errorMessage);
    
    if (expectedText) {
      await this.assertText(this.errorMessage, expectedText);
    }
  }

  /**
   * Asserts no error message is displayed.
   */
  async assertNoError(): Promise<void> {
    await this.assertHidden(this.errorMessage);
  }

  /**
   * Asserts email field has validation error.
   */
  async assertEmailInvalid(): Promise<void> {
    const hasError = await this.emailInput.evaluate((el: HTMLInputElement) => 
      el.classList.contains('error') || el.getAttribute('aria-invalid') === 'true'
    );
    if (!hasError) {
      throw new Error('Expected email input to show validation error');
    }
  }

  /**
   * Asserts login button is disabled.
   */
  async assertLoginDisabled(): Promise<void> {
    await this.assertDisabled(this.loginButton);
  }

  /**
   * Asserts login button is enabled.
   */
  async assertLoginEnabled(): Promise<void> {
    await this.assertEnabled(this.loginButton);
  }
}
