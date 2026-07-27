import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ req, token }) => {
      // Allow access to public routes
      const { pathname } = req.nextUrl;
      if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname === '/' ||
        pathname.startsWith('/schools') ||
        pathname.startsWith('/documents') ||
        pathname.startsWith('/cbse-rules') ||
        pathname.startsWith('/my-groups') ||
        pathname.startsWith('/unauthorized')
      ) {
        return true;
      }

      // Protect admin routes
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        if (!token) return false;
        
        // Check if user has admin-central group
        const userGroupKeys = (token as any).userGroupKeys || [];
        return userGroupKeys.includes('admin-central');
      }

      // Protect other routes
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    /*
     * Match only protected routes to reduce middleware overhead
     * Exclude: static files, images, favicon, public folder, and known public routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth|login|schools|documents|cbse-rules|my-groups|unauthorized).*)',
  ],
};
