// =============================================================
// FanPulse — Fingerprint Server-Side
// =============================================================
// Gera um fingerprint único baseado em headers do request.
// Não depende de JavaScript client-side.
// =============================================================

import { createHash } from 'crypto';

/**
 * Dados coletados do request para gerar o fingerprint.
 */
interface FingerprintData {
  ipAddress: string;
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding?: string;
}

/**
 * Gera um fingerprint SHA-256 baseado nos headers do request.
 *
 * Combina:
 * - IP Address
 * - User-Agent
 * - Accept-Language
 * - Accept-Encoding
 *
 * O fingerprint é determinístico — mesmos inputs sempre geram o mesmo hash.
 * Não é 100% único (NAT pode compartilhar IP), mas é uma camada
 * adicional de proteção quando combinado com as outras verificações.
 */
export function generateFingerprint(data: FingerprintData): string {
  const raw = [
    data.ipAddress,
    data.userAgent,
    data.acceptLanguage,
    data.acceptEncoding ?? '',
  ].join('|');

  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

/**
 * Extrai os dados de fingerprint de um Request/NextRequest.
 */
export function extractFingerprintData(request: Request): FingerprintData {
  const headers = request.headers;

  return {
    ipAddress: extractIPAddress(request),
    userAgent: headers.get('user-agent') ?? 'unknown',
    acceptLanguage: headers.get('accept-language') ?? 'unknown',
    acceptEncoding: headers.get('accept-encoding') ?? undefined,
  };
}

/**
 * Extrai o IP real do request.
 *
 * Na Vercel, o IP é injetado pelo edge no header `x-forwarded-for`.
 * Em desenvolvimento, usamos 127.0.0.1 como fallback.
 */
export function extractIPAddress(request: Request): string {
  const headers = request.headers;

  // Vercel injeta o IP real
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for pode ter múltiplos IPs: "client, proxy1, proxy2"
    return xForwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnecting = headers.get('cf-connecting-ip');
  if (cfConnecting) return cfConnecting;

  // Fallback real IP header
  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;

  // Dev environment
  return '127.0.0.1';
}
