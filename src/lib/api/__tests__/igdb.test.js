import { mapIgdbGameToModel } from '../igdb';

describe('mapIgdbGameToModel', () => {
  it('maps IGDB platform names into the game model', () => {
    const game = mapIgdbGameToModel({
      id: 123,
      name: 'Super Mario World',
      first_release_date: 659318400,
      platforms: [
        { name: 'Super Nintendo Entertainment System' },
        { name: 'PlayStation 2' },
      ],
    });

    expect(game.platforms).toEqual([
      'Super Nintendo Entertainment System',
      'PlayStation 2',
    ]);
  });

  it('defaults platforms to an empty array when IGDB has none', () => {
    const game = mapIgdbGameToModel({
      id: 123,
      name: 'Untitled Game',
    });

    expect(game.platforms).toEqual([]);
  });
});
