'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function QueueCard({ queue }) {
  const { id, name, games, stats } = queue;
  const [isExpanded, setIsExpanded] = useState(false);

  // Format time in hours
  const formatHours = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow bg-white">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <Link href={`/queues/${id}`} className="text-lg font-medium hover:text-blue-600">
            {name}
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Hide' : 'Show'} Games
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Games</p>
            <p className="font-semibold text-lg">{stats.totalGames}</p>
          </div>
          <div>
            <p className="text-gray-600">Playtime</p>
            <p className="font-semibold text-lg">{formatHours(stats.totalMainTime)}</p>
          </div>
          <div>
            <p className="text-gray-600">Completed</p>
            <p className="font-semibold text-lg">{formatHours(stats.completedTime)}</p>
          </div>
          <div>
            <p className="text-gray-600">Remaining</p>
            <p className="font-semibold text-lg">{formatHours(stats.remainingTime)}</p>
          </div>
        </div>

        {/* Progress bar */}
        {stats.totalMainTime > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, (stats.completedTime / stats.totalMainTime) * 100)}%`
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {Math.round((stats.completedTime / stats.totalMainTime) * 100)}% complete
            </p>
          </div>
        )}
      </div>

      {/* Game list (expandable) */}
      {isExpanded && games.length > 0 && (
        <div className="p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Games in Queue</h3>
          <div className="space-y-2">
            {/* eslint-disable-next-line no-unused-vars */}
            {games.map(({ id, game, progressPercent, queuePosition }) => (
              <div key={id} className="flex items-center p-2 rounded hover:bg-gray-100">
                <div className="w-8 h-8 relative overflow-hidden rounded mr-3 flex-shrink-0">
                  {game.coverImageUrl ? (
                    <Image
                      src={game.coverImageUrl}
                      alt={game.title}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{game.title}</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{progressPercent}% complete</span>
                    {game.hltbMainTime && (
                      <span>{formatHours(game.hltbMainTime)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isExpanded && games.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No games in this queue yet. Add some games to get started!
        </div>
      )}
    </div>
  );
}
