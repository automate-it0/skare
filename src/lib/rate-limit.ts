// Rate limiter using in-memory token bucket (per-IP and per-user)
// Protects against brute-force auth attempts and API abuse

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min

function cleanup() {
  const now = Date.now();
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}
setInterval(cleanup, CLEANUP_INTERVAL);

/**
 * Check rate limit. Returns true if allowed, false if exceeded.
 * @param key - identifier (e.g. `auth:${ip}` or `api:${userId}`)
 * @param max - max requests in window
 * @param windowMs - window size in milliseconds
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: max - 1, resetAt: fresh.resetAt };
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count += 1;
  return { ok: true, remaining: max - b.count, resetAt: b.resetAt };
}

export function getClientIP(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
