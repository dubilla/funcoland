'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function GameSearch({ onGameSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/games/search?query=${encodeURIComponent(query)}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Search failed:', res.status, errorText);
        throw new Error('Failed to search games');
      }

      const data = await res.json();
      console.log('Search results:', data);
      console.log('Games found:', data.games?.length || 0);
      setResults(data.games || []);
    } catch (err) {
      console.error('Error searching games:', err);
      setError('Failed to search games. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for games..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {results.map((game) => (
          <div
            key={game.id || game.apiId}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer"
            onClick={() => handleGameSelect(game)}
          >
            <div className="h-40 relative w-full bg-gray-200">
              {game.coverImageUrl ? (
                <Image
                  src={game.coverImageUrl}
                  alt={game.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium truncate">{game.title}</h3>
              {game.releaseDate && (
                <p className="text-sm text-gray-600">
                  {new Date(game.releaseDate).getFullYear()}
                </p>
              )}
              {(game.hltbMainTime || game.hltbCompletionTime) && (
                <div className="mt-1 text-sm">
                  {game.hltbMainTime && (
                    <p>Main: {Math.round(game.hltbMainTime / 60)} hours</p>
                  )}
                  {game.hltbCompletionTime && (
                    <p>Complete: {Math.round(game.hltbCompletionTime / 60)} hours</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && query && !isLoading && (
        <p className="text-center py-8 text-gray-500">No games found. Try a different search term.</p>
      )}
    </div>
  );
}