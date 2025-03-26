import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reorderQueueGames } from '@/lib/services/gameService';
import prisma from '@/lib/db';

// Update a queue
export async function PATCH(request, { params }) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { name, description, gameOrders } = await request.json();
    
    // Verify this queue belongs to the current user
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
    
    // Update queue info if provided
    if (name || description !== undefined) {
      await prisma.gameQueue.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });
    }
    
    // Reorder games if provided
    if (gameOrders && gameOrders.length > 0) {
      await reorderQueueGames(id, gameOrders);
    }
    
    // Get updated queue
    const updatedQueue = await prisma.gameQueue.findUnique({
      where: { id },
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
    });
    
    return NextResponse.json({ queue: updatedQueue });
  } catch (error) {
    console.error('Error updating queue:', error);
    return NextResponse.json({ error: 'Failed to update queue' }, { status: 500 });
  }
}

// Delete a queue
export async function DELETE(request, { params }) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    // Verify this queue belongs to the current user
    const queue = await prisma.gameQueue.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });
    
    if (!queue) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }
    
    if (queue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Don't allow deletion of default queue
    if (queue.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default queue' }, { status: 400 });
    }
    
    // Remove games from this queue (but don't delete the user games)
    await prisma.userGame.updateMany({
      where: { queueId: id },
      data: {
        queueId: null,
        queuePosition: null,
      },
    });
    
    // Delete the queue
    await prisma.gameQueue.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting queue:', error);
    return NextResponse.json({ error: 'Failed to delete queue' }, { status: 500 });
  }
}