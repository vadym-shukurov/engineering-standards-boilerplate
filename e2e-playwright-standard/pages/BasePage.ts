/**
 * Base Page Object
 * 
 * @description Abstract base class providing common functionality for all page objects.
 * Implements the Page Object Model pattern for maintainable E2E tests.
 * 
 * @principles
 * - DRY: Common methods defined once
 * - Encapsulation: Page internals hidden from tests
 * - Fluent Interface: Chainable methods for readability
 * - Wait Strategies: Smart waits instead of arbitrary delays
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  // ===========================================================================
  // PROPERTIES
  // ===========================================================================

  protected readonly page: Page;
  abstract readonly url: string;
  abstract readonly pageTitle: string;

  // ===========================================================================
  // CONSTRUCTOR
  // ===========================================================================

  constructor(page: Page) {
    this.page = page;
  }

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Navigates to this page's URL.
   * @returns This page instance for chaining
   */
  async navigate(): Promise<this> {
    await this.page.goto(this.url);
    await this.waitForPageLoad();
    return this;
  }

  /**
   * Waits for page to be fully loaded.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Verifies current URL matches expected URL.
   */
  async verifyUrl(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.url));
  }

  /**
   * Verifies page title matches expected title.
   */
  async verifyTitle(): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(this.pageTitle));
  }

  // ===========================================================================
  // ELEMENT INTERACTIONS (Protected - for subclasses)
  // ===========================================================================

  /**
   * Clicks an element with automatic wait and retry.
   */
  protected async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /**
   * Fills an input field with automatic clearing.
   */
  protected async fillInput(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(text);
  }

  /**
   * Types text with realistic delays (for fields with debounce).
   */
  protected async typeText(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.pressSequentially(text, { delay: 50 });
  }

  /**
   * Selects option from dropdown by value.
   */
  protected async selectOption(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  /**
   * Checks or unchecks a checkbox.
   */
  protected async setCheckbox(locator: Locator, checked: boolean): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.setChecked(checked);
  }

  /**
   * Hovers over an element.
   */
  protected async hoverElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.hover();
  }

  /**
   * Gets text content from element.
   */
  protected async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) ?? '';
  }

  /**
   * Gets input value from element.
   */
  protected async getInputValue(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return await locator.inputValue();
  }

  // ===========================================================================
  // ASSERTIONS (Protected - for subclasses)
  // ===========================================================================

  /**
   * Asserts element is visible.
   */
  protected async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  /**
   * Asserts element is hidden.
   */
  protected async assertHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden();
  }

  /**
   * Asserts element contains text.
   */
  protected async assertText(locator: Locator, text: string | RegExp): Promise<void> {
    await expect(locator).toContainText(text);
  }

  /**
   * Asserts element has exact text.
   */
  protected async assertExactText(locator: Locator, text: string): Promise<void> {
    await expect(locator).toHaveText(text);
  }

  /**
   * Asserts element is enabled.
   */
  protected async assertEnabled(locator: Locator): Promise<void> {
    await expect(locator).toBeEnabled();
  }

  /**
   * Asserts element is disabled.
   */
  protected async assertDisabled(locator: Locator): Promise<void> {
    await expect(locator).toBeDisabled();
  }

  /**
   * Asserts input has value.
   */
  protected async assertValue(locator: Locator, value: string | RegExp): Promise<void> {
    await expect(locator).toHaveValue(value);
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Takes a screenshot with descriptive name.
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Waits for network to be idle.
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Waits for a specific API response.
   */
  async waitForApiResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Scrolls element into view.
   */
  protected async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Gets current page URL.
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Reloads the page.
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }
}
