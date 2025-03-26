import { PrismaClient } from '@prisma/client';

// Use PrismaClient as a singleton to prevent too many connections
const globalForPrisma = globalThis || {};
const prisma = globalForPrisma.prisma || new PrismaClient();

// Set Prisma on global object in development to prevent connection issues
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;