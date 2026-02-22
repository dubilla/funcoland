import { NextResponse } from 'next/server';
import { searchGames, searchGamesDbOnly } from '@/lib/services/gameService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get query parameter
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const games = await searchGames(query);
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error searching games:', error);

    // IGDB failed — fall back to DB-only results and signal partial response
    try {
      const games = await searchGamesDbOnly(query);
      if (games.length > 0) {
        return NextResponse.json({ games, partial: true });
      }
    } catch {
      // DB also failed, fall through to 503
    }

    return NextResponse.json({ error: 'Search unavailable, please try again later' }, { status: 503 });
  }
}
