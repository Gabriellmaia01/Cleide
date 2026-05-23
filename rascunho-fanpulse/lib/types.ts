// =============================================================
// FanPulse — Tipos centrais do domínio
// =============================================================

// ── Jogadores ────────────────────────────────────────────────
export interface Player {
  id: string;
  apiFootballId: number;
  name: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  position: string | null;
  updatedAt: Date;
}

export interface PlayerWithVotes extends Player {
  totalVotes: number;
  percentage: number;
  rank: number;
}

// ── Categorias de Votação ────────────────────────────────────
export interface VoteCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
}

export const VOTE_CATEGORIES = [
  { slug: 'melhor-jogador', name: 'Melhor Jogador', icon: '🏆' },
  { slug: 'melhor-gol', name: 'Melhor Gol', icon: '⚡' },
  { slug: 'melhor-selecao', name: 'Melhor Seleção', icon: '🚩' },
] as const;

export type CategorySlug = (typeof VOTE_CATEGORIES)[number]['slug'];

// ── Votos ────────────────────────────────────────────────────
export interface Vote {
  id: string;
  playerId: string;
  categoryId: string;
  userId: string;
  ipAddress: string;
  fingerprint: string;
  createdAt: Date;
}

export interface VoteRequest {
  playerId: string;
  categoryId: string;
  userId: string;
  ipAddress: string;
  fingerprint: string;
}

export interface VoteResponse {
  success: boolean;
  totalVotes?: number;
  error?: string;
  cooldownSeconds?: number;
}

// ── Anti-Fraude ──────────────────────────────────────────────
export type FraudReason =
  | 'RATE_LIMIT'
  | 'USER_DUPLICATE'
  | 'IP_LIMIT'
  | 'FINGERPRINT_DUPLICATE';

export interface AntiFraudResult {
  allowed: boolean;
  reason?: FraudReason;
  cooldownSeconds?: number;
}

// ── Autenticação ─────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  cpf: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: UserPublic;
  error?: string;
}

// ── API-Football ─────────────────────────────────────────────
export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

export interface Fixture {
  fixture: {
    id: number;
    date: string;
    status: { long: string; short: string; elapsed: number | null };
    venue: { name: string; city: string };
  };
  league: {
    id: number;
    name: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

// ── Ranking ──────────────────────────────────────────────────
export interface RankingEntry {
  playerId: string;
  playerName: string;
  country: string;
  countryCode: string;
  imageUrl: string;
  totalVotes: number;
  percentage: number;
  position: number;
}

export interface LiveVoteCount {
  total24h: number;
  totalAllTime: number;
  lastUpdated: Date;
}
