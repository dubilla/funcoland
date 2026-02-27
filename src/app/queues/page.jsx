'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { getEffectiveMainTime, formatHours } from '@/lib/utils/playTime';

const STATUS_BADGE = {
  BACKLOG: { bg: 'bg-cyan-500/90', label: 'BACKLOG' },
  CURRENTLY_PLAYING: { bg: 'bg-purple-500/90', label: 'PLAYING' },
  COMPLETED: { bg: 'bg-green-500/90', label: 'COMPLETED' },
  ABANDONED: { bg: 'bg-red-500/90', label: 'ABANDONED' },
  WISHLIST: { bg: 'bg-pink-500/90', label: 'WISHLIST' },
};

export default function QueuesPage() {
  const [queues, setQueues] = useState([]);
  const [allGames, setAllGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [reordering, setReordering] = useState(null); // queueId currently being reordered

  useEffect(() => {
    async function fetchData() {
      try {
        const [queuesRes, gamesRes] = await Promise.all([
          fetch('/api/user/queues'),
          fetch('/api/user/games'),
        ]);
        if (!queuesRes.ok || !gamesRes.ok) throw new Error('Failed to fetch');
        const [queuesData, gamesData] = await Promise.all([queuesRes.json(), gamesRes.json()]);
        setQueues(queuesData.queues || []);
        setAllGames(gamesData.userGames || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const unqueuedGames = useMemo(
    () => allGames.filter(g => !g.queueId),
    [allGames]
  );

  const totalQueuedGames = useMemo(
    () => queues.reduce((sum, q) => sum + (q.stats?.totalGames || 0), 0),
    [queues]
  );

  const totalEstimatedTime = useMemo(
    () => queues.reduce((sum, q) => sum + (q.stats?.totalMainTime || 0), 0),
    [queues]
  );

  function toggleExpand(id) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleReorder = useCallback(async (queue, gameIndex, direction) => {
    const games = [...queue.games];
    const swapIndex = gameIndex + direction;
    if (swapIndex < 0 || swapIndex >= games.length) return;

    // Swap in local state
    [games[gameIndex], games[swapIndex]] = [games[swapIndex], games[gameIndex]];

    // Build new gameOrders
    const gameOrders = games.map((g, i) => ({ id: g.id, position: i + 1 }));

    // Optimistically update
    setQueues(prev => prev.map(q => {
      if (q.id !== queue.id) return q;
      return { ...q, games };
    }));

    setReordering(queue.id);
    try {
      const res = await fetch(`/api/user/queues/${queue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameOrders }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      const data = await res.json();
      setQueues(prev => prev.map(q => q.id !== queue.id ? q : { ...q, games: data.queue.games }));
    } catch (err) {
      console.error('Error reordering:', err);
    } finally {
      setReordering(null);
    }
  }, []);

  async function handleDelete(queueId) {
    if (!confirm('Delete this queue? Games will be unassigned but not deleted.')) return;

    try {
      const res = await fetch(`/api/user/queues/${queueId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setQueues(prev => prev.filter(q => q.id !== queueId));
      // Move those games to unqueued
      setAllGames(prev => prev.map(g => g.queueId === queueId ? { ...g, queueId: null, queue: null } : g));
    } catch (err) {
      console.error('Error deleting queue:', err);
    }
  }

  async function handleAssignQueue(gameId, queueId) {
    if (!queueId) return;
    try {
      const res = await fetch(`/api/user/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId }),
      });
      if (!res.ok) throw new Error('Failed to assign');

      // Refresh both lists
      const [queuesRes, gamesRes] = await Promise.all([
        fetch('/api/user/queues'),
        fetch('/api/user/games'),
      ]);
      const [queuesData, gamesData] = await Promise.all([queuesRes.json(), gamesRes.json()]);
      setQueues(queuesData.queues || []);
      setAllGames(gamesData.userGames || []);
    } catch (err) {
      console.error('Error assigning queue:', err);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 text-transparent bg-clip-text">
                QUEUES
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-mono">
              {loading ? '...' : `${queues.length} queue${queues.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            href="/queues/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold px-6 py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            <span className="text-xl">+</span>
            New Queue
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-gray-400 font-mono animate-pulse">Loading queues...</div>
          </div>
        ) : (
          <>
            {/* Aggregate Stats */}
            {queues.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border border-pink-500/20 p-6 rounded-2xl">
                  <p className="text-xs text-gray-500 font-mono mb-1">QUEUED GAMES</p>
                  <p className="text-4xl font-black text-white">{totalQueuedGames}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-purple-500/20 p-6 rounded-2xl">
                  <p className="text-xs text-gray-500 font-mono mb-1">TOTAL ESTIMATED TIME</p>
                  <p className="text-4xl font-black text-white">{formatHours(totalEstimatedTime)}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/10 to-pink-500/10 backdrop-blur-sm border border-cyan-500/20 p-6 rounded-2xl">
                  <p className="text-xs text-gray-500 font-mono mb-1">UNQUEUED GAMES</p>
                  <p className="text-4xl font-black text-white">{unqueuedGames.length}</p>
                </div>
              </div>
            )}

            {/* Queue Cards */}
            <div className="space-y-6 mb-10">
              {queues.map(queue => {
                const isExpanded = expandedIds.has(queue.id);
                const stats = queue.stats || {};
                const progressPct = stats.totalMainTime > 0
                  ? Math.round((stats.completedTime / stats.totalMainTime) * 100)
                  : 0;

                return (
                  <div
                    key={queue.id}
                    className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-2xl overflow-hidden hover:border-pink-400/50 transition-all"
                  >
                    {/* Collapsed View */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">{queue.name}</h3>
                          {queue.description && (
                            <p className="text-sm text-gray-400 mb-2">{queue.description}</p>
                          )}
                          {queue.filterTags && queue.filterTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {queue.filterTags.map(tag => (
                                <span key={tag} className="bg-pink-500/20 text-pink-300 text-xs font-mono px-2 py-0.5 rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            href={`/queues/${queue.id}`}
                            className="text-gray-400 hover:text-cyan-400 text-sm font-mono transition-colors"
                          >
                            Edit
                          </Link>
                          {!queue.isDefault && (
                            <button
                              onClick={() => handleDelete(queue.id)}
                              className="text-gray-400 hover:text-red-400 text-sm font-mono transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                          <p className="text-xs text-gray-500 font-mono mb-1">GAMES</p>
                          <p className="text-2xl font-black text-white">{stats.totalGames || 0}</p>
                        </div>
                        <div className="bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                          <p className="text-xs text-gray-500 font-mono mb-1">TOTAL TIME</p>
                          <p className="text-2xl font-black text-white">{formatHours(stats.totalMainTime || 0)}</p>
                        </div>
                        <div className="bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                          <p className="text-xs text-gray-500 font-mono mb-1">REMAINING</p>
                          <p className="text-2xl font-black text-white">{formatHours(stats.remainingTime || 0)}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {stats.totalMainTime > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                            <span>PROGRESS</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, progressPct)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Expand/Collapse Toggle */}
                      {queue.games && queue.games.length > 0 && (
                        <button
                          onClick={() => toggleExpand(queue.id)}
                          className="text-sm text-pink-400 hover:text-pink-300 font-mono transition-colors"
                        >
                          {isExpanded ? 'Collapse' : `Show ${queue.games.length} games`} {isExpanded ? '\u25B2' : '\u25BC'}
                        </button>
                      )}
                    </div>

                    {/* Expanded Game List */}
                    {isExpanded && queue.games && (
                      <div className="border-t border-gray-800 px-6 py-4">
                        <div className="space-y-3">
                          {queue.games.map((userGame, idx) => {
                            const badge = STATUS_BADGE[userGame.status] || STATUS_BADGE.BACKLOG;
                            const mainTime = getEffectiveMainTime(userGame);

                            return (
                              <div key={userGame.id} className="flex items-center gap-4 bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                                {/* Position */}
                                <span className="text-gray-500 font-mono text-sm w-8 text-center shrink-0">
                                  #{idx + 1}
                                </span>

                                {/* Cover */}
                                <div
                                  className="w-10 h-10 bg-cover bg-center rounded-lg border border-gray-700 shrink-0"
                                  style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                                ></div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <Link href={`/games/${userGame.id}/edit`} className="text-sm font-bold text-white hover:text-pink-400 truncate block transition-colors">
                                    {userGame.game.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`${badge.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono`}>
                                      {badge.label}
                                    </span>
                                    {userGame.progressPercent > 0 && (
                                      <span className="text-xs text-gray-400 font-mono">{userGame.progressPercent}%</span>
                                    )}
                                    {mainTime && (
                                      <span className="text-xs text-gray-500 font-mono">~{formatHours(mainTime)}</span>
                                    )}
                                  </div>
                                </div>

                                {/* Reorder Buttons */}
                                <div className="flex flex-col gap-1 shrink-0">
                                  <button
                                    onClick={() => handleReorder(queue, idx, -1)}
                                    disabled={idx === 0 || reordering === queue.id}
                                    className="text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs transition-colors px-1"
                                    title="Move up"
                                  >
                                    &#x25B2;
                                  </button>
                                  <button
                                    onClick={() => handleReorder(queue, idx, 1)}
                                    disabled={idx === queue.games.length - 1 || reordering === queue.id}
                                    className="text-gray-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed text-xs transition-colors px-1"
                                    title="Move down"
                                  >
                                    &#x25BC;
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Create Queue CTA */}
              <Link
                href="/queues/new"
                className="block bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border-2 border-dashed border-pink-500/30 rounded-2xl p-8 text-center hover:border-pink-400/50 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl text-pink-400">+</span>
                </div>
                <p className="text-gray-400 mb-2 font-mono text-sm">Organize your games</p>
                <span className="text-pink-400 font-bold">Create New Queue</span>
              </Link>
            </div>

            {/* Unqueued Games Section */}
            {unqueuedGames.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-cyan-400">&#x26A0;</span> Unqueued Games
                  <span className="text-sm font-mono text-gray-500 font-normal">({unqueuedGames.length})</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unqueuedGames.map(userGame => {
                    const badge = STATUS_BADGE[userGame.status] || STATUS_BADGE.BACKLOG;
                    return (
                      <div key={userGame.id} className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 flex items-center gap-4">
                        <div
                          className="w-12 h-12 bg-cover bg-center rounded-lg border border-gray-700 shrink-0"
                          style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{userGame.game.title}</p>
                          <span className={`${badge.bg} text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono`}>
                            {badge.label}
                          </span>
                        </div>
                        <select
                          defaultValue=""
                          onChange={e => handleAssignQueue(userGame.id, e.target.value)}
                          className="bg-[#0a0e27] border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-400 font-mono focus:outline-none focus:border-pink-500/50 cursor-pointer shrink-0"
                        >
                          <option value="" disabled>Add to queue</option>
                          {queues.map(q => (
                            <option key={q.id} value={q.id}>{q.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Empty state when no queues at all */}
            {queues.length === 0 && (
              <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">&#x1F4CB;</div>
                <h3 className="text-2xl font-bold text-white mb-3">Plan Your Gaming Roadmap</h3>
                <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                  Create queues to organize your games by priority, genre, or however you like.
                </p>
                <Link
                  href="/queues/new"
                  className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold px-8 py-4 rounded-lg transition-all hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                >
                  Create Your First Queue
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
