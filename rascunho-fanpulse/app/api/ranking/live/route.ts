// =============================================================
// FanPulse — API Route: /api/ranking/live
// =============================================================
// GET /api/ranking/live → Contagem de votos em tempo real (24h)
// Atualiza a cada 30 segundos para o contador "ao vivo".
// =============================================================

import { query, queryOne } from '@/lib/db/client';
import { cacheGetOrFetch } from '@/lib/api-football/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const liveData = await cacheGetOrFetch(
      'ranking:live',
      async () => {
        // Contagem de votos nas últimas 24 horas
        const last24h = await queryOne<{ total: string }>(
          `SELECT COUNT(*) as total
           FROM votes
           WHERE created_at > NOW() - INTERVAL '24 hours'`
        );

        // Contagem total geral
        const allTime = await queryOne<{ total: string }>(
          'SELECT COUNT(*) as total FROM votes'
        );

        // Top 5 jogadores mais votados nas últimas 24h
        const trending = await query<{
          player_name: string;
          image_url: string;
          country: string;
          votes_24h: string;
        }>(
          `SELECT
            p.name AS player_name,
            p.image_url,
            p.country,
            COUNT(v.id) AS votes_24h
           FROM votes v
           INNER JOIN players p ON p.id = v.player_id
           WHERE v.created_at > NOW() - INTERVAL '24 hours'
           GROUP BY p.id, p.name, p.image_url, p.country
           ORDER BY votes_24h DESC
           LIMIT 5`
        );

        return {
          total24h: parseInt(last24h?.total ?? '0', 10),
          totalAllTime: parseInt(allTime?.total ?? '0', 10),
          trending: trending.map((t) => ({
            playerName: t.player_name,
            imageUrl: t.image_url,
            country: t.country,
            votes24h: parseInt(t.votes_24h, 10),
          })),
          lastUpdated: new Date().toISOString(),
        };
      },
      { redisTtlSeconds: 30, memoryTtlMs: 15 * 1000 }
    );

    return Response.json(
      {
        success: true,
        data: liveData,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('[API /ranking/live] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro ao buscar dados ao vivo' },
      { status: 500 }
    );
  }
}
