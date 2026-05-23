// =============================================================
// FanPulse — Cron Job: Sync Players from API-Football
// =============================================================
// GET /api/cron/sync-players
// Roda a cada 6 horas via Vercel Cron.
// Busca elencos das seleções principais e salva no Postgres.
// =============================================================

import { type NextRequest } from 'next/server';
import { getAPIFootballClient } from '@/lib/api-football/client';
import { sql } from '@/lib/db/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Aumenta timeout para 60s (cron pode ser lento)

export async function GET(request: NextRequest) {
  try {
    // Verifica autorização (protege o endpoint de cron)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Em produção, verificar o secret. Em dev, permitir.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Vercel Cron envia automaticamente o header correto
      // Mas também aceita chamadas sem secret em dev
      if (process.env.NODE_ENV === 'production') {
        return Response.json(
          { success: false, error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }

    const client = getAPIFootballClient();
    const db = sql();

    console.log('[CRON] Iniciando sincronização de jogadores...');

    // Busca elencos das seleções principais
    const squads = await client.getAllTopSquads();

    let totalSynced = 0;
    let totalErrors = 0;

    for (const squad of squads) {
      for (const player of squad.players) {
        try {
          // Upsert: insere ou atualiza se já existir
          await db`
            INSERT INTO players (api_football_id, name, country, country_code, image_url, position, team_name, team_logo)
            VALUES (
              ${player.id},
              ${player.name},
              ${squad.team.name},
              ${''},
              ${player.photo},
              ${player.position},
              ${squad.team.name},
              ${squad.team.logo}
            )
            ON CONFLICT (api_football_id) DO UPDATE SET
              name = EXCLUDED.name,
              image_url = EXCLUDED.image_url,
              position = EXCLUDED.position,
              team_name = EXCLUDED.team_name,
              team_logo = EXCLUDED.team_logo,
              updated_at = NOW()
          `;
          totalSynced++;
        } catch (error) {
          console.error(`[CRON] Erro ao sincronizar jogador ${player.name}:`, error);
          totalErrors++;
        }
      }
    }

    console.log(
      `[CRON] Sincronização concluída: ${totalSynced} jogadores, ${totalErrors} erros`
    );

    return Response.json({
      success: true,
      message: `Sincronização concluída`,
      stats: {
        totalSquads: squads.length,
        totalSynced,
        totalErrors,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[CRON] Erro na sincronização:', error);
    return Response.json(
      { success: false, error: 'Erro na sincronização' },
      { status: 500 }
    );
  }
}
