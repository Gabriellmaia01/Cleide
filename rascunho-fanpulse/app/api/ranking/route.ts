// =============================================================
// FanPulse — API Route: /api/ranking
// =============================================================
// GET /api/ranking?category=melhor-jogador&limit=10
// Ranking de jogadores por categoria com cache otimizado.
// =============================================================

import { type NextRequest } from 'next/server';
import { query } from '@/lib/db/client';
import { cacheGetOrFetch } from '@/lib/api-football/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get('category') ?? 'melhor-jogador';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    const cacheKey = `ranking:${categorySlug}:${limit}`;

    const ranking = await cacheGetOrFetch(
      cacheKey,
      async () => {
        // Query otimizada usando a view v_ranking ou query direta
        const results = await query<{
          player_id: string;
          player_name: string;
          country: string;
          country_code: string;
          image_url: string;
          total_votes: string;
          position: string;
        }>(
          `SELECT
            p.id AS player_id,
            p.name AS player_name,
            p.country,
            p.country_code,
            p.image_url,
            COUNT(v.id) AS total_votes,
            RANK() OVER (ORDER BY COUNT(v.id) DESC) AS position
          FROM players p
          INNER JOIN vote_categories vc ON vc.slug = $1
          LEFT JOIN votes v ON v.player_id = p.id AND v.category_id = vc.id
          GROUP BY p.id, p.name, p.country, p.country_code, p.image_url
          HAVING COUNT(v.id) > 0
          ORDER BY total_votes DESC
          LIMIT $2`,
          [categorySlug, limit]
        );

        // Calcula percentual relativo ao primeiro colocado
        const maxVotes = results.length > 0 ? parseInt(results[0].total_votes, 10) : 1;

        return results.map((r) => {
          const totalVotes = parseInt(r.total_votes, 10);
          return {
            playerId: r.player_id,
            playerName: r.player_name,
            country: r.country,
            countryCode: r.country_code,
            imageUrl: r.image_url,
            totalVotes,
            percentage: maxVotes > 0 ? Math.round((totalVotes / maxVotes) * 100) : 0,
            position: parseInt(r.position, 10),
          };
        });
      },
      { redisTtlSeconds: 60, memoryTtlMs: 30 * 1000 }
    );

    return Response.json(
      {
        success: true,
        data: ranking,
        meta: {
          category: categorySlug,
          total: ranking.length,
        },
      },
      {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('[API /ranking] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro ao buscar ranking' },
      { status: 500 }
    );
  }
}
