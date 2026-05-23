// =============================================================
// FanPulse — Schema SQL do Banco de Dados (Neon Postgres)
// =============================================================
// Este arquivo contém o SQL de criação das tabelas.
// Execute via `npx tsx lib/db/schema.ts` ou no console do Neon.
// =============================================================

export const SCHEMA_SQL = `
-- ══════════════════════════════════════════════════════════════
-- EXTENSÕES
-- ══════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ══════════════════════════════════════════════════════════════
-- TABELA: users (Usuários do FanPulse)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);

-- ══════════════════════════════════════════════════════════════
-- TABELA: players (Cache de jogadores da API-Football)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_football_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(5),
  image_url TEXT,
  position VARCHAR(50),
  team_name VARCHAR(255),
  team_logo TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_api_id ON players(api_football_id);
CREATE INDEX IF NOT EXISTS idx_players_country ON players(country_code);

-- ══════════════════════════════════════════════════════════════
-- TABELA: vote_categories (Categorias de votação)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vote_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(10) DEFAULT '🏆',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed das categorias fixas
INSERT INTO vote_categories (name, slug, icon) VALUES
  ('Melhor Jogador', 'melhor-jogador', '🏆'),
  ('Melhor Gol', 'melhor-gol', '⚡'),
  ('Melhor Seleção', 'melhor-selecao', '🚩')
ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- TABELA: votes (Core — tabela de votos)
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES vote_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45) NOT NULL,
  fingerprint VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- CONSTRAINT ANTI-FRAUDE: um único voto por usuário por categoria
  CONSTRAINT unique_user_category_vote UNIQUE (user_id, category_id)
);

-- Índices otimizados para queries de alta concorrência
CREATE INDEX IF NOT EXISTS idx_votes_category_player
  ON votes(category_id, player_id);

CREATE INDEX IF NOT EXISTS idx_votes_ip_category
  ON votes(ip_address, category_id);

CREATE INDEX IF NOT EXISTS idx_votes_created_at
  ON votes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_votes_user_category
  ON votes(user_id, category_id);

-- Índice para contagem de votos nas últimas 24h (live counter)
CREATE INDEX IF NOT EXISTS idx_votes_recent
  ON votes(created_at)
  WHERE created_at > NOW() - INTERVAL '24 hours';

-- ══════════════════════════════════════════════════════════════
-- VIEW: ranking materializado para queries rápidas
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_ranking AS
SELECT
  p.id AS player_id,
  p.name AS player_name,
  p.country,
  p.country_code,
  p.image_url,
  vc.id AS category_id,
  vc.slug AS category_slug,
  COUNT(v.id) AS total_votes,
  RANK() OVER (
    PARTITION BY vc.id
    ORDER BY COUNT(v.id) DESC
  ) AS position
FROM players p
CROSS JOIN vote_categories vc
LEFT JOIN votes v
  ON v.player_id = p.id
  AND v.category_id = vc.id
GROUP BY p.id, p.name, p.country, p.country_code, p.image_url, vc.id, vc.slug;
`;

/**
 * SQL para dropar todas as tabelas (uso em desenvolvimento).
 */
export const DROP_ALL_SQL = `
DROP VIEW IF EXISTS v_ranking CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS vote_categories CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS users CASCADE;
`;
