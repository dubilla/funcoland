import prisma from '../../db';
import {
  addTagToUserGame,
  removeTagFromUserGame,
  getTagsForUserGame,
  getAllUserTags,
  findUserGamesByTags,
} from '../gameService';

// Mock Prisma
jest.mock('../../db', () => ({
  userGameTag: {
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  userGame: {
    findMany: jest.fn(),
  },
}));

describe('Tag Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addTagToUserGame', () => {
    it('normalizes tag to lowercase and trims whitespace', async () => {
      prisma.userGameTag.create.mockResolvedValue({
        id: 'tag1',
        userGameId: 'ug1',
        tag: 'rpg',
      });

      await addTagToUserGame('ug1', '  RPG  ');

      expect(prisma.userGameTag.create).toHaveBeenCalledWith({
        data: {
          userGameId: 'ug1',
          tag: 'rpg',
        },
      });
    });

    it('throws error for empty tag', async () => {
      await expect(addTagToUserGame('ug1', '   ')).rejects.toThrow('Tag cannot be empty');
    });
  });

  describe('removeTagFromUserGame', () => {
    it('normalizes tag when deleting', async () => {
      prisma.userGameTag.delete.mockResolvedValue({
        id: 'tag1',
        userGameId: 'ug1',
        tag: 'rpg',
      });

      await removeTagFromUserGame('ug1', '  RPG  ');

      expect(prisma.userGameTag.delete).toHaveBeenCalledWith({
        where: {
          userGameId_tag: {
            userGameId: 'ug1',
            tag: 'rpg',
          },
        },
      });
    });
  });

  describe('getTagsForUserGame', () => {
    it('returns array of tag strings', async () => {
      prisma.userGameTag.findMany.mockResolvedValue([
        { tag: 'action' },
        { tag: 'indie' },
        { tag: 'roguelike' },
      ]);

      const tags = await getTagsForUserGame('ug1');

      expect(tags).toEqual(['action', 'indie', 'roguelike']);
      expect(prisma.userGameTag.findMany).toHaveBeenCalledWith({
        where: { userGameId: 'ug1' },
        select: { tag: true },
        orderBy: { tag: 'asc' },
      });
    });

    it('returns empty array when no tags exist', async () => {
      prisma.userGameTag.findMany.mockResolvedValue([]);

      const tags = await getTagsForUserGame('ug1');

      expect(tags).toEqual([]);
    });
  });

  describe('getAllUserTags', () => {
    it('returns unique tags across all user games', async () => {
      prisma.userGameTag.findMany.mockResolvedValue([
        { tag: 'action' },
        { tag: 'indie' },
        { tag: 'rpg' },
      ]);

      const tags = await getAllUserTags('user1');

      expect(tags).toEqual(['action', 'indie', 'rpg']);
      expect(prisma.userGameTag.findMany).toHaveBeenCalledWith({
        where: {
          userGame: {
            userId: 'user1',
          },
        },
        distinct: ['tag'],
        select: { tag: true },
        orderBy: { tag: 'asc' },
      });
    });
  });

  describe('findUserGamesByTags', () => {
    it('returns empty array for empty tags', async () => {
      const result = await findUserGamesByTags('user1', []);

      expect(result).toEqual([]);
      expect(prisma.userGame.findMany).not.toHaveBeenCalled();
    });

    it('returns empty array for null tags', async () => {
      const result = await findUserGamesByTags('user1', null);

      expect(result).toEqual([]);
      expect(prisma.userGame.findMany).not.toHaveBeenCalled();
    });

    it('normalizes tags before searching', async () => {
      prisma.userGame.findMany.mockResolvedValue([]);

      await findUserGamesByTags('user1', ['  RPG  ', 'Action']);

      expect(prisma.userGame.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          AND: [
            { tags: { some: { tag: 'rpg' } } },
            { tags: { some: { tag: 'action' } } },
          ],
        },
        include: {
          game: true,
          tags: true,
          queue: true,
        },
      });
    });

    it('uses AND logic to match all tags', async () => {
      const mockGames = [
        { id: 'ug1', game: { title: 'Hades' }, tags: [{ tag: 'roguelike' }, { tag: 'action' }] },
      ];
      prisma.userGame.findMany.mockResolvedValue(mockGames);

      const result = await findUserGamesByTags('user1', ['roguelike', 'action']);

      expect(result).toEqual(mockGames);
    });
  });
});
