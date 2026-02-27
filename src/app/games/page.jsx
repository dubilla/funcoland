'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getEffectiveMainTime, formatHours } from '@/lib/utils/playTime';

const STATUSES = [
  { value: null, label: 'ALL' },
  { value: 'BACKLOG', label: 'BACKLOG', color: 'cyan' },
  { value: 'CURRENTLY_PLAYING', label: 'PLAYING', color: 'purple' },
  { value: 'COMPLETED', label: 'COMPLETED', color: 'green' },
  { value: 'ABANDONED', label: 'ABANDONED', color: 'red' },
  { value: 'WISHLIST', label: 'WISHLIST', color: 'pink' },
];

const STATUS_COLORS = {
  BACKLOG: { border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-400/50', badge: 'bg-cyan-500/90', text: 'text-cyan-400' },
  CURRENTLY_PLAYING: { border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-400/50', badge: 'bg-purple-500/90', text: 'text-purple-400' },
  COMPLETED: { border: 'border-green-500/20', hoverBorder: 'hover:border-green-400/50', badge: 'bg-green-500/90', text: 'text-green-400' },
  ABANDONED: { border: 'border-red-500/20', hoverBorder: 'hover:border-red-400/50', badge: 'bg-red-500/90', text: 'text-red-400' },
  WISHLIST: { border: 'border-pink-500/20', hoverBorder: 'hover:border-pink-400/50', badge: 'bg-pink-500/90', text: 'text-pink-400' },
};

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'time', label: 'Time to Beat' },
];

export default function GamesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <div className="text-gray-400 font-mono animate-pulse">Loading games...</div>
      </div>
    }>
      <GamesPageContent />
    </Suspense>
  );
}

function GamesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated');

  const activeStatus = searchParams.get('status') || null;

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch('/api/user/games');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setGames(data.userGames || []);
      } catch (err) {
        console.error('Error fetching games:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, []);

  const filteredGames = useMemo(() => {
    let result = games;

    if (activeStatus) {
      result = result.filter(g => g.status === activeStatus);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(g => g.game.title.toLowerCase().includes(q));
    }

    if (sort === 'title') {
      result = [...result].sort((a, b) => a.game.title.localeCompare(b.game.title));
    } else if (sort === 'time') {
      result = [...result].sort((a, b) => (getEffectiveMainTime(b) || 0) - (getEffectiveMainTime(a) || 0));
    }
    // 'updated' is already the default order from the API

    return result;
  }, [games, activeStatus, search, sort]);

  function setStatus(status) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    router.push(`/games?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                MY GAMES
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-mono">
              {loading ? '...' : `${filteredGames.length} game${filteredGames.length !== 1 ? 's' : ''}`}
              {activeStatus ? ` in ${activeStatus.replace('_', ' ').toLowerCase()}` : ' in collection'}
            </p>
          </div>
          <Link
            href="/games/add"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold px-6 py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
          >
            <span className="text-xl">+</span>
            Add Game
          </Link>
        </div>

        {/* Status Filter Bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map(s => {
            const isActive = activeStatus === s.value;
            return (
              <button
                key={s.label}
                onClick={() => setStatus(s.value)}
                className={`px-4 py-2 rounded-full text-sm font-mono font-bold transition-all ${
                  isActive
                    ? s.color
                      ? `bg-${s.color}-500/30 text-${s.color}-400 border border-${s.color}-500/50`
                      : 'bg-white/10 text-white border border-white/30'
                    : 'bg-[#0f172a]/80 text-gray-400 border border-gray-700 hover:border-gray-500'
                }`}
                style={isActive && s.color ? {
                  backgroundColor: `color-mix(in srgb, var(--tw-${s.color}-500, ${s.color === 'cyan' ? '#06b6d4' : s.color === 'purple' ? '#a855f7' : s.color === 'green' ? '#22c55e' : s.color === 'red' ? '#ef4444' : '#ec4899'}) 20%, transparent)`,
                  color: s.color === 'cyan' ? '#22d3ee' : s.color === 'purple' ? '#c084fc' : s.color === 'green' ? '#4ade80' : s.color === 'red' ? '#f87171' : '#f472b6',
                  borderColor: s.color === 'cyan' ? 'rgba(6,182,212,0.5)' : s.color === 'purple' ? 'rgba(168,85,247,0.5)' : s.color === 'green' ? 'rgba(34,197,94,0.5)' : s.color === 'red' ? 'rgba(239,68,68,0.5)' : 'rgba(236,72,153,0.5)',
                } : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#0f172a]/80 border border-gray-700 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">&#x1F50D;</span>
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="bg-[#0f172a]/80 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-gray-400 font-mono animate-pulse">Loading games...</div>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map(userGame => {
              const colors = STATUS_COLORS[userGame.status] || STATUS_COLORS.BACKLOG;
              const mainTime = getEffectiveMainTime(userGame);

              return (
                <Link
                  key={userGame.id}
                  href={`/games/${userGame.id}/edit`}
                  className={`group bg-[#0f172a]/80 backdrop-blur-xl border ${colors.border} rounded-2xl overflow-hidden ${colors.hoverBorder} transition-all hover:scale-105`}
                >
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
                    <div className={`absolute top-3 right-3 ${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full font-mono`}>
                      {userGame.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1 truncate text-lg">{userGame.game.title}</h3>

                    {userGame.queue && (
                      <p className={`text-xs ${colors.text} mb-3 font-mono`}>
                        QUEUE: {userGame.queue.name}
                      </p>
                    )}

                    {userGame.status === 'CURRENTLY_PLAYING' ? (
                      <div className="mb-3">
                        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${userGame.progressPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                          <span>{userGame.progressPercent}% complete</span>
                          {mainTime && <span>~{formatHours(mainTime)} total</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs text-gray-400 mb-3 font-mono">
                        <span>
                          {userGame.status === 'COMPLETED' ? 'Completed' :
                           userGame.status === 'ABANDONED' ? 'Abandoned' :
                           userGame.progressPercent > 0 ? `${userGame.progressPercent}%` : 'Not started'}
                        </span>
                        {mainTime && <span>~{formatHours(mainTime)}</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : games.length === 0 ? (
          /* Empty collection */
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">&#x1F3AE;</div>
            <h3 className="text-2xl font-bold text-white mb-3">Build Your Arsenal</h3>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Start tracking your gaming backlog. Add games, organize them into queues, and conquer your collection.
            </p>
            <Link
              href="/games/add"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold px-8 py-4 rounded-lg transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
            >
              <span className="text-xl">+</span>
              Add Your First Game
            </Link>
          </div>
        ) : (
          /* No results from filter/search */
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">&#x1F50D;</div>
            <h3 className="text-xl font-bold text-white mb-2">No games match</h3>
            <p className="text-gray-400">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
