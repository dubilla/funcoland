/**
 * @jest-environment node
 */
import { GET } from '../route';
import {
  createMockRequest,
  mockAuthenticatedSession,
  mockUnauthenticatedSession,
  expectErrorResponse,
} from '@/lib/test/apiTestUtils';
import { createMockPrisma, resetPrismaMocks } from '@/lib/test/prismaTestUtils';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/db', () => require('@/lib/test/prismaTestUtils').createMockPrisma());

jest.mock('@/lib/services/gameService', () => ({
  findNewQueueMatches: jest.fn(),
}));

import { findNewQueueMatches } from '@/lib/services/gameService';

describe('GET /api/user/queues/[id]/matches', () => {
  const mockUser = { id: 'user1', email: 'test@example.com' };
  const mockParams = { params: { id: 'queue1' } };

  beforeEach(() => {
    jest.clearAllMocks();
    resetPrismaMocks(prisma);
  });

  it('returns 401 when not authenticated', async () => {
    mockUnauthenticatedSession();

    const request = createMockRequest('GET');
    const response = await GET(request, mockParams);

    await expectErrorResponse(response, 401, 'Not authenticated');
    expect(prisma.gameQueue.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 when queue does not exist', async () => {
    mockAuthenticatedSession(mockUser);
    prisma.gameQueue.findUnique.mockResolvedValue(null);

    const request = createMockRequest('GET');
    const response = await GET(request, mockParams);

    await expectErrorResponse(response, 404, 'Queue not found');
  });

  it('returns 403 when queue belongs to another user', async () => {
    mockAuthenticatedSession(mockUser);
    prisma.gameQueue.findUnique.mockResolvedValue({
      id: 'queue1',
      userId: 'other-user',
    });

    const request = createMockRequest('GET');
    const response = await GET(request, mockParams);

    await expectErrorResponse(response, 403, 'Not authorized');
    expect(findNewQueueMatches).not.toHaveBeenCalled();
  });

  it('returns matching games for authorized user', async () => {
    mockAuthenticatedSession(mockUser);
    prisma.gameQueue.findUnique.mockResolvedValue({
      id: 'queue1',
      userId: mockUser.id,
    });

    const mockMatches = [
      { id: 'ug1', game: { title: 'Game 1' }, tags: [{ tag: 'rpg' }] },
      { id: 'ug2', game: { title: 'Game 2' }, tags: [{ tag: 'rpg' }] },
    ];
    findNewQueueMatches.mockResolvedValue(mockMatches);

    const request = createMockRequest('GET');
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ matches: mockMatches });
    expect(findNewQueueMatches).toHaveBeenCalledWith('queue1');
  });

  it('returns empty array when no matches found', async () => {
    mockAuthenticatedSession(mockUser);
    prisma.gameQueue.findUnique.mockResolvedValue({
      id: 'queue1',
      userId: mockUser.id,
    });
    findNewQueueMatches.mockResolvedValue([]);

    const request = createMockRequest('GET');
    const response = await GET(request, mockParams);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ matches: [] });
  });
});
