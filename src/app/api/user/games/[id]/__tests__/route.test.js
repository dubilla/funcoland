/**
 * @jest-environment node
 */
import { PATCH } from '../route';
import {
  createMockRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  expectErrorResponse,
} from '@/lib/test/apiTestUtils';
import { resetPrismaMocks } from '@/lib/test/prismaTestUtils';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => require('@/lib/test/prismaTestUtils').createMockPrisma());

jest.mock('@/lib/services/gameService', () => ({
  updateGameProgress: jest.fn(),
  transitionUserGameState: jest.fn(),
  isValidTransition: jest.fn(() => true),
  getValidTransitions: jest.fn(() => []),
}));

const mockUser = { id: 'user1', email: 'test@example.com' };
const mockParams = { params: { id: 'ug1' } };

const mockFullUserGame = {
  id: 'ug1',
  userId: 'user1',
  status: 'BACKLOG',
  game: { id: 'g1', title: 'Test Game' },
  queue: null,
  tags: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMocks(prisma);
});

describe('PATCH /api/user/games/[id] — queueId assignment', () => {
  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession();

    const request = createMockRequest('PATCH', {
      body: { queueId: 'q1' },
    });
    const response = await PATCH(request, mockParams);

    await expectErrorResponse(response, 401, 'Not authenticated');
  });

  it('assigns game to queue with correct position', async () => {
    mockAuthenticatedSession(mockUser);

    // Game belongs to user
    prisma.userGame.findUnique
      .mockResolvedValueOnce({ userId: 'user1', status: 'BACKLOG' })
      .mockResolvedValueOnce({ ...mockFullUserGame, queue: { id: 'q1', name: 'My Queue' }, queueId: 'q1' });

    // Queue belongs to user, has 3 existing games
    prisma.gameQueue.findUnique.mockResolvedValue({
      userId: 'user1',
      _count: { games: 3 },
    });

    prisma.userGame.update.mockResolvedValue({});

    const request = createMockRequest('PATCH', {
      body: { queueId: 'q1' },
    });
    const response = await PATCH(request, mockParams);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.userGame.queue).toEqual({ id: 'q1', name: 'My Queue' });

    // Should set position to next slot (3 + 1 = 4)
    expect(prisma.userGame.update).toHaveBeenCalledWith({
      where: { id: 'ug1' },
      data: expect.objectContaining({
        queueId: 'q1',
        queuePosition: 4,
      }),
    });
  });

  it('unassigns game from queue when queueId is null', async () => {
    mockAuthenticatedSession(mockUser);

    prisma.userGame.findUnique
      .mockResolvedValueOnce({ userId: 'user1', status: 'BACKLOG' })
      .mockResolvedValueOnce({ ...mockFullUserGame });

    prisma.userGame.update.mockResolvedValue({});

    const request = createMockRequest('PATCH', {
      body: { queueId: null },
    });
    const response = await PATCH(request, mockParams);

    expect(response.status).toBe(200);

    expect(prisma.userGame.update).toHaveBeenCalledWith({
      where: { id: 'ug1' },
      data: expect.objectContaining({
        queueId: null,
        queuePosition: null,
      }),
    });
  });

  it('returns 404 when queue does not exist', async () => {
    mockAuthenticatedSession(mockUser);

    prisma.userGame.findUnique.mockResolvedValueOnce({ userId: 'user1', status: 'BACKLOG' });
    prisma.gameQueue.findUnique.mockResolvedValue(null);

    const request = createMockRequest('PATCH', {
      body: { queueId: 'nonexistent' },
    });
    const response = await PATCH(request, mockParams);

    await expectErrorResponse(response, 404, 'Queue not found');
    expect(prisma.userGame.update).not.toHaveBeenCalled();
  });

  it('returns 404 when queue belongs to another user', async () => {
    mockAuthenticatedSession(mockUser);

    prisma.userGame.findUnique.mockResolvedValueOnce({ userId: 'user1', status: 'BACKLOG' });
    prisma.gameQueue.findUnique.mockResolvedValue({
      userId: 'other-user',
      _count: { games: 2 },
    });

    const request = createMockRequest('PATCH', {
      body: { queueId: 'q-other' },
    });
    const response = await PATCH(request, mockParams);

    await expectErrorResponse(response, 404, 'Queue not found');
    expect(prisma.userGame.update).not.toHaveBeenCalled();
  });
});
