import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAllUserTags } from '@/lib/services/gameService';
import { authOptions } from '@/lib/auth';

// Get all unique tags for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const tags = await getAllUserTags(session.user.id);
  return NextResponse.json({ tags });
}
