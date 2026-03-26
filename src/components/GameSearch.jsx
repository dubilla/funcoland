'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function GameSearch({ onGameSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPartial, setIsPartial] = useState(false);
  const debounceTimer = useRef(null);

  const runSearch = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsLoading(true);
    setError(null);
    setIsPartial(false);

    try {
      const res = await fetch(`/api/games/search?query=${encodeURIComponent(searchQuery)}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Search failed:', res.status, errorText);
        throw new Error('Failed to search games');
      }

      const data = await res.json();
      setResults(data.games || []);
      setIsPartial(!!data.partial);
    } catch (err) {
      console.error('Error searching games:', err);
      setError('Failed to search games. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      runSearch(query);
    }, 350);

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    clearTimeout(debounceTimer.current);
    runSearch(query);
  };

  const handleGameSelect = async (game) => {
    // If the game doesn't have an ID (it's from external API), add it to our DB first
    if (!game.id && game.apiId) {
      try {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ igdbId: game.apiId }),
        });

        if (!res.ok) {
          throw new Error('Failed to add game');
        }

        const data = await res.json();
        onGameSelect(data.game);
      } catch (err) {
        console.error('Error adding game:', err);
        setError('Failed to add game. Please try again.');
      }
    } else {
      onGameSelect(game);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for games..."
              className="w-full px-4 py-3 pr-10 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {isPartial && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm py-3 px-4 rounded-lg mb-4">
          External search is temporarily unavailable — showing saved games only.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((game) => (
          <button
            type="button"
            key={game.id || game.apiId}
            className="bg-[#0a0e27]/80 border border-cyan-500/20 rounded-xl overflow-hidden hover:border-cyan-400/50 active:border-cyan-400/50 hover:scale-105 active:scale-95 cursor-pointer transition-all text-left"
            onClick={() => handleGameSelect(game)}
          >
            <div className="h-40 relative w-full bg-gray-800">
              {game.coverImageUrl ? (
                <Image
                  src={game.coverImageUrl}
                  alt={game.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-500 text-sm">No image</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-white truncate">{game.title}</h3>
              {game.releaseDate && (
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {new Date(game.releaseDate).getFullYear()}
                </p>
              )}
              {(game.hltbMainTime || game.hltbCompletionTime) && (
                <div className="mt-1 text-xs text-gray-400 font-mono">
                  {game.hltbMainTime && (
                    <p>Main: {Math.round(game.hltbMainTime / 60)}h</p>
                  )}
                  {game.hltbCompletionTime && (
                    <p>100%: {Math.round(game.hltbCompletionTime / 60)}h</p>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {results.length === 0 && query.trim().length >= 2 && !isLoading && (
        <p className="text-center py-8 text-gray-500 font-mono">No games found. Try a different search term.</p>
      )}
    </div>
  );
}
