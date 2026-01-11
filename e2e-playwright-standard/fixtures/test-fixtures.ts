/**
 * Custom Test Fixtures
 * 
 * @description Extends Playwright's test fixtures with custom page objects
 * and utilities for cleaner, more maintainable tests.
 * 
 * @benefits
 * - Automatic page object instantiation
 * - Shared authentication state
 * - Custom utilities available in all tests
 * - Type-safe fixture access
 * 
 * @author Vadym Shukurov
 * @since 1.0.0
 */

import { test as base, expect, Page, Locator } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BasePage } from '../pages/BasePage';

// =============================================================================
// TEST DATA TYPES
// =============================================================================

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
}

export interface TestConfig {
  apiBaseUrl: string;
  defaultTimeout: number;
}

// =============================================================================
// FIXTURE TYPES
// =============================================================================

type CustomFixtures = {
  // Page Objects
  loginPage: LoginPage;
  homePage: HomePage;
  dashboardPage: DashboardPage;

  // Test Utilities
  testUser: TestUser;
  adminUser: TestUser;
  apiContext: ApiContext;

  // Helper Functions
  login: (user?: TestUser) => Promise<void>;
  logout: () => Promise<void>;
  resetDatabase: () => Promise<void>;
};

type WorkerFixtures = {
  testConfig: TestConfig;
};

// =============================================================================
// API CONTEXT FOR BACKEND OPERATIONS
// =============================================================================

class ApiContext {
  constructor(private baseUrl: string) {}

  async createUser(user: Partial<TestUser>): Promise<TestUser> {
    const response = await fetch(`${this.baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    return response.json();
  }

  async deleteUser(email: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  }

  async resetTestData(): Promise<void> {
    await fetch(`${this.baseUrl}/api/test/reset`, {
      method: 'POST',
    });
  }

  async seedTestData(scenario: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/test/seed/${scenario}`, {
      method: 'POST',
    });
  }
}

// =============================================================================
// EXTENDED TEST WITH CUSTOM FIXTURES
// =============================================================================

export const test = base.extend<CustomFixtures, WorkerFixtures>({
  // ---------------------------------------------------------------------------
  // Worker-Scoped Fixtures (Shared across all tests in a worker)
  // ---------------------------------------------------------------------------

  testConfig: [
    async ({}, use) => {
      const config: TestConfig = {
        apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
        defaultTimeout: 30000,
      };
      await use(config);
    },
    { scope: 'worker' },
  ],

  // ---------------------------------------------------------------------------
  // Page Object Fixtures
  // ---------------------------------------------------------------------------

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // ---------------------------------------------------------------------------
  // Test Data Fixtures
  // ---------------------------------------------------------------------------

  testUser: async ({}, use) => {
    const user: TestUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'user',
    };
    await use(user);
  },

  adminUser: async ({}, use) => {
    const admin: TestUser = {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      name: 'Admin User',
      role: 'admin',
    };
    await use(admin);
  },

  // ---------------------------------------------------------------------------
  // API Context Fixture
  // ---------------------------------------------------------------------------

  apiContext: async ({ testConfig }, use) => {
    const apiContext = new ApiContext(testConfig.apiBaseUrl);
    await use(apiContext);
  },

  // ---------------------------------------------------------------------------
  // Helper Function Fixtures
  // ---------------------------------------------------------------------------

  login: async ({ page, loginPage, testUser }, use) => {
    const loginFn = async (user: TestUser = testUser) => {
      await loginPage.navigate();
      await loginPage.login(user.email, user.password);
      // Wait for redirect after successful login
      await page.waitForURL(/\/(dashboard|home)/);
    };
    await use(loginFn);
  },

  logout: async ({ page }, use) => {
    const logoutFn = async () => {
      // Click user menu and logout
      await page.getByTestId('user-menu').click();
      await page.getByRole('menuitem', { name: /logout/i }).click();
      // Wait for redirect to login
      await page.waitForURL(/\/login/);
    };
    await use(logoutFn);
  },

  resetDatabase: async ({ apiContext }, use) => {
    const resetFn = async () => {
      await apiContext.resetTestData();
    };
    await use(resetFn);
  },
});

// =============================================================================
// RE-EXPORT EXPECT
// =============================================================================

export { expect };

// =============================================================================
// PAGE OBJECTS (Defined here for single-file completeness)
// =============================================================================

export class HomePage extends BasePage {
  readonly url = '/';
  readonly pageTitle = 'Home';

  private readonly heroTitle: Locator;
  private readonly getStartedButton: Locator;
  private readonly featuresSection: Locator;

  constructor(page: Page) {
    super(page);
    this.heroTitle = page.getByRole('heading', { level: 1 });
    this.getStartedButton = page.getByRole('button', { name: /get started/i });
    this.featuresSection = page.getByTestId('features-section');
  }

  async clickGetStarted(): Promise<void> {
    await this.clickElement(this.getStartedButton);
  }

  async assertHeroVisible(): Promise<void> {
    await this.assertVisible(this.heroTitle);
  }

  async assertFeaturesVisible(): Promise<void> {
    await this.assertVisible(this.featuresSection);
  }
}

export class DashboardPage extends BasePage {
  readonly url = '/dashboard';
  readonly pageTitle = 'Dashboard';

  private readonly welcomeMessage: Locator;
  private readonly statsCards: Locator;
  private readonly activityFeed: Locator;
  private readonly quickActions: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.statsCards = page.getByTestId('stats-cards');
    this.activityFeed = page.getByTestId('activity-feed');
    this.quickActions = page.getByTestId('quick-actions');
  }

  async getWelcomeText(): Promise<string> {
    return await this.getText(this.welcomeMessage);
  }

  async assertDashboardLoaded(): Promise<void> {
    await this.assertVisible(this.welcomeMessage);
    await this.assertVisible(this.statsCards);
  }

  async assertUserWelcomed(name: string): Promise<void> {
    await this.assertText(this.welcomeMessage, new RegExp(name, 'i'));
  }
}
