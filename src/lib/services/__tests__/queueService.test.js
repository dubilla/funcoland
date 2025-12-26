import { createMockPrisma, resetPrismaMocks } from '../../test/prismaTestUtils';
import prisma from '../../db';
import {
  findNewQueueMatches,
  createGameQueue,
  createGameQueueWithFilters,
} from '../gameService';

jest.mock('../../db', () => require('../../test/prismaTestUtils').createMockPrisma());

describe('Queue Service', () => {
  beforeEach(() => {
    resetPrismaMocks(prisma);
  });

  describe('findNewQueueMatches', () => {
    it('returns empty array when queue not found', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue(null);

      const result = await findNewQueueMatches('nonexistent-queue');

      expect(result).toEqual([]);
      expect(prisma.userGame.findMany).not.toHaveBeenCalled();
    });

    it('returns empty array when queue has no filter tags', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue({
        userId: 'user1',
        filterTags: [],
      });

      const result = await findNewQueueMatches('queue1');

      expect(result).toEqual([]);
      expect(prisma.userGame.findMany).not.toHaveBeenCalled();
    });

    it('finds games with matching tags not in the queue', async () => {
      const queueId = 'queue1';
      prisma.gameQueue.findUnique.mockResolvedValue({
        userId: 'user1',
        filterTags: ['rpg', 'action'],
      });

      const matchingGames = [
        {
          id: 'ug1',
          queueId: null,
          game: { id: 'g1', title: 'Elden Ring' },
          tags: [{ tag: 'rpg' }, { tag: 'action' }],
        },
        {
          id: 'ug2',
          queueId: 'other-queue',
          game: { id: 'g2', title: 'Dark Souls' },
          tags: [{ tag: 'rpg' }, { tag: 'action' }],
        },
      ];
      prisma.userGame.findMany.mockResolvedValue(matchingGames);

      const result = await findNewQueueMatches(queueId);

      expect(result).toEqual(matchingGames);
      expect(prisma.userGame.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          OR: [
            { queueId: null },
            { queueId: { not: queueId } },
          ],
          AND: [
            { tags: { some: { tag: 'rpg' } } },
            { tags: { some: { tag: 'action' } } },
          ],
        },
        include: {
          game: true,
          tags: true,
        },
      });
    });

    it('uses AND logic requiring all filter tags to match', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue({
        userId: 'user1',
        filterTags: ['indie', 'roguelike', 'pixel-art'],
      });
      prisma.userGame.findMany.mockResolvedValue([]);

      await findNewQueueMatches('queue1');

      const callArgs = prisma.userGame.findMany.mock.calls[0][0];
      expect(callArgs.where.AND).toHaveLength(3);
      expect(callArgs.where.AND).toEqual([
        { tags: { some: { tag: 'indie' } } },
        { tags: { some: { tag: 'roguelike' } } },
        { tags: { some: { tag: 'pixel-art' } } },
      ]);
    });

    it('excludes games already in the target queue', async () => {
      const queueId = 'queue1';
      prisma.gameQueue.findUnique.mockResolvedValue({
        userId: 'user1',
        filterTags: ['strategy'],
      });
      prisma.userGame.findMany.mockResolvedValue([]);

      await findNewQueueMatches(queueId);

      const callArgs = prisma.userGame.findMany.mock.calls[0][0];
      expect(callArgs.where.OR).toEqual([
        { queueId: null },
        { queueId: { not: queueId } },
      ]);
    });
  });

  describe('createGameQueue', () => {
    it('throws error when queue name already exists', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue({
        id: 'existing-queue',
        name: 'My Queue',
      });

      await expect(createGameQueue('user1', 'My Queue', 'desc')).rejects.toThrow(
        'Queue with name "My Queue" already exists'
      );
    });

    it('sets first queue as default', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue(null);
      prisma.gameQueue.count.mockResolvedValue(0);
      prisma.gameQueue.create.mockResolvedValue({
        id: 'new-queue',
        name: 'First Queue',
        isDefault: true,
      });

      await createGameQueue('user1', 'First Queue', 'My first queue');

      expect(prisma.gameQueue.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          name: 'First Queue',
          description: 'My first queue',
          isDefault: true,
        },
      });
    });

    it('does not set subsequent queues as default', async () => {
      prisma.gameQueue.findUnique.mockResolvedValue(null);
      prisma.gameQueue.count.mockResolvedValue(2);
      prisma.gameQueue.create.mockResolvedValue({
        id: 'new-queue',
        name: 'Third Queue',
        isDefault: false,
      });

      await createGameQueue('user1', 'Third Queue');

      expect(prisma.gameQueue.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          name: 'Third Queue',
          description: '',
          isDefault: false,
        },
      });
    });
  });

  describe('createGameQueueWithFilters', () => {
    it('normalizes filter tags to lowercase and trims whitespace', async () => {
      prisma.gameQueue.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'new-queue', games: [] });
      prisma.gameQueue.count.mockResolvedValue(0);
      prisma.gameQueue.create.mockResolvedValue({ id: 'new-queue' });
      prisma.userGame.findMany.mockResolvedValue([]);

      await createGameQueueWithFilters('user1', 'RPG Queue', 'desc', ['  RPG  ', 'Action']);

      expect(prisma.gameQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filterTags: ['rpg', 'action'],
        }),
      });
    });

    it('filters out empty tags', async () => {
      prisma.gameQueue.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'new-queue', games: [] });
      prisma.gameQueue.count.mockResolvedValue(0);
      prisma.gameQueue.create.mockResolvedValue({ id: 'new-queue' });
      prisma.userGame.findMany.mockResolvedValue([]);

      await createGameQueueWithFilters('user1', 'Queue', 'desc', ['rpg', '   ', '', 'action']);

      expect(prisma.gameQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filterTags: ['rpg', 'action'],
        }),
      });
    });

    it('adds matching games to queue with positions', async () => {
      prisma.gameQueue.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'new-queue', games: [] });
      prisma.gameQueue.count.mockResolvedValue(0);
      prisma.gameQueue.create.mockResolvedValue({ id: 'new-queue' });

      const matchingGames = [
        { id: 'ug1', game: { title: 'Game 1' } },
        { id: 'ug2', game: { title: 'Game 2' } },
      ];
      prisma.userGame.findMany.mockResolvedValue(matchingGames);
      prisma.userGame.update.mockResolvedValue({});

      await createGameQueueWithFilters('user1', 'RPG Queue', 'desc', ['rpg']);

      expect(prisma.userGame.update).toHaveBeenCalledTimes(2);
      expect(prisma.userGame.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'ug1' },
        data: { queueId: 'new-queue', queuePosition: 0 },
      });
      expect(prisma.userGame.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'ug2' },
        data: { queueId: 'new-queue', queuePosition: 1 },
      });
    });

    it('does not search for games when no filter tags provided', async () => {
      prisma.gameQueue.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'new-queue', games: [] });
      prisma.gameQueue.count.mockResolvedValue(0);
      prisma.gameQueue.create.mockResolvedValue({ id: 'new-queue' });

      await createGameQueueWithFilters('user1', 'Empty Queue', 'desc', []);

      expect(prisma.userGame.findMany).not.toHaveBeenCalled();
      expect(prisma.userGame.update).not.toHaveBeenCalled();
    });
  });
});
