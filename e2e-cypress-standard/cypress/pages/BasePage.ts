/**
 * Base Page Object
 * 
 * @description Abstract base class providing common functionality for all page objects.
 * Implements the Page Object Model pattern for maintainable Cypress E2E tests.
 * 
 * @principles
 * - DRY: Common methods defined once
 * - Encapsulation: Page internals hidden from tests
 * - Chainable: All methods return Cypress chainable for fluent API
 * - No Waits: Leverage Cypress's built-in retry-ability
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

export abstract class BasePage {
  // ===========================================================================
  // ABSTRACT PROPERTIES (Must be implemented by subclasses)
  // ===========================================================================

  abstract readonly url: string;
  abstract readonly pageTitle: string;

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Navigates to this page's URL.
   * @returns Cypress chainable for further assertions
   */
  visit(): Cypress.Chainable {
    return cy.visit(this.url);
  }

  /**
   * Navigates to this page with query parameters.
   */
  visitWithParams(params: Record<string, string>): Cypress.Chainable {
    const queryString = new URLSearchParams(params).toString();
    return cy.visit(`${this.url}?${queryString}`);
  }

  /**
   * Verifies current URL matches expected URL.
   */
  verifyUrl(): Cypress.Chainable {
    return cy.url().should('include', this.url);
  }

  /**
   * Verifies page title matches expected title.
   */
  verifyTitle(): Cypress.Chainable {
    return cy.title().should('contain', this.pageTitle);
  }

  // ===========================================================================
  // ELEMENT SELECTORS (Protected - for subclasses)
  // ===========================================================================

  /**
   * Gets element by data-testid attribute.
   * Preferred selector strategy for stability.
   */
  protected getByTestId(testId: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`[data-testid="${testId}"]`);
  }

  /**
   * Gets element by data-cy attribute (Cypress convention).
   */
  protected getByCy(selector: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`[data-cy="${selector}"]`);
  }

  /**
   * Gets element by role (accessibility-first).
   */
  protected getByRole(role: string, options?: { name?: string | RegExp }): Cypress.Chainable<JQuery<HTMLElement>> {
    if (options?.name) {
      return cy.get(`[role="${role}"]`).filter(`:contains("${options.name}")`);
    }
    return cy.get(`[role="${role}"]`);
  }

  /**
   * Gets element by label text (for form inputs).
   */
  protected getByLabel(labelText: string | RegExp): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('label', labelText).then(($label) => {
      const forAttr = $label.attr('for');
      if (forAttr) {
        return cy.get(`#${forAttr}`);
      }
      return cy.wrap($label).find('input, select, textarea');
    });
  }

  /**
   * Gets element by placeholder text.
   */
  protected getByPlaceholder(placeholder: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(`[placeholder="${placeholder}"]`);
  }

  // ===========================================================================
  // ELEMENT INTERACTIONS (Protected - for subclasses)
  // ===========================================================================

  /**
   * Clicks an element with automatic scrolling.
   */
  protected clickElement(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.scrollIntoView().click();
  }

  /**
   * Types text into an input with clearing.
   */
  protected typeIntoInput(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    text: string
  ): Cypress.Chainable {
    return selector.clear().type(text);
  }

  /**
   * Types text slowly (for inputs with debounce).
   */
  protected typeSlowly(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    text: string,
    delay = 50
  ): Cypress.Chainable {
    return selector.clear().type(text, { delay });
  }

  /**
   * Selects option from dropdown by value.
   */
  protected selectOption(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    value: string
  ): Cypress.Chainable {
    return selector.select(value);
  }

  /**
   * Checks or unchecks a checkbox.
   */
  protected setCheckbox(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    checked: boolean
  ): Cypress.Chainable {
    return checked ? selector.check() : selector.uncheck();
  }

  /**
   * Hovers over an element.
   */
  protected hoverElement(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.trigger('mouseover');
  }

  // ===========================================================================
  // ASSERTIONS (Protected - for subclasses)
  // ===========================================================================

  /**
   * Asserts element is visible.
   */
  protected assertVisible(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.should('be.visible');
  }

  /**
   * Asserts element is hidden.
   */
  protected assertHidden(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.should('not.be.visible');
  }

  /**
   * Asserts element does not exist in DOM.
   */
  protected assertNotExists(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.should('not.exist');
  }

  /**
   * Asserts element contains text.
   */
  protected assertContainsText(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    text: string | RegExp
  ): Cypress.Chainable {
    return selector.should('contain', text);
  }

  /**
   * Asserts element has exact text.
   */
  protected assertExactText(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    text: string
  ): Cypress.Chainable {
    return selector.should('have.text', text);
  }

  /**
   * Asserts element is enabled.
   */
  protected assertEnabled(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.should('not.be.disabled');
  }

  /**
   * Asserts element is disabled.
   */
  protected assertDisabled(selector: Cypress.Chainable<JQuery<HTMLElement>>): Cypress.Chainable {
    return selector.should('be.disabled');
  }

  /**
   * Asserts input has value.
   */
  protected assertValue(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    value: string
  ): Cypress.Chainable {
    return selector.should('have.value', value);
  }

  /**
   * Asserts element has CSS class.
   */
  protected assertHasClass(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    className: string
  ): Cypress.Chainable {
    return selector.should('have.class', className);
  }

  /**
   * Asserts element has attribute with value.
   */
  protected assertAttribute(
    selector: Cypress.Chainable<JQuery<HTMLElement>>,
    attr: string,
    value?: string
  ): Cypress.Chainable {
    if (value !== undefined) {
      return selector.should('have.attr', attr, value);
    }
    return selector.should('have.attr', attr);
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Takes a screenshot with descriptive name.
   */
  takeScreenshot(name: string): Cypress.Chainable {
    return cy.screenshot(name);
  }

  /**
   * Waits for network to be idle.
   */
  waitForNetworkIdle(): Cypress.Chainable {
    return cy.intercept('**/*').as('allRequests');
  }

  /**
   * Waits for a specific API response.
   */
  waitForApi(alias: string): Cypress.Chainable {
    return cy.wait(`@${alias}`);
  }

  /**
   * Scrolls to top of page.
   */
  scrollToTop(): Cypress.Chainable {
    return cy.scrollTo('top');
  }

  /**
   * Scrolls to bottom of page.
   */
  scrollToBottom(): Cypress.Chainable {
    return cy.scrollTo('bottom');
  }

  /**
   * Reloads the page.
   */
  reload(): Cypress.Chainable {
    return cy.reload();
  }

  /**
   * Gets current URL.
   */
  getCurrentUrl(): Cypress.Chainable<string> {
    return cy.url();
  }

  /**
   * Logs message to Cypress command log.
   */
  log(message: string): Cypress.Chainable {
    return cy.log(message);
  }
}
