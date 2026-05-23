// =============================================================
// FanPulse — API Route: /api/players
// =============================================================
// GET /api/players           → Lista jogadores com contagem de votos
// GET /api/players?country=BR → Filtra por seleção
// =============================================================

import { type NextRequest } from 'next/server';
import { getAPIFootballClient } from '@/lib/api-football/client';
import { sql } from '@/lib/db/client';
import { cacheGetOrFetch } from '@/lib/api-football/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);

    // Tenta buscar do banco de dados primeiro (jogadores já sincronizados)
    const cacheKey = `players:list:${country ?? 'all'}:${limit}`;

    const players = await cacheGetOrFetch(
      cacheKey,
      async () => {
        try {
          const db = sql();

          // Query com contagem de votos (LEFT JOIN)
          const whereClause = country
            ? `WHERE p.country_code = '${country.toUpperCase()}'`
            : '';

          const result = await db`
            SELECT
              p.id,
              p.api_football_id,
              p.name,
              p.country,
              p.country_code,
              p.image_url,
              p.position,
              p.team_name,
              p.team_logo,
              COALESCE(vote_counts.total, 0) AS total_votes
            FROM players p
            LEFT JOIN (
              SELECT player_id, COUNT(*) AS total
              FROM votes
              GROUP BY player_id
            ) vote_counts ON vote_counts.player_id = p.id
            ${country ? sql()`WHERE p.country_code = ${country.toUpperCase()}` : sql()``}
            ORDER BY total_votes DESC, p.name ASC
            LIMIT ${limit}
          `;

          return result;
        } catch {
          // Se o DB não estiver configurado, busca direto da API-Football
          return null;
        }
      },
      { redisTtlSeconds: 300, memoryTtlMs: 60 * 1000 }
    );

    // Fallback: se não temos dados no DB, buscar da API-Football diretamente
    if (!players || (Array.isArray(players) && players.length === 0)) {
      const client = getAPIFootballClient();

      // Busca elencos das seleções principais
      const teamIds = country
        ? [getTeamIdByCountry(country)]
        : [6, 26, 2, 27]; // Brasil, Argentina, França, Portugal

      const allPlayers = [];

      for (const teamId of teamIds) {
        if (!teamId) continue;
        try {
          const squad = await client.getSquad(teamId);
          if (squad) {
            allPlayers.push(
              ...squad.players.map((p) => ({
                id: `api-${p.id}`,
                apiFootballId: p.id,
                name: p.name,
                country: squad.team.name,
                countryCode: country?.toUpperCase() ?? '',
                imageUrl: p.photo,
                position: p.position,
                teamName: squad.team.name,
                teamLogo: squad.team.logo,
                totalVotes: 0,
              }))
            );
          }
        } catch (error) {
          console.error(`[API] Erro ao buscar squad ${teamId}:`, error);
        }
      }

      return Response.json(
        {
          success: true,
          data: allPlayers.slice(0, limit),
          source: 'api-football',
        },
        {
          headers: {
            'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
          },
        }
      );
    }

    return Response.json(
      {
        success: true,
        data: players,
        source: 'database',
      },
      {
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('[API /players] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro ao buscar jogadores' },
      { status: 500 }
    );
  }
}

/**
 * Mapeia código de país para team ID da API-Football.
 */
function getTeamIdByCountry(countryCode: string): number | null {
  const map: Record<string, number> = {
    BR: 6,
    AR: 26,
    FR: 2,
    PT: 27,
    DE: 25,
    ES: 9,
    GB: 10,
    EN: 10,
    NL: 1118,
    IT: 768,
    BE: 1,
    HR: 3,
    UY: 28,
    CO: 1595,
    MX: 16,
    US: 2384,
    JP: 12,
  };

  return map[countryCode.toUpperCase()] ?? null;
}
