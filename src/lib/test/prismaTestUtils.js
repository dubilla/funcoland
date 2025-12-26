/**
 * Prisma test utilities for mocking database operations
 *
 * Usage in test files:
 *
 * import { createMockPrisma, mockPrismaMethod } from '@/lib/test/prismaTestUtils';
 *
 * // Option 1: Create a full mock (usually in jest.mock)
 * jest.mock('@/lib/db', () => createMockPrisma());
 *
 * // Option 2: Import the mock and configure per-test
 * import prisma from '@/lib/db';
 * mockPrismaMethod(prisma.user, 'findUnique', { id: '1', email: 'test@example.com' });
 */

/**
 * Creates a mock Prisma client with common models and methods
 * Each method is a jest.fn() that can be configured per-test
 */
export function createMockPrisma() {
  const createModelMock = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  });

  return {
    user: createModelMock(),
    game: createModelMock(),
    userGame: createModelMock(),
    userGameTag: createModelMock(),
    gameQueue: createModelMock(),
    session: createModelMock(),
    account: createModelMock(),
    $transaction: jest.fn((callback) => callback()),
  };
}

/**
 * Helper to set up a mock return value for a Prisma method
 * @param {Object} model - The Prisma model mock (e.g., prisma.user)
 * @param {string} method - The method name (e.g., 'findUnique')
 * @param {*} returnValue - The value to return (will be wrapped in Promise.resolve)
 */
export function mockPrismaMethod(model, method, returnValue) {
  model[method].mockResolvedValue(returnValue);
}

/**
 * Helper to set up a mock rejection for a Prisma method
 * @param {Object} model - The Prisma model mock (e.g., prisma.user)
 * @param {string} method - The method name (e.g., 'findUnique')
 * @param {Error} error - The error to throw
 */
export function mockPrismaError(model, method, error) {
  model[method].mockRejectedValue(error);
}

/**
 * Resets all mocks on a Prisma client
 * Useful in beforeEach() to clear state between tests
 * @param {Object} prisma - The mocked Prisma client
 */
export function resetPrismaMocks(prisma) {
  const models = ['user', 'game', 'userGame', 'userGameTag', 'gameQueue', 'session', 'account'];
  const methods = ['findUnique', 'findFirst', 'findMany', 'create', 'update', 'delete', 'deleteMany', 'count', 'upsert'];

  for (const model of models) {
    if (prisma[model]) {
      for (const method of methods) {
        if (prisma[model][method]) {
          prisma[model][method].mockReset();
        }
      }
    }
  }

  if (prisma.$transaction) {
    prisma.$transaction.mockReset();
  }
}
