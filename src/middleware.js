import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If there's an issue with token decoding, log it for debugging
  if (!token && req.cookies.has('next-auth.session-token')) {
    console.log('Invalid session token detected, clearing cookies');
  }

  // Allow authentication routes and public routes
  const isAuthPage = req.nextUrl.pathname.startsWith('/signin') || 
                     req.nextUrl.pathname.startsWith('/auth') ||
                     req.nextUrl.pathname === '/clear-cookies';
  
  // Public pages that don't require authentication
  const isPublicPage = req.nextUrl.pathname === '/' || 
                       req.nextUrl.pathname.startsWith('/api/auth');

  // Redirect to login if accessing protected page without being logged in
  if (!token && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  // Redirect to dashboard if accessing login page while logged in
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next (all other Next.js files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - api/auth (Next Auth API routes)
     */
    '/((?!_next/static|_next/image|_next|favicon.ico|public|api/auth).*)',
  ],
};