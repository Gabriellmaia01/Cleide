// =============================================================
// FanPulse — Tipos da API-Football v3
// =============================================================
// Tipagem completa das respostas da API-Football.
// Docs: https://www.api-football.com/documentation-v3
// =============================================================

/**
 * Envelope padrão de todas as respostas da API-Football v3.
 */
export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

// ── Players ──────────────────────────────────────────────────

export interface APIPlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
      date: string;
      place: string;
      country: string;
    };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: APIPlayerStatistics[];
}

export interface APIPlayerStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  games: {
    appearences: number;
    lineups: number;
    minutes: number;
    number: number | null;
    position: string;
    rating: string | null;
    captain: boolean;
  };
  goals: {
    total: number;
    conceded: number | null;
    assists: number;
    saves: number | null;
  };
  shots: {
    total: number | null;
    on: number | null;
  };
  passes: {
    total: number | null;
    key: number | null;
    accuracy: number | null;
  };
  cards: {
    yellow: number;
    yellowred: number;
    red: number;
  };
}

// ── Teams / Squads ───────────────────────────────────────────

export interface APITeamResponse {
  team: {
    id: number;
    name: string;
    code: string;
    country: string;
    founded: number;
    national: boolean;
    logo: string;
  };
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    capacity: number;
    surface: string;
    image: string;
  };
}

export interface APISquadResponse {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  players: APISquadPlayer[];
}

export interface APISquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number | null;
  position: string;
  photo: string;
}

// ── Fixtures (Jogos) ─────────────────────────────────────────

export interface APIFixtureResponse {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: FixtureStatus;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    round: string;
  };
  teams: {
    home: APIFixtureTeam;
    away: APIFixtureTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface APIFixtureTeam {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

/**
 * Status codes da API-Football para fixtures.
 */
export type FixtureStatus =
  | 'TBD'   // Time to be defined
  | 'NS'    // Not Started
  | '1H'    // First Half
  | 'HT'    // Halftime
  | '2H'    // Second Half
  | 'ET'    // Extra Time
  | 'P'     // Penalty In Progress
  | 'FT'    // Match Finished
  | 'AET'   // Match Finished After Extra Time
  | 'PEN'   // Match Finished After Penalty
  | 'BT'    // Break Time
  | 'SUSP'  // Suspended
  | 'INT'   // Interrupted
  | 'PST'   // Postponed
  | 'CANC'  // Cancelled
  | 'ABD'   // Abandoned
  | 'AWD'   // Technical Loss
  | 'WO'    // WalkOver
  | 'LIVE'; // In Progress

// Status que indicam jogo ao vivo
export const LIVE_STATUSES: FixtureStatus[] = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE'];

// ── Standings (Classificação) ────────────────────────────────

export interface APIStandingResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: APIStandingGroup[][];
  };
}

export interface APIStandingGroup {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string | null;
  all: APIStandingStats;
}

export interface APIStandingStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: {
    for: number;
    against: number;
  };
}

// ── Countries ────────────────────────────────────────────────

export interface APICountryResponse {
  name: string;
  code: string;
  flag: string;
}

// ── Query Options ────────────────────────────────────────────

export interface FixtureQueryOptions {
  league?: number;
  season?: number;
  team?: number;
  live?: 'all';
  date?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
  status?: string;
}

export interface PlayerQueryOptions {
  id?: number;
  team?: number;
  league?: number;
  season?: number;
  page?: number;
}

/**
 * IDs importantes da API-Football para a Copa 2026.
 */
export const API_FOOTBALL_IDS = {
  // Liga: Copa do Mundo (league id = 1 na API-Football)
  WORLD_CUP_LEAGUE: 1,

  // Temporada da Copa 2026
  WORLD_CUP_SEASON: 2026,

  // Seleções mais populares (team IDs)
  TEAMS: {
    BRAZIL: 6,
    ARGENTINA: 26,
    FRANCE: 2,
    PORTUGAL: 27,
    GERMANY: 25,
    SPAIN: 9,
    ENGLAND: 10,
    NETHERLANDS: 1118,
    ITALY: 768,
    BELGIUM: 1,
    CROATIA: 3,
    URUGUAY: 28,
    COLOMBIA: 1595,
    MEXICO: 16,
    USA: 2384,
    JAPAN: 12,
  } as const,
} as const;
