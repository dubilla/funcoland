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

  const statusStyles = {
    CURRENTLY_PLAYING: 'bg-green-500/20 text-green-400 border border-green-500/30',
    COMPLETED: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    BACKLOG: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    ABANDONED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    WISHLIST: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  const statusLabels = {
    CURRENTLY_PLAYING: 'Playing',
    BACKLOG: 'Backlog',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
    WISHLIST: 'Wishlist',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto px-4 py-8">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-700 rounded w-1/3"></div>
              <div className="h-48 bg-gray-700 rounded"></div>
              <div className="h-8 bg-gray-700 rounded w-full"></div>
              <div className="h-8 bg-gray-700 rounded w-full"></div>
              <div className="h-12 bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !userGame) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 py-3 px-4 rounded-lg mb-4">
            {error}
          </div>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!userGame) {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-gray-400 mb-4">Game not found</p>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors font-mono">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { game } = userGame;
  const timeRemaining = calculateTimeRemaining();

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black truncate max-w-md text-white">{game.title}</h1>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono flex-shrink-0 ml-4">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden">
          <div className="md:flex">
            {/* Cover image */}
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
                  <div className="h-full w-full bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0f172a]"></div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 md:w-2/3">
              <div className="flex flex-col h-full space-y-6">
                {/* Progress section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-white">Game Progress</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${statusStyles[status] || statusStyles.BACKLOG}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>

                  {status === 'BACKLOG' ? (
                    <button
                      onClick={handleStartPlaying}
                      className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-400 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Playing
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-mono text-gray-400 uppercase tracking-wider">
                            Progress: <span className="text-white">{progress}%</span>
                          </label>
                          {userGame.game.hltbMainTime && status !== 'COMPLETED' && (
                            <span className="text-sm text-gray-400 font-mono">
                              {timeRemaining > 0 ? `~${formatTime(timeRemaining)} left` : 'Done!'}
                            </span>
                          )}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                          className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                        >
                          <option value="BACKLOG">Backlog</option>
                          <option value="CURRENTLY_PLAYING">Currently Playing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="ABANDONED">Abandoned</option>
                          <option value="WISHLIST">Wishlist</option>
                        </select>
                      </div>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-lg">
                          {error}
                        </div>
                      )}
                      {successMessage && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm py-3 px-4 rounded-lg">
                          {successMessage}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold py-2 px-6 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : 'Update Progress'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Tags section */}
                <div className="border-t border-gray-800 pt-5">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Tags</h3>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-purple-100 font-bold ml-1 leading-none"
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
                      className="w-full px-4 py-2 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
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
                      <span className="text-xs text-gray-500 font-mono">Quick add: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {availableTags
                          .filter(tag => !tags.includes(tag))
                          .slice(0, 6)
                          .map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleAddTag(tag)}
                              className="text-xs px-2 py-1 bg-[#0a0e27]/50 border border-gray-700 hover:border-purple-500/50 text-gray-400 hover:text-purple-300 rounded transition-colors"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Play time section */}
                <div className="border-t border-gray-800 pt-5">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">How Long to Beat</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-mono mb-1">Main Story (hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={customMainTimeHours}
                        onChange={(e) => setCustomMainTimeHours(e.target.value)}
                        placeholder={game.hltbMainTime ? `${(game.hltbMainTime / 60).toFixed(1)}` : 'Enter hours'}
                        className="w-full px-3 py-2 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                      {game.hltbMainTime && !userGame.customMainTime && (
                        <p className="text-xs text-gray-500 font-mono mt-1">HLTB: {formatTime(game.hltbMainTime)}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-mono mb-1">Completionist (hrs)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={customCompletionTimeHours}
                        onChange={(e) => setCustomCompletionTimeHours(e.target.value)}
                        placeholder={game.hltbCompletionTime ? `${(game.hltbCompletionTime / 60).toFixed(1)}` : 'Enter hours'}
                        className="w-full px-3 py-2 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                      />
                      {game.hltbCompletionTime && !userGame.customCompletionTime && (
                        <p className="text-xs text-gray-500 font-mono mt-1">HLTB: {formatTime(game.hltbCompletionTime)}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCustomTimes}
                    disabled={isSavingTime}
                    className="w-full bg-[#0a0e27]/50 border border-gray-700 hover:border-cyan-500/50 text-gray-300 hover:text-white py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingTime ? 'Saving...' : 'Save Play Times'}
                  </button>

                  {getEffectiveMainTime(userGame) && (
                    <p className="text-xs text-center text-gray-500 font-mono mt-2">
                      Using: {formatTime(getEffectiveMainTime(userGame))} {userGame.customMainTime ? '(custom)' : '(HLTB)'}
                    </p>
                  )}
                </div>

                {/* Game info */}
                <div className="border-t border-gray-800 pt-5 mt-auto">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">Game Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {game.releaseDate && (
                      <div>
                        <p className="text-xs text-gray-500 font-mono mb-1">RELEASED</p>
                        <p className="text-white">{new Date(game.releaseDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {game.developer && (
                      <div>
                        <p className="text-xs text-gray-500 font-mono mb-1">DEVELOPER</p>
                        <p className="text-white">{game.developer}</p>
                      </div>
                    )}
                    {game.publisher && (
                      <div>
                        <p className="text-xs text-gray-500 font-mono mb-1">PUBLISHER</p>
                        <p className="text-white">{game.publisher}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `
      }} />
    </div>
  );
}
