import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, type RateLimitResult } from "./rate-limit";

export function enforceRateLimit(
  req: Request,
  routeKey: string,
  opts: { limit: number; windowSeconds: number }
): { blocked: NextResponse | null; result: RateLimitResult } {
  const ip = getClientIp(req);
  const result = checkRateLimit(`${routeKey}:${ip}`, opts);

  if (!result.allowed) {
    const blocked = NextResponse.json(
      { error: "rate_limited", retryAfterSeconds: result.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
    );
    return { blocked, result };
  }

  return { blocked: null, result };
}
