// =============================================================
// FanPulse — API Route: /api/matches
// =============================================================
// GET /api/matches            → Próximos jogos da Copa 2026
// GET /api/matches?live=true  → Jogos ao vivo
// GET /api/matches?date=YYYY-MM-DD → Jogos de uma data específica
// =============================================================

import { type NextRequest } from 'next/server';
import { getAPIFootballClient } from '@/lib/api-football/client';
import { LIVE_STATUSES } from '@/lib/api-football/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isLive = searchParams.get('live') === 'true';
    const date = searchParams.get('date');
    const teamId = searchParams.get('team');

    const client = getAPIFootballClient();

    let fixtures;

    if (isLive) {
      // Jogos ao vivo — cache curto de 30s
      fixtures = await client.getLiveFixtures();
    } else {
      // Jogos por data ou próximos jogos
      fixtures = await client.getFixtures({
        date: date ?? undefined,
        team: teamId ? parseInt(teamId, 10) : undefined,
      });
    }

    // Formata a resposta para o frontend
    const formattedMatches = fixtures.map((f) => ({
      id: f.fixture.id,
      date: f.fixture.date,
      status: {
        long: f.fixture.status.long,
        short: f.fixture.status.short,
        elapsed: f.fixture.status.elapsed,
        isLive: LIVE_STATUSES.includes(f.fixture.status.short),
      },
      venue: {
        name: f.fixture.venue.name,
        city: f.fixture.venue.city,
      },
      league: {
        name: f.league.name,
        round: f.league.round,
      },
      homeTeam: {
        id: f.teams.home.id,
        name: f.teams.home.name,
        logo: f.teams.home.logo,
        winner: f.teams.home.winner,
      },
      awayTeam: {
        id: f.teams.away.id,
        name: f.teams.away.name,
        logo: f.teams.away.logo,
        winner: f.teams.away.winner,
      },
      score: {
        home: f.goals.home,
        away: f.goals.away,
      },
    }));

    // Cache headers: curto para live, longo para schedule
    const cacheControl = isLive
      ? 's-maxage=30, stale-while-revalidate=60'
      : 's-maxage=3600, stale-while-revalidate=7200';

    return Response.json(
      {
        success: true,
        data: formattedMatches,
        meta: {
          total: formattedMatches.length,
          isLive,
          date: date ?? null,
        },
      },
      {
        headers: { 'Cache-Control': cacheControl },
      }
    );
  } catch (error) {
    console.error('[API /matches] Erro:', error);
    return Response.json(
      { success: false, error: 'Erro ao buscar jogos' },
      { status: 500 }
    );
  }
}
