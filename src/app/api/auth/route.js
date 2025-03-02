import NextAuth from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import EmailProvider from 'next-auth/providers/email'

const prisma = new PrismaClient()

export const authOptions = {
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    // Add other providers here
  ],
  adapter: PrismaAdapter(prisma),
  // Add other configuration options here
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

