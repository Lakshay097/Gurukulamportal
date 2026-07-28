import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const ALWAYS_PUBLIC = ["/login", "/api/auth", "/api/debug", "/unauthorized", "/external", "/view"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALWAYS_PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const externalCookie = req.cookies.get("external_access_token")?.value;

  if (isAdminRoute) {
    if (!nextAuthToken || !(nextAuthToken.groupKeys as string[] | undefined)?.includes("admin-central")) {
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
