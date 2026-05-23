// =============================================================
// FanPulse — Rate Limiter (Sliding Window)
// =============================================================
// Implementação de rate limiting com janela deslizante usando
// Upstash Redis. Fallback para in-memory quando Redis indisponível.
// =============================================================

import { getRedis } from '@/lib/api-football/cache';

// ── In-Memory Fallback ───────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitEntry>();

// Limpeza periódica do store in-memory
function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    // Remove timestamps mais velhos que 2 minutos
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}

// Limpa a cada 60 segundos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 60_000);
}

// ── Rate Limiter Principal ───────────────────────────────────

export interface RateLimitConfig {
  /** Número máximo de requests permitidos na janela */
  maxRequests: number;
  /** Tamanho da janela em segundos */
  windowSeconds: number;
  /** Prefixo para a chave no Redis */
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
  totalInWindow: number;
}

/**
 * Verifica rate limit usando sliding window algorithm.
 *
 * @param identifier - Identificador único (IP, userId, etc.)
 * @param config - Configuração do rate limit
 * @returns Resultado indicando se o request é permitido
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (redis) {
    return checkRateLimitRedis(identifier, config, redis);
  }

  return checkRateLimitMemory(identifier, config);
}

// ── Implementação Redis (Produção) ───────────────────────────

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig,
  redis: NonNullable<ReturnType<typeof getRedis>>
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const windowStart = now - windowMs;

  try {
    // Pipeline atômico:
    // 1. Remove timestamps fora da janela
    // 2. Adiciona timestamp atual
    // 3. Conta timestamps na janela
    // 4. Define TTL

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    pipeline.zcard(key);
    pipeline.expire(key, config.windowSeconds + 1);

    const results = await pipeline.exec();
    const totalInWindow = (results[2] as number) ?? 0;

    const allowed = totalInWindow <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - totalInWindow);

    // Se não permitido, remove o timestamp que acabamos de adicionar
    if (!allowed) {
      await redis.zremrangebyscore(key, now, now + 1);
    }

    return {
      allowed,
      remaining,
      resetInSeconds: config.windowSeconds,
      totalInWindow,
    };
  } catch (error) {
    console.error('[RATE-LIMIT] Erro no Redis, usando fallback in-memory:', error);
    return checkRateLimitMemory(identifier, config);
  }
}

// ── Implementação In-Memory (Fallback) ───────────────────────

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(key, entry);
  }

  // Remove timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  const totalInWindow = entry.timestamps.length;
  const allowed = totalInWindow < config.maxRequests;

  if (allowed) {
    entry.timestamps.push(now);
  }

  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - totalInWindow - (allowed ? 1 : 0)),
    resetInSeconds: config.windowSeconds,
    totalInWindow: totalInWindow + (allowed ? 1 : 0),
  };
}

// ── Configurações pré-definidas ──────────────────────────────

/** Rate limit global: 10 requests por minuto por IP */
export const GLOBAL_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
  keyPrefix: 'rl:global',
};

/** Rate limit de votação: 5 votos por minuto por IP */
export const VOTE_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60,
  keyPrefix: 'rl:vote',
};

/** Rate limit de autenticação: 5 tentativas por 15 minutos */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 900,
  keyPrefix: 'rl:auth',
};
