interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map doesn't grow unbounded
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 5 * 60_000) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter. `key` should be scoped per-route + per-IP,
 * e.g. `external:${ip}` or `share-page:${ip}`, so different endpoints
 * don't share the same budget.
 */
export function checkRateLimit(
  key: string,
  opts: { limit: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: opts.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= opts.limit) {
    const retryAfterSeconds = Math.ceil((bucket.windowStart + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.limit - bucket.count, retryAfterSeconds: 0 };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
