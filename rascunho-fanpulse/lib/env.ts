// =============================================================
// FanPulse — Validação de variáveis de ambiente
// =============================================================

import { z } from 'zod';

const envSchema = z.object({
  // API-Football
  API_FOOTBALL_KEY: z.string().min(1, 'API_FOOTBALL_KEY é obrigatória'),
  API_FOOTBALL_BASE_URL: z
    .string()
    .url()
    .default('https://v3.football.api-sports.io'),

  // Banco de Dados (Neon Postgres)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  // Upstash Redis (KV)
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL inválida'),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN é obrigatório'),

  // Autenticação
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Cron secret (para proteger endpoints de cron)
  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Variáveis de ambiente validadas.
 * Lança um erro descritivo se alguma variável obrigatória estiver faltando.
 */
function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const missingVars = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    throw new Error(
      `❌ Variáveis de ambiente inválidas:\n${missingVars}\n\n` +
        `Copie .env.example para .env.local e preencha os valores.`
    );
  }

  return parsed.data;
}

/**
 * Acesso lazy às env vars — só valida no primeiro acesso.
 * Evita erros durante o build estático do Next.js.
 */
let _env: Env | null = null;

export function env(): Env {
  if (!_env) {
    _env = getEnv();
  }
  return _env;
}

/**
 * Acesso seguro para variáveis individuais (sem validação completa).
 * Útil quando nem todas as vars estão disponíveis (ex: build time).
 */
export function getEnvSafe(key: keyof Env): string | undefined {
  return process.env[key];
}
