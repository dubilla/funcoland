'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getEffectiveMainTime, formatTime } from '@/lib/utils/playTime';

export default function UpdateGame({ params }) {
  const { id } = params || {};

  const [userGame, setUserGame] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [customMainTimeHours, setCustomMainTimeHours] = useState('');
  const [customCompletionTimeHours, setCustomCompletionTimeHours] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTime, setIsSavingTime] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/user/games/${id}`);

        if (!res.ok) {
          throw new Error('Failed to fetch game');
        }

        const data = await res.json();
        setUserGame(data.userGame);
        setProgress(data.userGame.progressPercent);
        setStatus(data.userGame.status);
        // Extract tag strings from tag objects
        if (data.userGame.tags) {
          setTags(data.userGame.tags.map(t => typeof t === 'string' ? t : t.tag));
        }
        // Initialize custom time fields (convert minutes to hours for display)
        if (data.userGame.customMainTime) {
          setCustomMainTimeHours((data.userGame.customMainTime / 60).toString());
        }
        if (data.userGame.customCompletionTime) {
          setCustomCompletionTimeHours((data.userGame.customCompletionTime / 60).toString());
        }
      } catch (err) {
        console.error('Error fetching game:', err);
        setError('Failed to load game. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchAvailableTags() {
      try {
        const res = await fetch('/api/user/tags');
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.tags || []);
        }
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    }

    if (id) {
      fetchGame();
      fetchAvailableTags();
    }
  }, [id]);

  const handleAddTag = async (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag || tags.includes(normalizedTag)) {
      setTagInput('');
      return;
    }

    try {
      const res = await fetch(`/api/user/games/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: normalizedTag }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add tag');
      }

      setTags(prev => [...prev, normalizedTag].sort());
      setTagInput('');
      // Add to available tags if not already there
      if (!availableTags.includes(normalizedTag)) {
        setAvailableTags(prev => [...prev, normalizedTag].sort());
      }
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  const handleRemoveTag = async (tag) => {
    try {
      const res = await fetch(`/api/user/games/${id}/tags`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove tag');
      }

      setTags(prev => prev.filter(t => t !== tag));
    } catch (err) {
      console.error('Error removing tag:', err);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressPercent: progress,
          status,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update game');
      }

      const data = await res.json();
      setUserGame(data.userGame);
      setSuccessMessage('Game progress updated successfully!');

      // If progress is 100% and status isn't completed, ask if they want to mark as completed
      if (progress === 100 && status !== 'COMPLETED') {
        if (window.confirm('You reached 100%! Would you like to mark this game as completed?')) {
          setStatus('COMPLETED');
          await fetch(`/api/user/games/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              progressPercent: 100,
              status: 'COMPLETED',
            }),
          });
        }
      }

    } catch (err) {
      console.error('Error updating game:', err);
      setError('Failed to update game. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartPlaying = async () => {
    if (status !== 'CURRENTLY_PLAYING') {
      setStatus('CURRENTLY_PLAYING');
      setProgress(1); // Start with 1% progress

      try {
        await fetch(`/api/user/games/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            progressPercent: 1,
            status: 'CURRENTLY_PLAYING',
          }),
        });

        setSuccessMessage('Game marked as currently playing!');
      } catch (err) {
        console.error('Error starting game:', err);
        setError('Failed to update game status. Please try again.');
      }
    }
  };

  // Calculate time remaining based on progress and effective time
  const calculateTimeRemaining = () => {
    const totalTime = getEffectiveMainTime(userGame);
    if (!totalTime) return null;

    const completed = progress / 100;
    const remainingTime = totalTime * (1 - completed);

    return remainingTime; // in minutes
  };

  // Save custom play times
  const handleSaveCustomTimes = async () => {
    setIsSavingTime(true);
    setError(null);

    try {
      const customMainTime = customMainTimeHours ? Math.round(parseFloat(customMainTimeHours) * 60) : null;
      const customCompletionTime = customCompletionTimeHours ? Math.round(parseFloat(customCompletionTimeHours) * 60) : null;

      const res = await fetch(`/api/user/games/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMainTime, customCompletionTime }),
      });

      if (!res.ok) {
        throw new Error('Failed to save custom times');
      }

      const data = await res.json();
      setUserGame(data.userGame);
      setSuccessMessage('Play times updated!');
    } catch (err) {
      console.error('Error saving custom times:', err);
      setError('Failed to save custom times. Please try again.');
    } finally {
      setIsSavingTime(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-40 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userGame) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!userGame) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">Game not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { game } = userGame;
  const timeRemaining = calculateTimeRemaining();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold truncate max-w-md">{game.title}</h1>
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 relative">
            <div className="h-64 md:h-full relative">
              {game.coverImageUrl ? (
                <Image
                  src={game.coverImageUrl}
                  alt={game.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 md:w-2/3">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Game Progress</h2>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    status === 'CURRENTLY_PLAYING' ? 'bg-green-100 text-green-800' :
                    status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    status === 'BACKLOG' ? 'bg-gray-100 text-gray-800' :
                    status === 'ABANDONED' ? 'bg-red-100 text-red-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {status === 'CURRENTLY_PLAYING' ? 'Playing' :
                     status === 'BACKLOG' ? 'Backlog' :
                     status === 'COMPLETED' ? 'Completed' :
                     status === 'ABANDONED' ? 'Abandoned' : 'Wishlist'}
                  </span>
                </div>

                {status === 'BACKLOG' ? (
                  <div className="py-2 mb-4">
                    <button
                      onClick={handleStartPlaying}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Playing
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Progress: {progress}%
                        </label>
                        {userGame.game.hltbMainTime && status !== 'COMPLETED' && (
                          <span className="text-sm text-gray-600">
                            {timeRemaining > 0 ? `~${formatTime(timeRemaining)} remaining` : 'Completed!'}
                          </span>
                        )}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                      <div className="grid grid-cols-3 text-xs text-gray-400 mt-1">
                        <span>0%</span>
                        <span className="text-center">50%</span>
                        <span className="text-right">100%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="CURRENTLY_PLAYING">Currently Playing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ABANDONED">Abandoned</option>
                        <option value="WISHLIST">Wishlist</option>
                      </select>
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400"
                      >
                        {isSaving ? 'Saving...' : 'Update Progress'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Tags Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-2">Tags</h3>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-indigo-600 font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Type a tag and press Enter..."
                    list="tag-suggestions"
                  />
                  {availableTags.length > 0 && (
                    <datalist id="tag-suggestions">
                      {availableTags
                        .filter(tag => !tags.includes(tag))
                        .map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                    </datalist>
                  )}
                </div>

                {availableTags.filter(tag => !tags.includes(tag)).length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Quick add: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {availableTags
                        .filter(tag => !tags.includes(tag))
                        .slice(0, 6)
                        .map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleAddTag(tag)}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-800 rounded"
                          >
                            + {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Play Time Section */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">How Long to Beat</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Main Story (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={customMainTimeHours}
                      onChange={(e) => setCustomMainTimeHours(e.target.value)}
                      placeholder={game.hltbMainTime ? `${(game.hltbMainTime / 60).toFixed(1)}` : 'Enter hours'}
                      className="w-full p-2 border rounded text-sm"
                    />
                    {game.hltbMainTime && !userGame.customMainTime && (
                      <p className="text-xs text-gray-400 mt-1">HLTB: {formatTime(game.hltbMainTime)}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Completionist (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={customCompletionTimeHours}
                      onChange={(e) => setCustomCompletionTimeHours(e.target.value)}
                      placeholder={game.hltbCompletionTime ? `${(game.hltbCompletionTime / 60).toFixed(1)}` : 'Enter hours'}
                      className="w-full p-2 border rounded text-sm"
                    />
                    {game.hltbCompletionTime && !userGame.customCompletionTime && (
                      <p className="text-xs text-gray-400 mt-1">HLTB: {formatTime(game.hltbCompletionTime)}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCustomTimes}
                  disabled={isSavingTime}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 disabled:bg-gray-50 text-sm cursor-pointer"
                >
                  {isSavingTime ? 'Saving...' : 'Save Play Times'}
                </button>

                {getEffectiveMainTime(userGame) && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Using: {formatTime(getEffectiveMainTime(userGame))} {userGame.customMainTime ? '(custom)' : '(HLTB)'}
                  </p>
                )}
              </div>

              <div className="mt-auto">
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">Game Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {game.releaseDate && (
                      <div>
                        <p className="text-gray-600">Released</p>
                        <p>{new Date(game.releaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {game.developer && (
                      <div>
                        <p className="text-gray-600">Developer</p>
                        <p>{game.developer}</p>
                      </div>
                    )}
                    {game.publisher && (
                      <div>
                        <p className="text-gray-600">Publisher</p>
                        <p>{game.publisher}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
