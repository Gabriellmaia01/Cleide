// =============================================================
// FanPulse — API Route: /api/auth/login
// =============================================================
// POST /api/auth/login → Autenticação com email/senha
// Retorna JWT via HttpOnly cookie (seguro).
// =============================================================

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db/client';
import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/anti-fraud/rate-limiter';
import { extractIPAddress } from '@/lib/anti-fraud/fingerprint';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting na autenticação (5 tentativas / 15 min)
    const ipAddress = extractIPAddress(request);
    const rateLimit = await checkRateLimit(ipAddress, AUTH_RATE_LIMIT);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          error: 'Muitas tentativas. Tente novamente em alguns minutos.',
        },
        { status: 429 }
      );
    }

    // Valida body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return Response.json(
        { success: false, error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Busca usuário pelo email
    const user = await queryOne<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
    }>(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // RF02: Mensagem genérica para não revelar se o email existe
    if (!user) {
      return Response.json(
        { success: false, error: 'Email ou senha incorretos. Tente novamente.' },
        { status: 401 }
      );
    }

    // Verifica senha
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return Response.json(
        { success: false, error: 'Email ou senha incorretos. Tente novamente.' },
        { status: 401 }
      );
    }

    // Gera JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '7d' }
    );

    // Retorna com HttpOnly cookie
    const response = Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    // Set cookie seguro
    response.headers.set(
      'Set-Cookie',
      `fanpulse_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );

    return response;
  } catch (error) {
    console.error('[API /auth/login] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
