// =============================================================
// FanPulse — API Route: /api/auth/me
// =============================================================
// GET    /api/auth/me → Retorna dados do usuário logado
// DELETE /api/auth/me → Logout (remove cookie)
// =============================================================

import { type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { queryOne } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

// ── GET /api/auth/me ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('fanpulse_token')?.value;

    if (!token) {
      return Response.json(
        { success: false, error: 'Não autenticado', user: null },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return Response.json(
        { success: false, error: 'Configuração de autenticação inválida' },
        { status: 500 }
      );
    }

    // Verifica JWT
    let decoded: { userId: string; email: string };
    try {
      decoded = jwt.verify(token, secret) as { userId: string; email: string };
    } catch {
      // Token inválido ou expirado
      const response = Response.json(
        { success: false, error: 'Sessão expirada', user: null },
        { status: 401 }
      );
      // Remove cookie inválido
      response.headers.set(
        'Set-Cookie',
        'fanpulse_token=; Path=/; HttpOnly; Max-Age=0'
      );
      return response;
    }

    // Busca dados atualizados do usuário
    const user = await queryOne<{
      id: string;
      name: string;
      email: string;
      created_at: string;
    }>(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      const response = Response.json(
        { success: false, error: 'Usuário não encontrado', user: null },
        { status: 404 }
      );
      response.headers.set(
        'Set-Cookie',
        'fanpulse_token=; Path=/; HttpOnly; Max-Age=0'
      );
      return response;
    }

    // Busca quantos votos o usuário já fez
    const voteCount = await queryOne<{ total: string }>(
      'SELECT COUNT(*) as total FROM votes WHERE user_id = $1',
      [user.id]
    );

    return Response.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
        totalVotes: parseInt(voteCount?.total ?? '0', 10),
      },
    });
  } catch (error) {
    console.error('[API /auth/me] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/auth/me (Logout) ─────────────────────────────

export async function DELETE() {
  const response = Response.json({
    success: true,
    message: 'Logout realizado com sucesso',
  });

  // Remove o cookie de autenticação
  response.headers.set(
    'Set-Cookie',
    'fanpulse_token=; Path=/; HttpOnly; Max-Age=0'
  );

  return response;
}
