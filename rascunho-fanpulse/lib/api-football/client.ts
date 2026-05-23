// =============================================================
// FanPulse — Cliente API-Football v3
// =============================================================
// Wrapper HTTP com retry exponencial, cache 2 camadas,
// e rate limiting respeitando os limites do plano.
// Docs: https://www.api-football.com/documentation-v3
// =============================================================

import {
  APIFootballResponse,
  APIPlayerResponse,
  APISquadResponse,
  APIFixtureResponse,
  APIStandingResponse,
  APICountryResponse,
  FixtureQueryOptions,
  PlayerQueryOptions,
  API_FOOTBALL_IDS,
} from './types';
import { cacheGetOrFetch } from './cache';

// ── Configuração ─────────────────────────────────────────────

const BASE_URL = 'https://v3.football.api-sports.io';
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

// ── Classe Principal ─────────────────────────────────────────

class APIFootballClient {
  private apiKey: string;

  constructor() {
    const key = process.env.API_FOOTBALL_KEY;
    if (!key) {
      throw new Error('❌ API_FOOTBALL_KEY não definida. Configure no .env.local');
    }
    this.apiKey = key;
  }

  // ── HTTP Core ────────────────────────────────────────────

  /**
   * Executa um request HTTP com retry exponencial.
   */
  private async request<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<APIFootballResponse<T>> {
    const url = new URL(endpoint, BASE_URL);

    // Adiciona query params (remove undefined)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json',
          },
        });

        // Rate limit — espera e tenta novamente
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after') ?? '60', 10);
          console.warn(`[API-FOOTBALL] Rate limited. Aguardando ${retryAfter}s...`);
          await this.sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: APIFootballResponse<T> = await response.json();

        // Verifica erros da API
        const hasErrors =
          (Array.isArray(data.errors) && data.errors.length > 0) ||
          (!Array.isArray(data.errors) && Object.keys(data.errors).length > 0);

        if (hasErrors) {
          console.error('[API-FOOTBALL] Erro na resposta:', data.errors);
          throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[API-FOOTBALL] Tentativa ${attempt + 1}/${MAX_RETRIES} falhou:`,
          lastError.message
        );

        if (attempt < MAX_RETRIES - 1) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError ?? new Error('[API-FOOTBALL] Todas as tentativas falharam');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ── Squads (Elencos de Seleções) ─────────────────────────

  /**
   * Busca o elenco completo de uma seleção.
   * Cache: 6 horas (elencos mudam raramente).
   */
  async getSquad(teamId: number): Promise<APISquadResponse | null> {
    return cacheGetOrFetch(
      `apifb:squad:${teamId}`,
      async () => {
        const data = await this.request<APISquadResponse>('/players/squads', {
          team: teamId,
        });
        return data.response[0] ?? null;
      },
      { redisTtlSeconds: 6 * 60 * 60, memoryTtlMs: 30 * 60 * 1000 }
    );
  }

  /**
   * Busca elencos de todas as seleções favoritas (batch).
   * Usado pelo cron job de sincronização.
   */
  async getAllTopSquads(): Promise<APISquadResponse[]> {
    const teamIds = Object.values(API_FOOTBALL_IDS.TEAMS);
    const squads: APISquadResponse[] = [];

    for (const teamId of teamIds) {
      try {
        const squad = await this.getSquad(teamId);
        if (squad) squads.push(squad);

        // Espera entre requests para não exceder rate limit
        await this.sleep(500);
      } catch (error) {
        console.error(`[API-FOOTBALL] Erro ao buscar squad ${teamId}:`, error);
      }
    }

    return squads;
  }

  // ── Players ──────────────────────────────────────────────

  /**
   * Busca estatísticas detalhadas de um jogador.
   * Cache: 1 hora.
   */
  async getPlayer(
    playerId: number,
    season: number = API_FOOTBALL_IDS.WORLD_CUP_SEASON
  ): Promise<APIPlayerResponse | null> {
    return cacheGetOrFetch(
      `apifb:player:${playerId}:${season}`,
      async () => {
        const data = await this.request<APIPlayerResponse>('/players', {
          id: playerId,
          season,
        });
        return data.response[0] ?? null;
      },
      { redisTtlSeconds: 60 * 60, memoryTtlMs: 5 * 60 * 1000 }
    );
  }

  /**
   * Busca jogadores por time com paginação.
   */
  async getPlayersByTeam(
    options: PlayerQueryOptions
  ): Promise<APIPlayerResponse[]> {
    const cacheKey = `apifb:players:team:${options.team}:${options.season}:p${options.page ?? 1}`;

    return cacheGetOrFetch(
      cacheKey,
      async () => {
        const data = await this.request<APIPlayerResponse>('/players', {
          team: options.team,
          league: options.league,
          season: options.season ?? API_FOOTBALL_IDS.WORLD_CUP_SEASON,
          page: options.page ?? 1,
        });
        return data.response;
      },
      { redisTtlSeconds: 60 * 60, memoryTtlMs: 5 * 60 * 1000 }
    );
  }

  // ── Fixtures (Jogos) ─────────────────────────────────────

  /**
   * Busca jogos com filtros.
   * Cache: 60s para jogos ao vivo, 1h para outros.
   */
  async getFixtures(options: FixtureQueryOptions = {}): Promise<APIFixtureResponse[]> {
    const isLive = options.live === 'all';
    const cacheKey = `apifb:fixtures:${JSON.stringify(options)}`;

    return cacheGetOrFetch(
      cacheKey,
      async () => {
        const params: Record<string, string | number | undefined> = {
          league: options.league ?? API_FOOTBALL_IDS.WORLD_CUP_LEAGUE,
          season: options.season ?? API_FOOTBALL_IDS.WORLD_CUP_SEASON,
        };

        if (options.live) params.live = options.live;
        if (options.date) params.date = options.date;
        if (options.from) params.from = options.from;
        if (options.to) params.to = options.to;
        if (options.team) params.team = options.team;
        if (options.status) params.status = options.status;

        const data = await this.request<APIFixtureResponse>('/fixtures', params);
        return data.response;
      },
      {
        redisTtlSeconds: isLive ? 60 : 60 * 60,
        memoryTtlMs: isLive ? 30 * 1000 : 5 * 60 * 1000,
      }
    );
  }

  /**
   * Busca jogos ao vivo da Copa 2026.
   * Cache curto de 30 segundos.
   */
  async getLiveFixtures(): Promise<APIFixtureResponse[]> {
    return this.getFixtures({ live: 'all' });
  }

  // ── Standings (Classificação) ────────────────────────────

  /**
   * Busca a classificação da Copa 2026.
   * Cache: 1 hora.
   */
  async getStandings(
    leagueId: number = API_FOOTBALL_IDS.WORLD_CUP_LEAGUE,
    season: number = API_FOOTBALL_IDS.WORLD_CUP_SEASON
  ): Promise<APIStandingResponse | null> {
    return cacheGetOrFetch(
      `apifb:standings:${leagueId}:${season}`,
      async () => {
        const data = await this.request<APIStandingResponse>('/standings', {
          league: leagueId,
          season,
        });
        return data.response[0] ?? null;
      },
      { redisTtlSeconds: 60 * 60, memoryTtlMs: 10 * 60 * 1000 }
    );
  }

  // ── Countries ────────────────────────────────────────────

  /**
   * Busca lista de países/seleções.
   * Cache longo: 24 horas.
   */
  async getCountries(): Promise<APICountryResponse[]> {
    return cacheGetOrFetch(
      'apifb:countries',
      async () => {
        const data = await this.request<APICountryResponse>('/countries');
        return data.response;
      },
      { redisTtlSeconds: 24 * 60 * 60, memoryTtlMs: 60 * 60 * 1000 }
    );
  }
}

// ── Singleton ────────────────────────────────────────────────

let _client: APIFootballClient | null = null;

/**
 * Retorna a instância singleton do client API-Football.
 */
export function getAPIFootballClient(): APIFootballClient {
  if (!_client) {
    _client = new APIFootballClient();
  }
  return _client;
}

export { APIFootballClient };
