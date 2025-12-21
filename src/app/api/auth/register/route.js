import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Use PrismaClient as a singleton to prevent too many connections
const globalForPrisma = globalThis || {};
const prisma = globalForPrisma.prisma || new PrismaClient();

// Set Prisma on global object in development to prevent connection issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();
    
    console.log('Registration attempt:', { name, email, hasPassword: !!password });
    
    // Basic validation
    if (!email || !email.includes('@')) {
      console.log('Invalid email format');
      return NextResponse.json(
        { error: 'Please enter a valid email' },
        { status: 400 }
      );
    }
    
    if (!password || password.length < 8) {
      console.log('Password too short');
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name: name || email.split('@')[0], // Use part of email as name if none provided
        email,
        password: hashedPassword,
      },
    });
    
    console.log('User created successfully:', user.id);
    
    // Create default queue for user
    const queue = await prisma.gameQueue.create({
      data: {
        name: 'My Backlog',
        description: 'Default game backlog',
        userId: user.id,
        isDefault: true,
      },
    });
    
    console.log('Default queue created:', queue.id);
    
    // Return the user without the password
    // eslint-disable-next-line no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { user: userWithoutPassword, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}