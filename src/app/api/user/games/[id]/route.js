import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { updateGameProgress } from '@/lib/services/gameService';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';

// Get a single user game
export async function GET(request, { params }) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    // Find the user game with its related game data
    const userGame = await prisma.userGame.findUnique({
      where: { id },
      include: {
        game: true,
        queue: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    if (!userGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Verify this game belongs to the current user
    if (userGame.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    return NextResponse.json({ userGame });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

// Update a user's game
export async function PATCH(request, { params }) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;
    const { progressPercent, status } = await request.json();
    
    // Verify this game belongs to the current user
    const userGame = await prisma.userGame.findUnique({
      where: { id },
      select: { userId: true },
    });
    
    if (!userGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (userGame.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Update the game
    // eslint-disable-next-line no-unused-vars
    const updatedUserGame = await updateGameProgress(id, progressPercent, status);

    // Get the full user game with related data for the response
    const fullUserGame = await prisma.userGame.findUnique({
      where: { id },
      include: {
        game: true,
        queue: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    return NextResponse.json({ userGame: fullUserGame });
  } catch (error) {
    console.error('Error updating game progress:', error);
    return NextResponse.json({ error: 'Failed to update game progress' }, { status: 500 });
  }
}

// Remove a game from user's collection
export async function DELETE(request, { params }) {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { id } = params;
    
    // Verify this game belongs to the current user
    const userGame = await prisma.userGame.findUnique({
      where: { id },
      select: { userId: true },
    });
    
    if (!userGame) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    if (userGame.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // Delete the user game
    await prisma.userGame.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing game from collection:', error);
    return NextResponse.json({ error: 'Failed to remove game from collection' }, { status: 500 });
  }
}