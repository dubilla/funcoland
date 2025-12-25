import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  addTagToUserGame,
  removeTagFromUserGame,
  getTagsForUserGame,
} from '@/lib/services/gameService';
import prisma from '@/lib/db';
import { authOptions } from '@/lib/auth';

// Get all tags for a user game
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;

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

  const tags = await getTagsForUserGame(id);
  return NextResponse.json({ tags });
}

// Add a tag to a user game
export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;

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

  const { tag } = await request.json();

  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
  }

  try {
    const createdTag = await addTagToUserGame(id, tag);
    return NextResponse.json({ tag: createdTag.tag }, { status: 201 });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Tag already exists on this game' }, { status: 409 });
    }
    throw error;
  }
}

// Remove a tag from a user game
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;

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

  const { tag } = await request.json();

  if (!tag || typeof tag !== 'string') {
    return NextResponse.json({ error: 'Tag is required' }, { status: 400 });
  }

  try {
    await removeTagFromUserGame(id, tag);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Tag not found on this game' }, { status: 404 });
    }
    throw error;
  }
}
