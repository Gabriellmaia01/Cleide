// =============================================================
// FanPulse — API Route: /api/vote
// =============================================================
// POST /api/vote  → Registrar um voto (com anti-fraude)
// GET  /api/vote  → Consultar votos por categoria
// =============================================================

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import { validateVote, getFraudMessage } from '@/lib/anti-fraud/engine';
import { extractIPAddress, extractFingerprintData, generateFingerprint } from '@/lib/anti-fraud/fingerprint';
import { sql, queryOne, query } from '@/lib/db/client';
import { cacheDelete } from '@/lib/api-football/cache';

export const dynamic = 'force-dynamic';

// ── Schema de Validação ──────────────────────────────────────

const voteSchema = z.object({
  playerId: z.string().uuid('ID do jogador inválido'),
  categorySlug: z.string().min(1, 'Categoria é obrigatória'),
});

// ── POST /api/vote ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Parse e valida o body
    const body = await request.json();
    const validation = voteSchema.safeParse(body);

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

    const { playerId, categorySlug } = validation.data;

    // 2. Verifica autenticação (JWT no cookie)
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return Response.json(
        { success: false, error: 'Faça login para votar' },
        { status: 401 }
      );
    }

    // 3. Busca o category ID pelo slug
    const category = await queryOne<{ id: string }>(
      'SELECT id FROM vote_categories WHERE slug = $1 AND is_active = true',
      [categorySlug]
    );

    if (!category) {
      return Response.json(
        { success: false, error: 'Categoria não encontrada ou inativa' },
        { status: 404 }
      );
    }

    // 4. Extrai dados de anti-fraude do request
    const ipAddress = extractIPAddress(request);
    const fpData = extractFingerprintData(request);
    const fingerprint = generateFingerprint(fpData);

    // 5. Executa o motor anti-fraude (4 camadas em paralelo)
    const fraudResult = await validateVote({
      playerId,
      categoryId: category.id,
      userId,
      ipAddress,
      fingerprint,
    });

    if (!fraudResult.allowed) {
      const message = getFraudMessage(fraudResult);
      const status = fraudResult.reason === 'RATE_LIMIT' ? 429 : 409;

      return Response.json(
        {
          success: false,
          error: message,
          reason: fraudResult.reason,
          cooldownSeconds: fraudResult.cooldownSeconds,
        },
        { status }
      );
    }

    // 6. Insere o voto no banco de dados
    const db = sql();
    try {
      await db`
        INSERT INTO votes (player_id, category_id, user_id, ip_address, fingerprint)
        VALUES (${playerId}, ${category.id}, ${userId}, ${ipAddress}, ${fingerprint})
      `;
    } catch (error: unknown) {
      // Constraint violation = voto duplicado (layer 2 do anti-fraude a nível de DB)
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        return Response.json(
          {
            success: false,
            error: 'Você já votou nesta categoria',
            reason: 'USER_DUPLICATE',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    // 7. Invalida cache do ranking para esta categoria
    await cacheDelete(`ranking:${categorySlug}`);
    await cacheDelete(`ranking:live`);

    // 8. Busca contagem atualizada
    const voteCount = await queryOne<{ total: string }>(
      'SELECT COUNT(*) as total FROM votes WHERE player_id = $1 AND category_id = $2',
      [playerId, category.id]
    );

    return Response.json(
      {
        success: true,
        message: 'Voto registrado com sucesso!',
        totalVotes: parseInt(voteCount?.total ?? '1', 10),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /vote POST] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro interno ao processar voto' },
      { status: 500 }
    );
  }
}

// ── GET /api/vote ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category');

    if (!categorySlug) {
      // Retorna contagem total de votos
      const totals = await query<{ category_slug: string; total: string }>(
        `SELECT vc.slug as category_slug, COUNT(v.id) as total
         FROM vote_categories vc
         LEFT JOIN votes v ON v.category_id = vc.id
         GROUP BY vc.slug`
      );

      return Response.json({
        success: true,
        data: totals.reduce(
          (acc, row) => ({ ...acc, [row.category_slug]: parseInt(row.total, 10) }),
          {} as Record<string, number>
        ),
      });
    }

    // Retorna votos por jogador para uma categoria específica
    const results = await query<{
      player_id: string;
      player_name: string;
      image_url: string;
      country: string;
      total: string;
    }>(
      `SELECT
        p.id as player_id,
        p.name as player_name,
        p.image_url,
        p.country,
        COUNT(v.id) as total
       FROM players p
       INNER JOIN votes v ON v.player_id = p.id
       INNER JOIN vote_categories vc ON v.category_id = vc.id
       WHERE vc.slug = $1
       GROUP BY p.id, p.name, p.image_url, p.country
       ORDER BY total DESC
       LIMIT 20`,
      [categorySlug]
    );

    return Response.json({
      success: true,
      data: results.map((r) => ({
        ...r,
        total: parseInt(r.total, 10),
      })),
    });
  } catch (error) {
    console.error('[API /vote GET] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro ao buscar votos' },
      { status: 500 }
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Extrai o userId do JWT cookie.
 * Retorna null se não autenticado.
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const sessionValue = request.cookies.get('fanpulse_session')?.value;
  if (!sessionValue) return null;

  try {
    const session = JSON.parse(sessionValue);
    return session.id || null;
  } catch {
    return null;
  }
}
