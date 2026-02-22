'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import GameSearch from '@/components/GameSearch';

export default function AddGame() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [queueId, setQueueId] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [queues, setQueues] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [addedGames, setAddedGames] = useState([]);

  // Fetch user's queues
  useEffect(() => {
    async function fetchQueues() {
      try {
        const res = await fetch('/api/user/queues');

        if (!res.ok) {
          throw new Error('Failed to fetch queues');
        }

        const data = await res.json();
        setQueues(data.queues || []);

        // Auto-select the default queue if it exists
        const defaultQueue = data.queues?.find(q => q.isDefault);
        if (defaultQueue) {
          setQueueId(defaultQueue.id);
        }
      } catch (err) {
        console.error('Error fetching queues:', err);
      }
    }

    fetchQueues();
  }, []);

  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setError(null);
    setSuccessMessage('');
  };

  const handleAddToCollection = async (e) => {
    e.preventDefault();

    if (!selectedGame) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const res = await fetch('/api/user/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: selectedGame.id,
          status,
          ...(queueId && { queueId }),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add game to collection');
      }

      const data = await res.json();

      // Add to list of successfully added games
      setAddedGames(prev => [
        { title: selectedGame.title, id: data.userGame.id, coverUrl: selectedGame.coverImageUrl },
        ...prev
      ]);

      // Show success message
      setSuccessMessage(`${selectedGame.title} added to your ${status.toLowerCase().replace('_', ' ')}`);

      // Reset selected game to allow adding more games
      setSelectedGame(null);

    } catch (err) {
      console.error('Error adding game to collection:', err);
      setError('Failed to add game to collection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              ADD TO ARSENAL
            </span>
          </h1>
          <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Recently added strip */}
        {addedGames.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-mono text-sm uppercase tracking-wider text-green-400">Recently Added</h3>
              <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm font-mono transition-colors">
                View Dashboard →
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {addedGames.slice(0, 5).map(game => (
                <div key={game.id} className="flex items-center bg-[#0f172a]/80 border border-green-500/20 rounded-full pl-1 pr-3 py-1">
                  {game.coverUrl ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                      <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 mr-2 flex items-center justify-center text-xs text-green-400">
                      {game.title[0]}
                    </div>
                  )}
                  <span className="text-sm truncate max-w-[120px] text-white">{game.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Search panel */}
          <div className="md:col-span-3">
            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-cyan-400">◆</span> Search Games
              </h2>
              <GameSearch onGameSelect={handleGameSelect} />
            </div>

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6">
                <p className="text-green-400 flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Search for another game, or{' '}
                  <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    return to dashboard →
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Add to collection panel */}
          <div className="md:col-span-2">
            {selectedGame ? (
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 sticky top-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">▶</span> Add to Collection
                </h2>

                <div className="flex items-start mb-6">
                  <div
                    className="w-24 h-32 bg-cover bg-center rounded-lg mr-4 flex-shrink-0 bg-gray-800 border border-purple-500/20"
                    style={selectedGame.coverImageUrl ? { backgroundImage: `url(${selectedGame.coverImageUrl})` } : {}}
                  >
                    {!selectedGame.coverImageUrl && (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-lg mb-1 leading-tight">{selectedGame.title}</h3>
                    {selectedGame.releaseDate && (
                      <p className="text-gray-400 text-xs font-mono mb-2">
                        {new Date(selectedGame.releaseDate).getFullYear()}
                      </p>
                    )}
                    {(selectedGame.hltbMainTime || selectedGame.hltbCompletionTime) && (
                      <div className="text-xs text-gray-400 font-mono space-y-0.5">
                        {selectedGame.hltbMainTime && (
                          <p>Main: ~{Math.round(selectedGame.hltbMainTime / 60)}h</p>
                        )}
                        {selectedGame.hltbCompletionTime && (
                          <p>100%: ~{Math.round(selectedGame.hltbCompletionTime / 60)}h</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleAddToCollection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    >
                      <option value="BACKLOG">Add to Backlog</option>
                      <option value="CURRENTLY_PLAYING">Currently Playing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ABANDONED">Abandoned</option>
                      <option value="WISHLIST">Wishlist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Queue</label>
                    <select
                      value={queueId}
                      onChange={(e) => setQueueId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0e27]/50 border border-cyan-500/30 rounded-lg text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
                    >
                      <option value="">No Queue</option>
                      {queues.map((queue) => (
                        <option key={queue.id} value={queue.id}>
                          {queue.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm py-3 px-4 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Adding...' : 'Add to Collection'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-4">How to build your arsenal</h3>
                <ol className="space-y-3">
                  {[
                    'Search for games you own or plan to play',
                    'Select a game from the search results',
                    'Choose the status (Backlog, Playing, etc.)',
                    'Optionally add it to a queue',
                    'Add more games as needed',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="mt-5 pt-5 border-t border-gray-800">
                  <p className="text-xs text-gray-500 font-mono">
                    TIP: Add games to your backlog first, then organize them into queues to plan your schedule.
                  </p>
                </div>
              </div>
            )}
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
