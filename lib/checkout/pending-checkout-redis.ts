/**
 * Upstash Redis client for pending checkout KV records (LOC-1159).
 *
 * Reads Vercel KV / Upstash REST env vars. Returns null when unconfigured so
 * callers can fail safely in production and tests can inject mocks.
 */

import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

/**
 * Resolves Upstash REST credentials from Vercel KV or Upstash env names.
 */
function resolvePendingCheckoutRedisCredentials(): {
  url: string;
  token: string;
} | null {
  const url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

/**
 * Returns a singleton Upstash Redis client, or null when credentials are missing.
 */
export function getPendingCheckoutRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const credentials = resolvePendingCheckoutRedisCredentials();
  if (!credentials) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: credentials.url,
    token: credentials.token,
  });
  return redisClient;
}

/**
 * Clears the cached client — used by tests to inject mocks or reset env changes.
 */
export function resetPendingCheckoutRedisClientForTests(): void {
  redisClient = undefined;
}

/**
 * Overrides the Redis client for unit tests.
 *
 * @param client - Mock Redis or null to simulate missing configuration
 */
export function setPendingCheckoutRedisClientForTests(
  client: Redis | null,
): void {
  redisClient = client;
}
