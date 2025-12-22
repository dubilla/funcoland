import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/db';

// Helper function to format time
const formatHours = (minutes) => {
  if (!minutes) return '0h';
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin');
  }

  // Fetch user's data
  const userId = session.user.id;

  // Get currently playing games
  const currentlyPlaying = await prisma.userGame.findMany({
    where: {
      userId,
      status: 'CURRENTLY_PLAYING',
    },
    include: {
      game: true,
      queue: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 3,
  });

  // Get backlog games
  const backlogGames = await prisma.userGame.findMany({
    where: {
      userId,
      status: 'BACKLOG',
    },
    include: {
      game: true,
      queue: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 6,
  });

  // Get user's queues
  const queues = await prisma.gameQueue.findMany({
    where: { userId },
    include: {
      games: {
        include: {
          game: true,
        },
        orderBy: {
          queuePosition: 'asc',
        },
      },
    },
    take: 3,
  });

  // Calculate stats for each queue
  const queuesWithStats = queues.map(queue => {
    let totalMainTime = 0;
    let totalCompletionTime = 0;
    let completedTime = 0;

    queue.games.forEach(userGame => {
      const { game, progressPercent } = userGame;

      if (game.hltbMainTime) {
        totalMainTime += game.hltbMainTime;
        completedTime += (game.hltbMainTime * progressPercent) / 100;
      }

      if (game.hltbCompletionTime) {
        totalCompletionTime += game.hltbCompletionTime;
      }
    });

    return {
      ...queue,
      stats: {
        totalMainTime,
        totalCompletionTime,
        completedTime,
        remainingTime: totalMainTime - completedTime,
        totalGames: queue.games.length,
      },
    };
  });

  // Get total stats
  const totalStats = await prisma.userGame.aggregate({
    _count: {
      id: true,
    },
    where: { userId },
  });

  // Get count by status
  const statusCounts = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count
    FROM "UserGame"
    WHERE "userId" = ${userId}
    GROUP BY status
  `;

  return (
    <div className="min-h-screen bg-[#0a0e27] relative">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                COMMAND CENTER
              </span>
            </h1>
            <p className="text-gray-400 text-sm font-mono">
              Welcome back, {session.user.name || session.user.email}
            </p>
          </div>
          <Link
            href="/signout"
            className="text-gray-400 hover:text-cyan-400 transition-colors text-sm font-mono"
          >
            Sign Out →
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm border border-cyan-500/20 p-6 rounded-2xl hover:border-cyan-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-mono text-cyan-400 uppercase tracking-wider">Total Games</h2>
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                🎮
              </div>
            </div>
            <p className="text-4xl font-black text-white">{totalStats._count.id}</p>
            <p className="text-xs text-gray-500 mt-1 font-mono">in collection</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 p-6 rounded-2xl hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-mono text-purple-400 uppercase tracking-wider">Playing</h2>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                ⚡
              </div>
            </div>
            <p className="text-4xl font-black text-white">
              {statusCounts.find(s => s.status === 'CURRENTLY_PLAYING')?.count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">in progress</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500/10 to-cyan-500/10 backdrop-blur-sm border border-pink-500/20 p-6 rounded-2xl hover:border-pink-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-mono text-pink-400 uppercase tracking-wider">Completed</h2>
              <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
                ✓
              </div>
            </div>
            <p className="text-4xl font-black text-white">
              {statusCounts.find(s => s.status === 'COMPLETED')?.count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-mono">conquered</p>
          </div>
        </div>

        {/* Currently Playing Section */}
        {currentlyPlaying.length > 0 && (
          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-purple-400">▶</span> Currently Playing
              </h2>
              <Link href="/games?status=CURRENTLY_PLAYING" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono">
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentlyPlaying.map(userGame => (
                <div key={userGame.id} className="group bg-[#0f172a]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-400/50 transition-all hover:scale-105">
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1 truncate text-lg">{userGame.game.title}</h3>

                    {userGame.queue && (
                      <p className="text-xs text-purple-400 mb-3 font-mono">
                        QUEUE: {userGame.queue.name}
                      </p>
                    )}

                    <div className="mb-4">
                      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${userGame.progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
                        <span>{userGame.progressPercent}% complete</span>
                        {userGame.game.hltbMainTime && (
                          <span>~{formatHours(userGame.game.hltbMainTime)} total</span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/games/${userGame.id}/update`}
                      className="block w-full text-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold px-4 py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                    >
                      Update Progress
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Game Backlog Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-cyan-400">◆</span> Your Backlog
            </h2>
            <Link href="/games?status=BACKLOG" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono">
              View All →
            </Link>
          </div>

          {backlogGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {backlogGames.map(userGame => (
                <div key={userGame.id} className="group bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden hover:border-cyan-400/50 transition-all hover:scale-105">
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-cyan-500/90 text-white text-xs font-bold px-3 py-1 rounded-full font-mono">
                      READY
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-white mb-1 truncate">{userGame.game.title}</h3>

                    {userGame.queue && (
                      <p className="text-xs text-cyan-400 mb-3 font-mono">
                        QUEUE: {userGame.queue.name}
                      </p>
                    )}

                    <div className="flex justify-between text-xs text-gray-400 mb-4 font-mono">
                      <span>Not started</span>
                      {userGame.game.hltbMainTime && (
                        <span>~{formatHours(userGame.game.hltbMainTime)}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/games/${userGame.id}/update`}
                        className="flex-1 text-center bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold px-4 py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                      >
                        Start
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-2xl overflow-hidden">
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🎮</div>
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
              <div className="p-6 border-t border-gray-800 bg-[#0a0e27]/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-medium">Track Progress</p>
                      <p className="text-gray-500 text-xs">Monitor completion across your collection</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-medium">Create Queues</p>
                      <p className="text-gray-500 text-xs">Organize games by priority</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-pink-400 text-lg">✓</span>
                    <div>
                      <p className="text-white font-medium">Time Tracking</p>
                      <p className="text-gray-500 text-xs">See how long games take to beat</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Game Queues Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-pink-400">◉</span> Active Queues
            </h2>
            <Link href="/queues" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-mono">
              View All →
            </Link>
          </div>

          {queuesWithStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queuesWithStats.map(queue => (
                <div key={queue.id} className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-6 hover:border-pink-400/50 transition-all">
                  <Link href={`/queues/${queue.id}`} className="text-xl font-bold text-white hover:text-pink-400 transition-colors flex items-center gap-2 mb-4">
                    {queue.name}
                    <span className="text-pink-400">→</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                      <p className="text-xs text-gray-500 font-mono mb-1">GAMES</p>
                      <p className="text-2xl font-black text-white">{queue.stats.totalGames}</p>
                    </div>
                    <div className="bg-[#0a0e27]/50 rounded-lg p-3 border border-gray-800">
                      <p className="text-xs text-gray-500 font-mono mb-1">TOTAL TIME</p>
                      <p className="text-2xl font-black text-white">{formatHours(queue.stats.totalMainTime)}</p>
                    </div>
                  </div>

                  {queue.stats.totalMainTime > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2 font-mono">
                        <span>PROGRESS</span>
                        <span>{Math.round((queue.stats.completedTime / queue.stats.totalMainTime) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (queue.stats.completedTime / queue.stats.totalMainTime) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {queue.games.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs font-mono text-gray-500 mb-3">NEXT UP:</p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 bg-cover bg-center rounded-lg border-2 border-pink-500/30"
                          style={{ backgroundImage: `url(${queue.games[0].game.coverImageUrl || '/placeholder.jpg'})` }}
                        ></div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-bold text-white truncate">{queue.games[0].game.title}</p>
                          <p className="text-xs text-gray-500 font-mono">Position #{queue.games[0].queuePosition}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Link
                href="/queues/new"
                className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur-sm border-2 border-dashed border-pink-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-pink-400/50 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl text-pink-400">+</span>
                </div>
                <p className="text-gray-400 mb-3 font-mono text-sm">Create a new queue</p>
                <span className="text-pink-400 font-bold">New Queue →</span>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400 mb-4">No queues created yet</p>
              <Link href="/queues/new" className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 text-white font-bold px-6 py-3 rounded-lg transition-all">
                Create Your First Queue
              </Link>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-cyan-400">⚡</span> Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/games/add"
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">+</span>
              </div>
              <h3 className="font-bold text-white mb-1">Add Game</h3>
              <p className="text-sm text-gray-400">Search and add to collection</p>
            </Link>

            <Link
              href="/queues/new"
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-purple-500/20 rounded-xl p-6 hover:border-purple-400/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold text-white mb-1">Create Queue</h3>
              <p className="text-sm text-gray-400">Organize your games</p>
            </Link>

            <Link
              href="/games?status=BACKLOG"
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-pink-500/20 rounded-xl p-6 hover:border-pink-400/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="font-bold text-white mb-1">View Backlog</h3>
              <p className="text-sm text-gray-400">Games waiting to play</p>
            </Link>

            <Link
              href="/stats"
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-400/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-bold text-white mb-1">My Stats</h3>
              <p className="text-sm text-gray-400">View gaming statistics</p>
            </Link>
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes blob {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `
      }} />
    </div>
  );
}
