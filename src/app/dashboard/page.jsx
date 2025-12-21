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
  
  // Get recent games
  // eslint-disable-next-line no-unused-vars
  const recentGames = await prisma.userGame.findMany({
    where: {
      userId,
    },
    include: {
      game: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 5,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Games</h2>
          <p className="text-3xl font-bold">{totalStats._count.id}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Currently Playing</h2>
          <p className="text-3xl font-bold">
            {statusCounts.find(s => s.status === 'CURRENTLY_PLAYING')?.count || 0}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Completed Games</h2>
          <p className="text-3xl font-bold">
            {statusCounts.find(s => s.status === 'COMPLETED')?.count || 0}
          </p>
        </div>
      </div>
      
      {/* Game Backlog Section - Bring this up top as primary focus */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Backlog</h2>
          <Link href="/games?status=BACKLOG" className="text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        
        {backlogGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {backlogGames.map(userGame => (
              <div key={userGame.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                ></div>
                
                <div className="p-4">
                  <h3 className="font-medium mb-1 truncate">{userGame.game.title}</h3>
                  
                  {userGame.queue && (
                    <p className="text-xs text-gray-600 mb-2">
                      Queue: {userGame.queue.name}
                    </p>
                  )}
                  
                  <div className="flex justify-between text-xs text-gray-600 mt-1 mb-3">
                    <span>Not started</span>
                    {userGame.game.hltbMainTime && (
                      <span>~{formatHours(userGame.game.hltbMainTime)} to beat</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/games/${userGame.id}/update`}
                      className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                    >
                      Start Playing
                    </Link>
                    <Link 
                      href={`/games/${userGame.id}/manage`}
                      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 text-center bg-blue-50">
              <h3 className="text-xl font-semibold mb-3">Build Your Game Backlog</h3>
              <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                Start by adding games to your backlog. Track your progress, organize them into queues, and see how long it will take to beat them all.
              </p>
              <Link 
                href="/games/add" 
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Your First Game
              </Link>
            </div>
            <div className="p-6 border-t">
              <h4 className="font-medium mb-2">With FuncoLand, you can:</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Track games across your entire collection
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Organize games into custom queues
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  See how long it will take to beat each game
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Currently Playing Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Currently Playing</h2>
          <Link href="/games?status=CURRENTLY_PLAYING" className="text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        
        {currentlyPlaying.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {currentlyPlaying.map(userGame => (
              <div key={userGame.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div 
                  className="h-40 bg-cover bg-center" 
                  style={{ backgroundImage: `url(${userGame.game.coverImageUrl || '/placeholder.jpg'})` }}
                ></div>
                
                <div className="p-4">
                  <h3 className="font-medium mb-1 truncate">{userGame.game.title}</h3>
                  
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-600 h-2.5 rounded-full" 
                        style={{ width: `${userGame.progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{userGame.progressPercent}% complete</span>
                      {userGame.game.hltbMainTime && (
                        <span>~{formatHours(userGame.game.hltbMainTime)}</span>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    href={`/games/${userGame.id}/update`}
                    className="inline-block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Update Progress
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">You're not currently playing any games.</p>
            {backlogGames.length > 0 ? (
              <p className="mt-2 text-gray-600">Start playing a game from your backlog to see it here.</p>
            ) : (
              <Link href="/games/add" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Add Games to Play
              </Link>
            )}
          </div>
        )}
      </section>
      
      {/* Game Queues Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Game Queues</h2>
          <Link href="/queues" className="text-blue-600 hover:text-blue-800">
            View All
          </Link>
        </div>
        
        {queuesWithStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {queuesWithStats.map(queue => (
              <div key={queue.id} className="bg-white rounded-lg shadow p-4">
                <Link href={`/queues/${queue.id}`} className="text-lg font-medium hover:text-blue-600">
                  {queue.name}
                </Link>
                
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Games</p>
                    <p className="font-semibold">{queue.stats.totalGames}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Time</p>
                    <p className="font-semibold">{formatHours(queue.stats.totalMainTime)}</p>
                  </div>
                </div>
                
                {queue.stats.totalMainTime > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (queue.stats.completedTime / queue.stats.totalMainTime) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {queue.games.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Next up:</p>
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 bg-cover bg-center rounded-full mr-3" 
                        style={{ backgroundImage: `url(${queue.games[0].game.coverImageUrl || '/placeholder.jpg'})` }}
                      ></div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{queue.games[0].game.title}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="bg-gray-50 rounded-lg shadow p-4 flex flex-col items-center justify-center text-center">
              <p className="text-gray-600 mb-3">Create a new queue to organize your games</p>
              <Link 
                href="/queues/new"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Create New Queue
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">You haven't created any game queues yet.</p>
            <Link href="/queues/new" className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              Create Your First Queue
            </Link>
          </div>
        )}
      </section>
      
      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/games/add"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h3 className="font-medium mb-1">Add New Game</h3>
            <p className="text-sm text-gray-600">Search and add games to your collection</p>
          </Link>
          
          <Link
            href="/queues/new"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h3 className="font-medium mb-1">Create Queue</h3>
            <p className="text-sm text-gray-600">Create a new queue for your games</p>
          </Link>
          
          <Link
            href="/games?status=BACKLOG"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h3 className="font-medium mb-1">View Backlog</h3>
            <p className="text-sm text-gray-600">See games waiting to be played</p>
          </Link>
          
          <Link
            href="/stats"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
          >
            <h3 className="font-medium mb-1">My Stats</h3>
            <p className="text-sm text-gray-600">View your gaming statistics</p>
          </Link>
        </div>
      </section>
    </div>
  );
}