import { render, screen, waitFor } from '@testing-library/react';
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
      jest.advanceTimersByTime(350);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('fires search after 350ms when input is 2 or more characters', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Ha');
      jest.advanceTimersByTime(350);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Ha');
      });
    });

    it('does not fire search before 350ms has elapsed', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Ha');
      jest.advanceTimersByTime(349);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('only fires once when typing rapidly (debounce resets on each keystroke)', async () => {
      const { user } = setup();
      mockFetchSuccess();
      render(<GameSearch onGameSelect={jest.fn()} />);

      await user.type(screen.getByPlaceholderText('Search for games...'), 'Halo');
      jest.advanceTimersByTime(350);

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
      jest.advanceTimersByTime(350);

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
      jest.advanceTimersByTime(350);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/games/search?query=Zelda%3A%20BOTW');
      });
    });
  });
});
