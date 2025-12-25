import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// eslint-disable-next-line no-unused-vars
import { addGameToUserCollection, updateGameProgress } from '@/lib/services/gameService';
import prisma from '@/lib/db';

// Add a game to user's collection
export async function POST(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { gameId, queueId, status } = await request.json();

    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }

    const userId = session.user.id;
    const userGame = await addGameToUserCollection(userId, gameId, { queueId, status });

    return NextResponse.json({ userGame });
  } catch (error) {
    console.error('Error adding game to collection:', error);
    return NextResponse.json({ error: 'Failed to add game to collection' }, { status: 500 });
  }
}

// Get user's games
export async function GET(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = session.user.id;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const userGames = await prisma.userGame.findMany({
      where,
      include: {
        game: true,
        queue: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ userGames });
  } catch (error) {
    console.error('Error getting user games:', error);
    return NextResponse.json({ error: 'Failed to get user games' }, { status: 500 });
  }
}
