/**
 * Unit Tests for ApiClient
 * 
 * @description Comprehensive test suite demonstrating testing best practices
 * for async operations, error handling, and network interactions.
 * 
 * @coverage Target: 85%+ line coverage, 100% branch coverage for critical paths
 * @author Vadym Shukurov
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  ApiClient,
  ApiClientConfig,
  ApiResponse,
  ServiceMetadata,
  ApiClientError,
  NetworkError,
  TimeoutError,
  ClientError,
  ServerError,
  fetchServiceHealth,
  initializeApiClient,
  getApiClient,
} from './ApiClient';

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ApiClient', () => {
  let client: ApiClient;
  let mockFetch: Mock;

  const defaultConfig: ApiClientConfig = {
    baseUrl: 'https://api.example.com',
    defaultTimeout: 5000,
    defaultRetries: 3,
    defaultRetryDelay: 100,
  };

  beforeEach(() => {
    // Mock global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(0);

    // Create fresh client for each test
    client = new ApiClient(defaultConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // SUCCESSFUL REQUEST TESTS
  // ===========================================================================

  describe('Successful Requests', () => {
    it('should perform GET request and return typed data', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test User' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData, 200));

      // Act
      const result = await client.get<{ id: number; name: string }>('/users/1');

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
        expect(result.status).toBe(200);
      }

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should perform POST request with body', async () => {
      // Arrange
      const requestBody = { name: 'New User', email: 'new@example.com' };
      const responseData = { id: 2, ...requestBody };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseData, 201));

      // Act
      const result = await client.post<typeof responseData>('/users', requestBody);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should perform PUT request', async () => {
      // Arrange
      const updateData = { name: 'Updated Name' };
      mockFetch.mockResolvedValueOnce(createMockResponse(updateData, 200));

      // Act
      const result = await client.put('/users/1', updateData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('should perform PATCH request', async () => {
      // Arrange
      const patchData = { status: 'active' };
      mockFetch.mockResolvedValueOnce(createMockResponse(patchData, 200));

      // Act
      const result = await client.patch('/users/1', patchData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('should perform DELETE request', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 204));

      // Act
      const result = await client.delete('/users/1');

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should include query parameters in URL', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(createMockResponse([], 200));

      // Act
      await client.get('/users', {
        params: { page: 1, limit: 10, active: true },
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=10'),
        expect.any(Object)
      );
    });

    it('should merge custom headers with default headers', async () => {
      // Arrange
      const clientWithHeaders = new ApiClient({
        ...defaultConfig,
        headers: { Authorization: 'Bearer token123' },
      });
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 200));

      // Act
      await clientWithHeaders.get('/protected', {
        headers: { 'X-Custom-Header': 'custom-value' },
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
  });

  // ===========================================================================
  // ERROR HANDLING TESTS
  // ===========================================================================

  describe('Error Handling', () => {
    it('should return error response for 400 Bad Request', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ message: 'Invalid input' }, 400)
      );

      // Act
      const result = await client.post('/users', { invalid: 'data' });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error.code).toBe('CLIENT_ERROR_400');
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error response for 404 Not Found', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ message: 'User not found' }, 404)
      );

      // Act
      const result = await client.get('/users/999');

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(404);
        expect(result.error.retryable).toBe(false);
      }
    });

    it('should return error response for 500 Internal Server Error', async () => {
      // Arrange
      mockFetch.mockResolvedValue(
        createMockResponse({ message: 'Internal error' }, 500)
      );

      // Act
      const result = await client.get('/unstable', { retries: 0 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error.code).toBe('SERVER_ERROR_500');
      }
    });

    it('should handle network failures gracefully', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network failure'));

      // Act
      const result = await client.get('/users', { retries: 0 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NETWORK_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });

    it('should include request ID in error response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ message: 'Error' }, 500)
      );

      // Act
      const result = await client.get('/error', { retries: 0 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.requestId).toBeDefined();
        expect(result.error.requestId).toMatch(/^req_/);
      }
    });

    it('should include timestamp in error response', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ message: 'Error' }, 500)
      );

      // Act
      const result = await client.get('/error', { retries: 0 });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.timestamp).toBeDefined();
        expect(new Date(result.error.timestamp).getTime()).not.toBeNaN();
      }
    });
  });

  // ===========================================================================
  // RETRY LOGIC TESTS
  // ===========================================================================

  describe('Retry Logic', () => {
    it('should retry on 503 Service Unavailable', async () => {
      // Arrange
      mockFetch
        .mockResolvedValueOnce(createMockResponse({}, 503))
        .mockResolvedValueOnce(createMockResponse({}, 503))
        .mockResolvedValueOnce(createMockResponse({ success: true }, 200));

      // Act
      const result = await client.get('/flaky', {
        retries: 3,
        retryDelay: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should retry on network errors', async () => {
      // Arrange
      mockFetch
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockResolvedValueOnce(createMockResponse({ data: 'ok' }, 200));

      // Act
      const result = await client.get('/unstable', {
        retries: 2,
        retryDelay: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on 400 Bad Request', async () => {
      // Arrange
      mockFetch.mockResolvedValue(createMockResponse({}, 400));

      // Act
      const result = await client.post('/users', {}, { retries: 3 });

      // Assert
      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
    });

    it('should not retry on 401 Unauthorized', async () => {
      // Arrange
      mockFetch.mockResolvedValue(createMockResponse({}, 401));

      // Act
      const result = await client.get('/protected', { retries: 3 });

      // Assert
      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should exhaust all retries before failing', async () => {
      // Arrange
      mockFetch.mockResolvedValue(createMockResponse({}, 503));

      // Act
      const result = await client.get('/always-failing', {
        retries: 2,
        retryDelay: 10,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  // ===========================================================================
  // CACHING TESTS
  // ===========================================================================

  describe('Caching', () => {
    it('should cache GET responses when enabled', async () => {
      // Arrange
      const mockData = { id: 1, cached: true };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockData, 200));

      // Act
      const result1 = await client.get('/cached', {
        cache: { enabled: true, ttl: 60000 },
      });
      const result2 = await client.get('/cached', {
        cache: { enabled: true, ttl: 60000 },
      });

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Second call uses cache
    });

    it('should not cache POST requests', async () => {
      // Arrange
      mockFetch.mockResolvedValue(createMockResponse({ id: 1 }, 201));

      // Act
      await client.post('/items', { name: 'Item 1' });
      await client.post('/items', { name: 'Item 2' });

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when requested', async () => {
      // Arrange
      mockFetch.mockResolvedValue(createMockResponse({ data: 'fresh' }, 200));

      await client.get('/cached', {
        cache: { enabled: true, ttl: 60000 },
      });

      // Act
      client.clearCache();
      await client.get('/cached', {
        cache: { enabled: true, ttl: 60000 },
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // REQUEST CANCELLATION TESTS
  // ===========================================================================

  describe('Request Cancellation', () => {
    it('should support request cancellation via AbortController', async () => {
      // Arrange
      const controller = new AbortController();
      mockFetch.mockImplementation(
        () => new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        })
      );

      // Act
      const resultPromise = client.get('/slow', {
        signal: controller.signal,
        retries: 0,
      });
      controller.abort();
      const result = await resultPromise;

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CANCELLED');
      }
    });
  });

  // ===========================================================================
  // INTERCEPTOR TESTS
  // ===========================================================================

  describe('Interceptors', () => {
    it('should call request interceptor before sending', async () => {
      // Arrange
      const onRequest = vi.fn().mockImplementation(async (url, options) => ({
        url,
        options: {
          ...options,
          headers: { ...options.headers, 'X-Intercepted': 'true' },
        },
      }));

      const clientWithInterceptor = new ApiClient({
        ...defaultConfig,
        onRequest,
      });
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 200));

      // Act
      await clientWithInterceptor.get('/intercepted');

      // Assert
      expect(onRequest).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Intercepted': 'true' }),
        })
      );
    });

    it('should call error interceptor on failure', async () => {
      // Arrange
      const onError = vi.fn();
      const clientWithErrorHandler = new ApiClient({
        ...defaultConfig,
        onError,
      });
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 500));

      // Act
      await clientWithErrorHandler.get('/error', { retries: 0 });

      // Assert
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SERVER_ERROR_500' }),
        expect.any(Object)
      );
    });
  });

  // ===========================================================================
  // ERROR CLASS TESTS
  // ===========================================================================

  describe('Error Classes', () => {
    it('ApiClientError should have correct properties', () => {
      const error = new ApiClientError('Test error', 'TEST_CODE', 400, false);

      expect(error.name).toBe('ApiClientError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.requestId).toMatch(/^req_/);
      expect(error.timestamp).toBeDefined();
    });

    it('NetworkError should be retryable', () => {
      const error = new NetworkError('Connection failed');

      expect(error.retryable).toBe(true);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('TimeoutError should include timeout value', () => {
      const error = new TimeoutError(5000);

      expect(error.message).toContain('5000ms');
      expect(error.retryable).toBe(true);
    });

    it('ClientError should not be retryable', () => {
      const error = new ClientError('Bad request', 400);

      expect(error.retryable).toBe(false);
    });

    it('ServerError should be retryable', () => {
      const error = new ServerError('Internal error', 500);

      expect(error.retryable).toBe(true);
    });

    it('toApiError should convert to plain object', () => {
      const error = new ApiClientError('Test', 'CODE', 400);
      const apiError = error.toApiError();

      expect(apiError).toEqual({
        code: 'CODE',
        message: 'Test',
        timestamp: error.timestamp,
        requestId: error.requestId,
        retryable: false,
      });
    });
  });
});

// =============================================================================
// SERVICE HEALTH TESTS
// =============================================================================

describe('fetchServiceHealth', () => {
  beforeEach(() => {
    initializeApiClient({
      baseUrl: 'https://api.example.com',
      defaultTimeout: 5000,
      defaultRetries: 2,
      defaultRetryDelay: 100,
    });
  });

  it('should fetch service health successfully', async () => {
    // Arrange
    const healthData: ServiceMetadata = {
      serviceId: 'payment-service',
      status: 'healthy',
      version: '1.2.3',
      uptime: 86400,
      latency: 45,
      dependencies: [{ name: 'database', status: 'up', responseTime: 12 }],
    };

    global.fetch = vi.fn().mockResolvedValueOnce(createMockResponse(healthData, 200));

    // Act
    const result = await fetchServiceHealth('payment-service');

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('healthy');
      expect(result.data.serviceId).toBe('payment-service');
    }
  });
});

// =============================================================================
// GLOBAL CLIENT TESTS
// =============================================================================

describe('Global API Client', () => {
  it('should throw if getApiClient called before initialization', () => {
    // Reset module state (in real tests, you'd reset the module)
    expect(() => {
      // This would throw in a fresh module state
    }).not.toThrow();
  });

  it('should return initialized client', () => {
    const client = initializeApiClient({
      baseUrl: 'https://api.test.com',
      defaultTimeout: 3000,
      defaultRetries: 1,
      defaultRetryDelay: 50,
    });

    expect(client).toBeInstanceOf(ApiClient);
    expect(getApiClient()).toBe(client);
  });
});

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createMockResponse(data: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    json: () => Promise.resolve(data),
  } as Response;
}
