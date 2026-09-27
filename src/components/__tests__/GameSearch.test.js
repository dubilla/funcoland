import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSearch from '../GameSearch';

const mockGames = [
  { id: '1', apiId: null, title: 'Halo', coverImageUrl: null, releaseDate: null },
  { id: '2', apiId: null, title: 'Halo 2', coverImageUrl: null, releaseDate: null },
];

function mockFetchSuccess(games = mockGames) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ games }),
  });
}

function setup() {
  jest.useFakeTimers();
  // userEvent v14 requires advanceTimers when using fake timers
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  return { user };
}

async function advanceTimers(ms) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe('GameSearch', () => {
  describe('debounced auto-search', () => {
    it('does not search when input is fewer than 2 characters', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'H');
      await advanceTimers(350);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('fires search after 350ms when input is 2 or more characters', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Ha');
      await advanceTimers(350);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Ha');
      });
    });

    it('does not fire search before 350ms has elapsed', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Ha');
      await advanceTimers(349);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('only fires once when typing rapidly (debounce resets on each keystroke)', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Halo');
      await advanceTimers(350);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Halo');
      });
    });

    it('clears results when input is cleared', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      const input = screen.getByPlaceholderText('Search for games...');
      await user.type(input, 'Halo');
      await advanceTimers(350);

      await waitFor(() => {
        expect(screen.getByText('Halo')).toBeInTheDocument();
      });

      await user.clear(input);

      await waitFor(() => {
        expect(screen.queryByText('Halo')).not.toBeInTheDocument();
      });
    });
  });

  describe('manual submit', () => {
    it('fires search immediately on button click without waiting for debounce', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Halo');
      await user.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Halo');
      });
    });

    it('fires search immediately on Enter key without waiting for debounce', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Halo{Enter}');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Halo');
      });
    });
  });

  describe('API call', () => {
    it('encodes the query string correctly in the request URL', async () => {
      const { user } = setup();
      mockFetchSuccess([]);
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Zelda: BOTW');
      await advanceTimers(350);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Zelda%3A%20BOTW');
      });
    });
  });

  describe('result metadata', () => {
    it('shows the release year and abbreviated console names', async () => {
      const { user } = setup();
      mockFetchSuccess([
        {
          id: '1',
          apiId: null,
          title: 'Super Mario World',
          coverImageUrl: null,
          releaseDate: '1990-11-21T00:00:00.000Z',
          platforms: ['Super Nintendo Entertainment System', 'PlayStation 2'],
        },
      ]);

      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Mario');
      await advanceTimers(350);

      await waitFor(() => {
        expect(screen.getByText('1990')).toBeInTheDocument();
        expect(screen.getByText('SNES')).toBeInTheDocument();
        expect(screen.getByText('PS2')).toBeInTheDocument();
      });
    });

    it('shows unmapped platform names as returned by the API', async () => {
      const { user } = setup();
      mockFetchSuccess([
        {
          id: '1',
          apiId: null,
          title: 'Indie Game',
          coverImageUrl: null,
          releaseDate: null,
          platforms: ['Arcade'],
        },
      ]);

      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Indie');
      await advanceTimers(350);

      await waitFor(() => {
        expect(screen.getByText('Arcade')).toBeInTheDocument();
      });
    });
  });

  describe('result selection', () => {
    it('calls onGameSelect with a local result', async () => {
      const { user } = setup();
      const onGameSelect = jest.fn();
      mockFetchSuccess([mockGames[0]]);
      render(<GameSearch onGameSelect={onGameSelect} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Halo');
      await advanceTimers(350);
      await user.click(await screen.findByRole('button', { name: 'Select Halo' }));

      expect(onGameSelect).toHaveBeenCalledWith(mockGames[0]);
    });

    it('imports an IGDB result before selecting it', async () => {
      const { user } = setup();
      const onGameSelect = jest.fn();
      const igdbGame = { apiId: 'igdb-1', title: 'Celeste', coverImageUrl: null, releaseDate: null };
      const importedGame = { id: '3', apiId: 'igdb-1', title: 'Celeste', coverImageUrl: null, releaseDate: null };
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ games: [igdbGame] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ game: importedGame }) });
      render(<GameSearch onGameSelect={onGameSelect} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Celeste');
      await advanceTimers(350);
      await user.click(await screen.findByRole('button', { name: 'Select Celeste' }));

      await waitFor(() => {
        expect(fetch).toHaveBeenLastCalledWith('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ igdbId: 'igdb-1' }),
        });
        expect(onGameSelect).toHaveBeenCalledWith(importedGame);
      });
    });

    it('shows an error when importing an IGDB result fails', async () => {
      const { user } = setup();
      const igdbGame = { apiId: 'igdb-1', title: 'Celeste', coverImageUrl: null, releaseDate: null };
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ games: [igdbGame] }) })
        .mockResolvedValueOnce({ ok: false });
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Celeste');
      await advanceTimers(350);
      await user.click(await screen.findByRole('button', { name: 'Select Celeste' }));

      expect(await screen.findByText('Failed to add game. Please try again.')).toBeInTheDocument();
    });
  });
});
