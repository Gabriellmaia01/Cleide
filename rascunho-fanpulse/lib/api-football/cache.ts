// =============================================================
// FanPulse — Sistema de Cache 2 Camadas para API-Football
// =============================================================
// Camada 1: In-memory (Map) com TTL curto (5 min)
// Camada 2: Upstash Redis com TTL longo (1 hora)
// =============================================================

import { Redis } from '@upstash/redis';

// ── Camada 1: Cache In-Memory ────────────────────────────────

interface MemoryCacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, MemoryCacheEntry<unknown>>();

const MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setInMemory<T>(key: string, data: T, ttlMs: number = MEMORY_TTL_MS): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });

  // Limpeza lazy: remove entradas expiradas quando o cache cresce
  if (memoryCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of memoryCache) {
      if (now > v.expiresAt) memoryCache.delete(k);
    }
  }
}

// ── Camada 2: Redis (Upstash) ────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[CACHE] Upstash Redis não configurado — usando apenas cache in-memory');
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

const REDIS_TTL_SECONDS = 60 * 60; // 1 hora

async function getFromRedis<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error('[CACHE] Erro ao ler do Redis:', error);
    return null;
  }
}

async function setInRedis<T>(key: string, data: T, ttlSeconds: number = REDIS_TTL_SECONDS): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch (error) {
    console.error('[CACHE] Erro ao escrever no Redis:', error);
  }
}

// ── API Pública do Cache ─────────────────────────────────────

/**
 * Busca um valor no cache com estratégia de 2 camadas.
 *
 * Fluxo:
 *   Memory (5min) → Redis (1h) → null (cache miss)
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  // Camada 1: Memory
  const memResult = getFromMemory<T>(key);
  if (memResult !== null) {
    return memResult;
  }

  // Camada 2: Redis
  const redisResult = await getFromRedis<T>(key);
  if (redisResult !== null) {
    // Promove para memory cache
    setInMemory(key, redisResult);
    return redisResult;
  }

  return null;
}

/**
 * Salva um valor em ambas as camadas de cache.
 */
export async function cacheSet<T>(
  key: string,
  data: T,
  options?: {
    memoryTtlMs?: number;
    redisTtlSeconds?: number;
  }
): Promise<void> {
  const memTtl = options?.memoryTtlMs ?? MEMORY_TTL_MS;
  const redisTtl = options?.redisTtlSeconds ?? REDIS_TTL_SECONDS;

  // Salva em ambas as camadas em paralelo
  setInMemory(key, data, memTtl);
  await setInRedis(key, data, redisTtl);
}

/**
 * Remove um valor de ambas as camadas de cache.
 */
export async function cacheDelete(key: string): Promise<void> {
  memoryCache.delete(key);

  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('[CACHE] Erro ao deletar do Redis:', error);
    }
  }
}

/**
 * Wrapper "cache-aside" — busca do cache ou executa a função e salva.
 *
 * @example
 * const players = await cacheGetOrFetch('players:brazil', () => apiClient.getSquad(6));
 */
export async function cacheGetOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    memoryTtlMs?: number;
    redisTtlSeconds?: number;
  }
): Promise<T> {
  // Tenta cache primeiro
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss — executa a função
  const data = await fetchFn();

  // Salva no cache (fire-and-forget)
  cacheSet(key, data, options).catch((err) =>
    console.error('[CACHE] Erro ao salvar:', err)
  );

  return data;
}

/**
 * Exporta o Redis client para uso direto (anti-fraude, rate limiting).
 */
export { getRedis };
