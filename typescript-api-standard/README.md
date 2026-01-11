# TypeScript API Standard

## Enterprise-Grade HTTP Client

---

## Overview

Production-ready API client demonstrating TypeScript best practices for type-safe HTTP communication with comprehensive error handling, retry logic, and observability.

## Files

| File | Purpose |
|:---|:---|
| `ApiClient.ts` | Full-featured HTTP client implementation |
| `ApiClient.test.ts` | Comprehensive unit test suite |

## Key Features

### 1. Type-Safe Responses

Discriminated union pattern ensures compile-time safety:

```typescript
const result = await client.get<User>('/users/1');
if (result.success) {
  console.log(result.data.name); // Type-safe access
}
```

### 2. Automatic Retry with Backoff

Exponential backoff with jitter for transient failures.

### 3. Request Caching & Deduplication

In-memory cache with TTL, automatic deduplication of concurrent requests.

### 4. Custom Error Classes

- `NetworkError` - Connection failures
- `TimeoutError` - Request timeouts
- `ClientError` - 4xx responses
- `ServerError` - 5xx responses

### 5. Interceptors

Request/response interceptors for auth, logging, transformation.

### 6. Observability

Structured logging, metrics collection, request tracing.

## Test Coverage: 85%+ Target

- HTTP method tests (GET, POST, PUT, PATCH, DELETE)
- Error handling tests
- Retry logic tests
- Caching tests
- Request cancellation tests
- Interceptor tests

---

**Engineering Standards Boilerplate** | Vadym Shukurov
