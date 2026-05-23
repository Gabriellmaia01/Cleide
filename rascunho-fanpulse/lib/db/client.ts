// =============================================================
// FanPulse — Cliente do Banco de Dados (Neon Postgres)
// =============================================================
// Utiliza o driver HTTP do Neon, ideal para ambientes serverless.
// Não abre conexões persistentes — cada query é um HTTP request.
// =============================================================

import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';

// Otimização: habilitar fetch caching para serverless
neonConfig.fetchConnectionCache = true;

let _db: NeonQueryFunction<false, false> | null = null;

/**
 * Retorna a instância singleton do cliente Neon SQL.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('❌ DATABASE_URL não definida. Configure no .env.local');
  }

  _db = neon(databaseUrl);
  return _db;
}

/**
 * Executa uma query usando tagged template literal (forma segura).
 * Parâmetros são automaticamente escapados pelo Neon.
 *
 * @example
 * const users = await sql()`SELECT * FROM users WHERE email = ${email}`;
 */

/**
 * Executa uma query com parâmetros posicionais ($1, $2, ...).
 * Útil quando o SQL é construído dinamicamente.
 *
 * @example
 * const users = await query('SELECT * FROM users WHERE email = $1', ['user@email.com']);
 */
export async function query<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = sql();
  const start = Date.now();

  try {
    // Constroi um tagged template literal a partir da string + params
    // O Neon aceita arrays de queries via .transaction()
    // Para queries dinâmicas, usamos a chamada direta
    const strings = sqlText.split(/\$\d+/);
    const templateStrings = Object.assign([...strings], { raw: strings });

    const result = (await db(
      templateStrings as unknown as TemplateStringsArray,
      ...params
    )) as T[];

    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - start;
      console.log(`[DB] ${duration}ms | ${sqlText.slice(0, 80)}...`);
    }

    return result;
  } catch (error) {
    console.error('[DB ERROR]', { sql: sqlText.slice(0, 200), params, error });
    throw error;
  }
}

/**
 * Executa uma query e retorna apenas o primeiro resultado.
 * Retorna null se não encontrar nada.
 */
export async function queryOne<T = Record<string, unknown>>(
  sqlText: string,
  params: unknown[] = []
): Promise<T | null> {
  const results = await query<T>(sqlText, params);
  return results[0] ?? null;
}
