import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory fallback for local development or testing without Upstash configured
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetAt,
  };
}

let webhookRatelimitInstance: Ratelimit | null = null;
let readRatelimitInstance: Ratelimit | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Webhook: 10 requests per 60 seconds sliding window
  webhookRatelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 s'),
    analytics: true,
    prefix: 'commitcosmos:webhook',
  });

  // Read endpoints: 30 requests per 60 seconds sliding window
  readRatelimitInstance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
    prefix: 'commitcosmos:read',
  });
}

/**
 * Checks rate limits for webhook events (10 requests per 60 seconds per IP).
 */
export async function checkWebhookRateLimit(identifier: string) {
  if (webhookRatelimitInstance) {
    return webhookRatelimitInstance.limit(identifier);
  }

  return inMemoryRateLimit(`webhook:${identifier}`, 10, 60);
}

/**
 * Checks rate limits for public read endpoints (30 requests per 60 seconds per IP).
 */
export async function checkReadRateLimit(identifier: string) {
  if (readRatelimitInstance) {
    return readRatelimitInstance.limit(identifier);
  }

  return inMemoryRateLimit(`read:${identifier}`, 30, 60);
}
