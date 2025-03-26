import { NextResponse } from 'next/server';
import { searchGames } from '@/lib/services/gameService';
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
    return NextResponse.json({ error: 'Failed to search games' }, { status: 500 });
  }
}