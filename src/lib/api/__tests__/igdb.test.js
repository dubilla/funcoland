import { mapIgdbGameToModel } from '../igdb';

describe('mapIgdbGameToModel', () => {
  const baseGame = {
    id: 1234,
    name: 'Zelda',
    first_release_date: 1490000000,
    summary: 'A great game',
    cover_url: 'https://images.igdb.com/cover.jpg',
  };

  describe('platforms', () => {
    it('maps platform names to a flat string array', () => {
      const result = mapIgdbGameToModel({
        ...baseGame,
        platforms: [
          { id: 130, name: 'Nintendo Switch' },
          { id: 41, name: 'Wii U' },
        ],
      });

      expect(result.platforms).toEqual(['Nintendo Switch', 'Wii U']);
    });

    it('returns an empty array when platforms is undefined', () => {
      const result = mapIgdbGameToModel({ ...baseGame });
      expect(result.platforms).toEqual([]);
    });

    it('returns an empty array when platforms is null', () => {
      const result = mapIgdbGameToModel({ ...baseGame, platforms: null });
      expect(result.platforms).toEqual([]);
    });

    it('excludes platforms that are missing a name', () => {
      const result = mapIgdbGameToModel({
        ...baseGame,
        platforms: [
          { id: 130, name: 'Nintendo Switch' },
          { id: 99 },
        ],
      });

      expect(result.platforms).toEqual(['Nintendo Switch', undefined]);
    });
  });
});
