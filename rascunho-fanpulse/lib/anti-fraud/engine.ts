// =============================================================
// FanPulse — Motor Anti-Fraude (4 Camadas)
// =============================================================
// Executa 4 verificações em paralelo para validar cada voto:
//   Layer 1: Rate Limiter (sliding window)
//   Layer 2: User Uniqueness (DB constraint)
//   Layer 3: IP Throttle por categoria
//   Layer 4: Fingerprint duplicate check
// =============================================================

import type { AntiFraudResult, VoteRequest } from '@/lib/types';
import { checkRateLimit, VOTE_RATE_LIMIT } from './rate-limiter';
import { getRedis } from '@/lib/api-football/cache';
import { queryOne } from '@/lib/db/client';

// ── Configuração ─────────────────────────────────────────────

/** Máximo de IPs diferentes que podem votar na mesma categoria */
const MAX_IPS_PER_CATEGORY = 3;

/** TTL do registro de IP/fingerprint no Redis (24 horas) */
const IP_THROTTLE_TTL_SECONDS = 24 * 60 * 60;

// ── Engine Principal ─────────────────────────────────────────

/**
 * Motor Anti-Fraude — valida um voto contra 4 camadas de proteção.
 *
 * Todas as verificações rodam em paralelo para minimizar latência.
 * A primeira falha encontrada é retornada como motivo de bloqueio.
 */
export async function validateVote(
  voteRequest: VoteRequest
): Promise<AntiFraudResult> {
  const { userId, categoryId, ipAddress, fingerprint } = voteRequest;

  // Executa todas as layers em paralelo
  const [rateLimitResult, userResult, ipResult, fpResult] = await Promise.all([
    checkLayer1_RateLimit(ipAddress),
    checkLayer2_UserUniqueness(userId, categoryId),
    checkLayer3_IPThrottle(ipAddress, categoryId),
    checkLayer4_Fingerprint(fingerprint, categoryId),
  ]);

  // Retorna a primeira falha encontrada (ordem de prioridade)
  if (!rateLimitResult.allowed) return rateLimitResult;
  if (!userResult.allowed) return userResult;
  if (!ipResult.allowed) return ipResult;
  if (!fpResult.allowed) return fpResult;

  return { allowed: true };
}

// ── Layer 1: Rate Limiter ────────────────────────────────────
// Limita a 5 requests de voto por minuto por IP.
// Protege contra bots e scripts automatizados.

async function checkLayer1_RateLimit(
  ipAddress: string
): Promise<AntiFraudResult> {
  const result = await checkRateLimit(ipAddress, VOTE_RATE_LIMIT);

  if (!result.allowed) {
    return {
      allowed: false,
      reason: 'RATE_LIMIT',
      cooldownSeconds: result.resetInSeconds,
    };
  }

  return { allowed: true };
}

// ── Layer 2: User Uniqueness ─────────────────────────────────
// Verifica se o usuário já votou nesta categoria.
// Usa constraint UNIQUE do Postgres como fonte de verdade.

async function checkLayer2_UserUniqueness(
  userId: string,
  categoryId: string
): Promise<AntiFraudResult> {
  try {
    const existingVote = await queryOne<{ id: string }>(
      'SELECT id FROM votes WHERE user_id = $1 AND category_id = $2 LIMIT 1',
      [userId, categoryId]
    );

    if (existingVote) {
      return {
        allowed: false,
        reason: 'USER_DUPLICATE',
      };
    }
  } catch {
    // Se o DB não está disponível, prossegue (as outras layers protegem)
    console.warn('[ANTI-FRAUD] Layer 2 (User Check) — DB indisponível, pulando');
  }

  return { allowed: true };
}

// ── Layer 3: IP Throttle ─────────────────────────────────────
// Limita o número de IPs únicos que podem votar na mesma categoria.
// Cada IP pode votar no máximo MAX_IPS_PER_CATEGORY vezes em 24h.

async function checkLayer3_IPThrottle(
  ipAddress: string,
  categoryId: string
): Promise<AntiFraudResult> {
  const redis = getRedis();
  if (!redis) {
    // Sem Redis, pula esta verificação
    return { allowed: true };
  }

  const key = `af:ip:${ipAddress}:cat:${categoryId}`;

  try {
    // Conta quantas vezes este IP votou nesta categoria
    const count = await redis.incr(key);

    // Define TTL apenas na primeira vez
    if (count === 1) {
      await redis.expire(key, IP_THROTTLE_TTL_SECONDS);
    }

    if (count > MAX_IPS_PER_CATEGORY) {
      return {
        allowed: false,
        reason: 'IP_LIMIT',
        cooldownSeconds: IP_THROTTLE_TTL_SECONDS,
      };
    }
  } catch (error) {
    console.error('[ANTI-FRAUD] Layer 3 (IP Throttle) erro:', error);
  }

  return { allowed: true };
}

// ── Layer 4: Fingerprint Check ───────────────────────────────
// Verifica se o mesmo dispositivo (fingerprint) já votou nesta categoria.
// Protege contra o mesmo dispositivo usando contas diferentes.

async function checkLayer4_Fingerprint(
  fingerprint: string,
  categoryId: string
): Promise<AntiFraudResult> {
  const redis = getRedis();
  if (!redis) {
    return { allowed: true };
  }

  const key = `af:fp:${fingerprint}:cat:${categoryId}`;

  try {
    // SETNX: só define se a chave não existir
    const wasSet = await redis.setnx(key, '1');

    if (wasSet) {
      // Primeira vez — define TTL
      await redis.expire(key, IP_THROTTLE_TTL_SECONDS);
      return { allowed: true };
    }

    // Já existia — fingerprint duplicado
    return {
      allowed: false,
      reason: 'FINGERPRINT_DUPLICATE',
      cooldownSeconds: IP_THROTTLE_TTL_SECONDS,
    };
  } catch (error) {
    console.error('[ANTI-FRAUD] Layer 4 (Fingerprint) erro:', error);
  }

  return { allowed: true };
}

// ── Utilitários ──────────────────────────────────────────────

/**
 * Mensagens de erro amigáveis para cada tipo de fraude.
 */
export function getFraudMessage(result: AntiFraudResult): string {
  switch (result.reason) {
    case 'RATE_LIMIT':
      return 'Muitas tentativas. Aguarde um momento antes de votar novamente.';
    case 'USER_DUPLICATE':
      return 'Você já votou nesta categoria. Cada usuário pode votar apenas uma vez.';
    case 'IP_LIMIT':
      return 'Limite de votos atingido para este endereço. Tente novamente em 24 horas.';
    case 'FINGERPRINT_DUPLICATE':
      return 'Este dispositivo já foi usado para votar nesta categoria.';
    default:
      return 'Voto não permitido.';
  }
}
