import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Allow access to public routes
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/debug') ||
    pathname === '/' ||
    pathname.startsWith('/schools') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/cbse-rules') ||
    pathname.startsWith('/my-groups') ||
    pathname.startsWith('/unauthorized')
  ) {
    return NextResponse.next();
  }

  // Get the token
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  // Protect admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check if user has admin-central group
    const userGroupKeys = (token as any).userGroupKeys || [];
    if (!userGroupKeys.includes('admin-central')) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
    
    return NextResponse.next();
  }

  // Protect other routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match only protected routes to reduce middleware overhead
     * Exclude: static files, images, favicon, public folder, and known public routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|api/auth|login|schools|documents|cbse-rules|my-groups|unauthorized).*)',
  ],
};
