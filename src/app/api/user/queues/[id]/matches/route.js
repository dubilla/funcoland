import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { findNewQueueMatches } from '@/lib/services/gameService';
import prisma from '@/lib/db';

// Get games that match queue filters but aren't in the queue
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;

  const queue = await prisma.gameQueue.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!queue) {
    return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
  }

  if (queue.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const matches = await findNewQueueMatches(id);
  return NextResponse.json({ matches });
}
