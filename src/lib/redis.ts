import { Redis } from '@upstash/redis';

// In-Memory cache fallback if UPSTASH_REDIS_REST_URL is not set
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

let redisClient: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.warn('Redis client initialization failed, falling back to memory cache:', err);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (redisClient) {
      const data = await redisClient.get<T>(key);
      return data;
    }
  } catch (err) {
    console.error(`Redis GET error for key "${key}":`, err);
  }

  // In-memory fallback
  const item = memoryCache.get(key);
  if (item) {
    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }
  return null;
}

export async function setCache(key: string, value: any, ttlSeconds = 60): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.set(key, value, { ex: ttlSeconds });
      return;
    }
  } catch (err) {
    console.error(`Redis SET error for key "${key}":`, err);
  }

  // In-memory fallback
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function deleteCache(key: string): Promise<void> {
  try {
    if (redisClient) {
      await redisClient.del(key);
      return;
    }
  } catch (err) {
    console.error(`Redis DEL error for key "${key}":`, err);
  }

  memoryCache.delete(key);
}
