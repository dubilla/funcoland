/**
 * API route testing utilities
 *
 * Provides helpers for testing Next.js API routes with mocked authentication
 *
 * IMPORTANT: API route tests must use Node environment, not jsdom.
 * Add this comment at the top of your test file:
 *
 *   /**
 *    * @jest-environment node
 *    *​/
 *
 * Usage:
 *
 * import { createMockRequest, mockAuthenticatedSession } from '@/lib/test/apiTestUtils';
 * import { GET } from '@/app/api/user/games/route';
 *
 * // Mock next-auth
 * jest.mock('next-auth', () => ({
 *   getServerSession: jest.fn(),
 * }));
 *
 * // In your test:
 * mockAuthenticatedSession({ id: 'user1', email: 'test@example.com' });
 * const request = createMockRequest('GET');
 * const response = await GET(request);
 * const data = await response.json();
 */

import { getServerSession } from 'next-auth';

/**
 * Creates a mock NextRequest object for testing API routes
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {Object} options - Request options
 * @param {Object} options.body - Request body (for POST/PATCH)
 * @param {Object} options.searchParams - URL search parameters
 * @param {string} options.url - Full URL (defaults to http://localhost:3000/api/test)
 * @returns {Request} Mock Request object
 */
export function createMockRequest(method, options = {}) {
  const { body, searchParams = {}, url = 'http://localhost:3000/api/test' } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  const requestInit = {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  };

  if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(urlObj.toString(), requestInit);
}

/**
 * Mock an authenticated session for API route tests
 * Call this in beforeEach or at the start of a test
 * @param {Object} user - User object to include in session
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.name - User name (optional)
 */
export function mockAuthenticatedSession(user) {
  getServerSession.mockResolvedValue({
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Mock an unauthenticated session (no user logged in)
 * Call this to test 401 responses
 */
export function mockUnauthenticatedSession() {
  getServerSession.mockResolvedValue(null);
}

/**
 * Helper to extract JSON from a NextResponse
 * @param {Response} response - The response from an API route
 * @returns {Promise<Object>} Parsed JSON body
 */
export async function getResponseJson(response) {
  return response.json();
}

/**
 * Assert that a response is an error with expected status and message
 * @param {Response} response - The response from an API route
 * @param {number} expectedStatus - Expected HTTP status code
 * @param {string} expectedError - Expected error message (optional)
 */
export async function expectErrorResponse(response, expectedStatus, expectedError = null) {
  expect(response.status).toBe(expectedStatus);
  const data = await response.json();
  expect(data).toHaveProperty('error');
  if (expectedError) {
    expect(data.error).toBe(expectedError);
  }
  return data;
}
