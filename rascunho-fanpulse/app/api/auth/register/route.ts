// =============================================================
// FanPulse — API Route: /api/auth/register
// =============================================================
// POST /api/auth/register → Registro de novo usuário
// Valida CPF, email único, hash de senha com bcrypt.
// =============================================================

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, queryOne } from '@/lib/db/client';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/anti-fraud/rate-limiter';
import { extractIPAddress } from '@/lib/anti-fraud/fingerprint';

export const dynamic = 'force-dynamic';

// ── Validação de CPF ─────────────────────────────────────────

function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  // CPFs com todos os dígitos iguais são inválidos
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Valida dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[10], 10)) return false;

  return true;
}

// ── Schema de Validação ──────────────────────────────────────

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255),
  cpf: z
    .string()
    .min(11, 'CPF inválido')
    .max(14)
    .refine((val) => isValidCPF(val), 'CPF inválido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// ── POST /api/auth/register ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ipAddress = extractIPAddress(request);
    const rateLimit = await checkRateLimit(ipAddress, AUTH_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return Response.json(
        { success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      );
    }

    // Valida body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, cpf, email, password } = validation.data;
    const cleanCPF = cpf.replace(/\D/g, '');
    const normalizedEmail = email.toLowerCase();

    // Verifica se email já existe
    const existingEmail = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existingEmail) {
      return Response.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 }
      );
    }

    // Verifica se CPF já existe
    const existingCPF = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE cpf = $1',
      [cleanCPF]
    );

    if (existingCPF) {
      return Response.json(
        { success: false, error: 'Este CPF já está cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Insere o usuário
    const db = sql();
    const result = await db`
      INSERT INTO users (name, cpf, email, password_hash)
      VALUES (${name}, ${cleanCPF}, ${normalizedEmail}, ${passwordHash})
      RETURNING id, name, email
    `;

    const newUser = result[0] as { id: string; name: string; email: string };

    // Gera JWT automaticamente (auto-login após cadastro)
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      secret,
      { expiresIn: '7d' }
    );

    const response = Response.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );

    // Set cookie seguro (auto-login)
    response.headers.set(
      'Set-Cookie',
      `fanpulse_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    return response;
  } catch (error) {
    console.error('[API /auth/register] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro interno ao criar conta' },
      { status: 500 }
    );
  }
}
