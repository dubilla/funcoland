import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Use standard NextAuth handler without custom middleware
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

