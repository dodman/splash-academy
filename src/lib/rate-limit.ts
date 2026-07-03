// Simple in-memory token bucket. Good enough for MVP / single-node.
// For production multi-node, swap for @upstash/ratelimit.
import { RateLimitError } from "./errors";

type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();

interface LimitOptions {
  /** Max tokens (burst) */
  capacity: number;
  /** Tokens refilled per second */
  refillPerSecond: number;
}

export function rateLimit(key: string, opts: LimitOptions): void {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: opts.capacity, updatedAt: now };
  const elapsed = (now - b.updatedAt) / 1000;
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSecond);
  b.updatedAt = now;

  if (b.tokens < 1) {
    buckets.set(key, b);
    throw new RateLimitError("Rate limit exceeded. Please try again in a moment.");
  }

  b.tokens -= 1;
  buckets.set(key, b);
}

export const LIMITS = {
  chat: { capacity: 10, refillPerSecond: 0.5 },      // ~30 req/min sustained
  upload: { capacity: 3, refillPerSecond: 10 / 60 }, // ~10 req/min
  register: { capacity: 5, refillPerSecond: 5 / 60 },
  quiz: { capacity: 5, refillPerSecond: 10 / 60 },
  // Sensitive unauthenticated endpoints — keep tight to slow brute force.
  auth: { capacity: 8, refillPerSecond: 8 / 60 },    // ~8/min sustained, burst 8
} as const;

/** Best-effort client IP from proxy headers (falls back to a shared bucket). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Apply a rate limit keyed by a scope + the caller's IP. Throws RateLimitError
 * when exceeded. Use in unauthenticated routes where there is no user id.
 */
export function rateLimitByIp(
  scope: string,
  req: Request,
  opts: LimitOptions = LIMITS.auth
): void {
  rateLimit(`${scope}:${clientIp(req)}`, opts);
}
