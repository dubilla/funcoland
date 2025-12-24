import { NextResponse } from 'next/server';
import { addGameFromIgdb } from '@/lib/services/gameService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add a game from IGDB to our database
export async function POST(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { igdbId } = await request.json();

    if (!igdbId) {
      return NextResponse.json({ error: 'IGDB ID is required' }, { status: 400 });
    }

    const game = await addGameFromIgdb(igdbId);
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error adding game:', error);
    return NextResponse.json({ error: `Failed to add game: ${error.message}` }, { status: 500 });
  }
}
