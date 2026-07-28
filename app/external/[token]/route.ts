import { NextRequest, NextResponse } from "next/server";
import { validateExternalToken, touchExternalToken } from "@/lib/external-tokens";
import { enforceRateLimit } from "@/lib/rate-limit-response";

const COOKIE_NAME = "external_access_token";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  // 20 attempts/minute per IP — generous for real use, useless for brute-forcing
  const { blocked } = enforceRateLimit(req, "external-token-exchange", { limit: 20, windowSeconds: 60 });
  if (blocked) return blocked;

  const validation = await validateExternalToken(params.token);
  if (!validation.ok) {
    return NextResponse.redirect(new URL(`/unauthorized?reason=${validation.reason}`, req.url));
  }

  await touchExternalToken(params.token);

  const response = NextResponse.redirect(new URL("/documents", req.url));
  response.cookies.set(COOKIE_NAME, params.token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // no maxAge — lifetime governed by expiresAt in Firestore, re-checked every request
  });
  return response;
}
