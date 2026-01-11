# Engineering Standards Boilerplate

## Production-Grade Code Templates

---

> **"Code is read more often than it is written."**

Battle-tested boilerplate demonstrating enterprise engineering standards for building scalable, maintainable, and testable systems.

---

## Repository Structure

```
engineering-standards-boilerplate/
│
├── java-backend-standard/           # Java 21+ / Spring Boot
│   ├── TransferService.java         # Service layer with DI, transactions, metrics
│   ├── TransferServiceTest.java     # BDD-style unit tests (85%+ coverage)
│   └── README.md
│
├── typescript-api-standard/         # TypeScript / Node.js
│   ├── ApiClient.ts                 # Type-safe HTTP client with retry, caching
│   ├── ApiClient.test.ts            # Vitest unit test suite
│   └── README.md
│
├── e2e-playwright-standard/         # Playwright E2E Testing
│   ├── playwright.config.ts         # Multi-browser, CI-optimized config
│   ├── pages/                       # Page Object Model (BasePage + LoginPage)
│   ├── fixtures/                    # Custom test fixtures with DI
│   ├── tests/                       # Test specifications
│   └── README.md
│
├── e2e-cypress-standard/            # Cypress E2E Testing
│   ├── cypress.config.ts            # Enterprise Cypress configuration
│   ├── cypress/pages/               # Page Object Model
│   ├── cypress/support/             # Custom commands & global hooks
│   ├── cypress/e2e/                 # Test specifications
│   └── README.md
│
└── README.md
```

## Standards Demonstrated

| Category | Standard | Implementation |
|:---|:---|:---|
| **Testability** | 100% Mockable | Constructor injection, no static dependencies |
| **Architecture** | SOLID Principles | Single responsibility, dependency inversion |
| **Reliability** | Transaction Safety | SERIALIZABLE isolation for critical operations |
| **Observability** | Full Visibility | Metrics, structured logging, domain events |
| **Resilience** | Fault Tolerance | Retry with exponential backoff |
| **Security** | Defense in Depth | PII masking, input validation, secure defaults |

## Module Overview

| Module | Language | Key Patterns |
|:---|:---|:---|
| `java-backend-standard/` | Java 21+ / Spring Boot | DI, @Transactional, Micrometer, Event Publishing |
| `typescript-api-standard/` | TypeScript | Generics, Retry Logic, Caching, Custom Errors |
| `e2e-playwright-standard/` | Playwright | Page Objects, Custom Fixtures, Multi-browser |
| `e2e-cypress-standard/` | Cypress | Custom Commands, API Stubbing, Visual Testing |

## Test Coverage Targets

| Type | Target | Approach |
|:---|:---:|:---|
| Unit Tests | 85%+ | Mocked dependencies, BDD-style assertions |
| Integration | 100% API | Contract testing, database isolation |
| E2E | Critical Paths | Happy path, errors, accessibility, performance |

## Related Repositories

| Repository | Description |
|:---|:---|
| [Engineering Operating System](https://github.com/vadym-shukurov/engineering-operating-system) | Strategic engineering framework |
| [Service Ownership Model](https://github.com/vadym-shukurov/service-ownership-model) | Ownership charter and RACI |
| [AI Engineering](https://github.com/vadym-shukurov/ai-engineering) | AI-assisted SDLC governance |

---

**Vadym Shukurov** | Head of Engineering
