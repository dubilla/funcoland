import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGameQueue, createGameQueueWithFilters, getUserQueues } from '@/lib/services/gameService';

// Get user's queues
// eslint-disable-next-line no-unused-vars
export async function GET(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const queues = await getUserQueues(userId);

    // Calculate total playing time for each queue
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

    return NextResponse.json({ queues: queuesWithStats });
  } catch (error) {
    console.error('Error getting user queues:', error);
    return NextResponse.json({ error: 'Failed to get user queues' }, { status: 500 });
  }
}

// Create a new queue
export async function POST(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { name, description, filterTags } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Queue name is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Use the filter-aware function if tags are provided
    const queue = filterTags && filterTags.length > 0
      ? await createGameQueueWithFilters(userId, name, description, filterTags)
      : await createGameQueue(userId, name, description);

    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Error creating queue:', error);

    if (error.message?.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create queue' }, { status: 500 });
  }
}
