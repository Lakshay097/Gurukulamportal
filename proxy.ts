import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const ALWAYS_PUBLIC = ["/login", "/api/auth", "/api/debug", "/unauthorized", "/external", "/view"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip proxy for static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname.startsWith('/favicon.ico') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Skip proxy for public assets
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/)) {
    return NextResponse.next();
  }

  // Skip proxy for all API routes (let them handle their own auth)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (ALWAYS_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const externalCookie = req.cookies.get("external_access_token")?.value;

  if (isAdminRoute) {
    if (!nextAuthToken || !(nextAuthToken.userGroupKeys as string[] | undefined)?.includes("admin-central")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  if (!nextAuthToken && !externalCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (static images)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api).*)",
  ],
};
