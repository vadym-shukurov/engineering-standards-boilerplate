# E2E Cypress Standard

## Enterprise-Grade End-to-End Testing with Cypress

---

## Overview

Production-ready E2E testing framework using Cypress, following enterprise best practices for maintainable, reliable, and scalable test automation.

## Structure

```
e2e-cypress-standard/
├── cypress.config.ts              # Cypress configuration
├── cypress/
│   ├── e2e/                       # Test specifications
│   │   └── auth/
│   │       └── login.cy.ts        # Login flow tests
│   ├── pages/                     # Page Object Model
│   │   ├── BasePage.ts            # Abstract base class
│   │   └── LoginPage.ts           # Login page object
│   ├── support/
│   │   ├── commands.ts            # Custom commands
│   │   └── e2e.ts                 # Global hooks & config
│   └── fixtures/                  # Test data
│       └── users.json
└── README.md
```

## Key Patterns

### 1. Page Object Model (POM)

```typescript
// Clean, chainable API
loginPage
  .enterEmail('user@example.com')
  .enterPassword('password')
  .clickLogin();
```

### 2. Custom Commands

```typescript
// Reusable authentication
cy.loginViaApi(); // Fast API login
cy.login(email, password); // UI login
cy.getByTestId('element'); // Stable selectors
```

### 3. Test Categories

| Category | Coverage |
|:---|:---|
| Happy Path | Successful login flow |
| Validation | Empty/invalid inputs |
| Error Handling | API errors, timeouts |
| Accessibility | Keyboard nav, ARIA |
| Responsive | Mobile, tablet, desktop |
| Performance | Load times |
| Security | Password masking |

## Best Practices Demonstrated

| Practice | Implementation |
|:---|:---|
| **Stable Selectors** | `data-testid`, `data-cy` attributes |
| **No Arbitrary Waits** | Cypress retry-ability |
| **API Stubbing** | `cy.intercept()` for isolation |
| **Test Isolation** | Clear cookies/storage per test |
| **CI/CD Ready** | Retries, screenshots, video |
| **Type Safety** | Full TypeScript support |

## Running Tests

```bash
# Interactive mode
npx cypress open

# Headless mode
npx cypress run

# Specific spec
npx cypress run --spec "cypress/e2e/auth/login.cy.ts"

# Specific browser
npx cypress run --browser chrome
```

## Environment Variables

```bash
CYPRESS_BASE_URL=http://localhost:3000
CYPRESS_API_URL=http://localhost:3001/api
CYPRESS_TEST_USER_EMAIL=test@example.com
CYPRESS_TEST_USER_PASSWORD=TestPassword123!
```

---

**Engineering Standards Boilerplate** | Vadym Shukurov
