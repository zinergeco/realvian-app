/**
 * RATE LIMITING — honest about what this actually is.
 *
 * This is an in-memory counter, not Redis-backed. That means two real
 * limitations, stated plainly rather than glossed over:
 *   1. It resets to zero on every deploy or restart.
 *   2. If this app ever runs as more than one instance, each instance
 *      has its own independent counter — a caller could get roughly
 *      N× the stated limit by hitting different instances.
 * Both are fine for where this project actually is right now (single
 * instance, low-to-moderate traffic) and were the honest, buildable
 * option today rather than standing up Redis for a beta API. If usage
 * ever justifies it, this is the file to swap for a shared store.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000; // 1 minute
const ANONYMOUS_LIMIT = 30; // requests per minute, per IP
const API_KEY_LIMIT = 120; // requests per minute, per key

const buckets = new Map<string, Bucket>();

// Without this, `buckets` would grow forever — every distinct IP or
// key that's ever called the API stays in memory until the process
// restarts. A periodic sweep keeps it bounded.
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();
function sweepIfDue() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // unix ms
}

export function checkRateLimit(identifier: string, hasApiKey: boolean): RateLimitResult {
  sweepIfDue();

  const limit = hasApiKey ? API_KEY_LIMIT : ANONYMOUS_LIMIT;
  const now = Date.now();
  const existing = buckets.get(identifier);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    buckets.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, limit, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.windowStart + WINDOW_MS,
  };
}

/** Standard rate-limit response headers, added to every API response so
 * a well-behaved client can self-throttle before actually hitting 429. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
