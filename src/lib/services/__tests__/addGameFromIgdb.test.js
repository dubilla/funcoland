jest.mock('../../db', () => ({
  __esModule: true,
  default: {
    game: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../api/igdb', () => ({
  getGameDetails: jest.fn(),
  mapIgdbGameToModel: jest.fn(),
}));

jest.mock('../../api/hltb', () => ({
  getGameCompletionTimes: jest.fn(),
}));

import prisma from '../../db';
import * as igdbApi from '../../api/igdb';
import * as hltbApi from '../../api/hltb';
import { addGameFromIgdb, withTimeout } from '../gameService';

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the promise value when it resolves before the timeout', async () => {
    const resultPromise = withTimeout(Promise.resolve('ok'), 1000, 'fallback');
    await expect(resultPromise).resolves.toBe('ok');
  });

  it('returns the fallback when the promise never resolves', async () => {
    const hanging = new Promise(() => {});
    const resultPromise = withTimeout(hanging, 1000, 'fallback');

    jest.advanceTimersByTime(1000);

    await expect(resultPromise).resolves.toBe('fallback');
  });

  it('returns the fallback when the promise rejects', async () => {
    const resultPromise = withTimeout(Promise.reject(new Error('boom')), 1000, 'fallback');
    await expect(resultPromise).resolves.toBe('fallback');
  });
});

describe('addGameFromIgdb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an existing game without calling external APIs', async () => {
    const existing = { id: 'existing', apiId: '42', title: 'Halo' };
    prisma.game.findFirst.mockResolvedValue(existing);

    await expect(addGameFromIgdb('42')).resolves.toEqual(existing);
    expect(igdbApi.getGameDetails).not.toHaveBeenCalled();
    expect(hltbApi.getGameCompletionTimes).not.toHaveBeenCalled();
  });

  it('still creates the game when HowLongToBeat hangs past the timeout', async () => {
    jest.useFakeTimers();

    prisma.game.findFirst.mockResolvedValue(null);
    igdbApi.getGameDetails.mockResolvedValue({ id: 42, name: 'Halo' });
    igdbApi.mapIgdbGameToModel.mockReturnValue({
      title: 'Halo',
      apiId: '42',
      apiSource: 'IGDB',
      platforms: ['Xbox'],
    });
    hltbApi.getGameCompletionTimes.mockReturnValue(new Promise(() => {}));
    prisma.game.create.mockResolvedValue({ id: 'new', title: 'Halo', apiId: '42' });

    const createPromise = addGameFromIgdb('42');
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2500);

    await expect(createPromise).resolves.toEqual({ id: 'new', title: 'Halo', apiId: '42' });
    expect(prisma.game.create).toHaveBeenCalledWith({
      data: {
        title: 'Halo',
        apiId: '42',
        apiSource: 'IGDB',
        platforms: ['Xbox'],
        hltbMainTime: null,
        hltbCompletionTime: null,
      },
    });

    jest.useRealTimers();
  });
});
