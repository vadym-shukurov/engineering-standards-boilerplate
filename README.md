# Engineering Standards Boilerplate

## Production-Grade Code Templates

---

> **"Code is read more often than it is written."**
>
> Battle-tested boilerplate demonstrating enterprise engineering standards for building scalable, maintainable, and testable systems.

---

## Repository Structure

```
engineering-standards-boilerplate/
├── java-backend-standard/           # Java/Spring Boot patterns
│   ├── TransferService.java         # Enterprise service layer
│   ├── TransferServiceTest.java     # Comprehensive unit tests
│   └── README.md
├── typescript-api-standard/         # TypeScript/Node.js patterns
│   ├── ApiClient.ts                 # Type-safe HTTP client
│   ├── ApiClient.test.ts            # Unit test suite
│   └── README.md
├── e2e-playwright-standard/         # Playwright E2E patterns
│   ├── playwright.config.ts         # Multi-browser configuration
│   ├── pages/                       # Page Object Model
│   ├── fixtures/                    # Custom test fixtures
│   ├── tests/                       # Test specifications
│   └── README.md
├── e2e-cypress-standard/            # Cypress E2E patterns
│   ├── cypress.config.ts            # Cypress configuration
│   ├── cypress/pages/               # Page Object Model
│   ├── cypress/support/             # Custom commands & hooks
│   ├── cypress/e2e/                 # Test specifications
│   └── README.md
└── README.md
```

## Standards Demonstrated

| Category | Standard | Implementation |
|:---|:---|:---|
| **Testability** | 100% Mockable | Constructor injection, no static dependencies |
| **Architecture** | SOLID Principles | Single responsibility, dependency inversion |
| **Reliability** | Transaction Safety | SERIALIZABLE isolation for critical operations |
| **Observability** | Full Visibility | Metrics, structured logging, domain events |
| **Resilience** | Fault Tolerance | Retry with exponential backoff, circuit breakers |
| **Security** | Defense in Depth | PII masking, input validation, secure defaults |

## Quick Start

| Module | Language | Focus |
|:---|:---|:---|
| `java-backend-standard/` | Java 21+ / Spring Boot | Service layer patterns |
| `typescript-api-standard/` | TypeScript / Node.js | API client patterns |
| `e2e-playwright-standard/` | TypeScript / Playwright | E2E testing (Playwright) |
| `e2e-cypress-standard/` | TypeScript / Cypress | E2E testing (Cypress) |

## Related Frameworks

- [Engineering Operating System](https://github.com/vadym-shukurov/engineering-operating-system)
- [Service Ownership Model](https://github.com/vadym-shukurov/service-ownership-model)
- [AI Engineering](https://github.com/vadym-shukurov/ai-engineering)

---

**Vadym Shukurov** | Head of Engineering
