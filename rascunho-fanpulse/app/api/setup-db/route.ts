// =============================================================
// FanPulse — API Route: /api/setup-db
// =============================================================
// GET /api/setup-db → Cria tabelas e insere jogadores iniciais
// ⚠️ Apenas em desenvolvimento!
// =============================================================

import { sql } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

// Jogadores iniciais para votação (hardcoded para MVP)
const INITIAL_PLAYERS = [
  { apiId: 276,  name: 'Neymar Jr.',        country: 'Brasil',    code: 'BR', position: 'Attacker',   team: 'Brasil',    image: 'https://media.api-sports.io/football/players/276.png',  logo: 'https://media.api-sports.io/football/teams/6.png' },
  { apiId: 154,  name: 'Lionel Messi',       country: 'Argentina', code: 'AR', position: 'Attacker',   team: 'Argentina', image: 'https://media.api-sports.io/football/players/154.png',  logo: 'https://media.api-sports.io/football/teams/26.png' },
  { apiId: 278,  name: 'Kylian Mbappé',      country: 'France',    code: 'FR', position: 'Attacker',   team: 'France',    image: 'https://media.api-sports.io/football/players/278.png',  logo: 'https://media.api-sports.io/football/teams/2.png' },
  { apiId: 874,  name: 'Cristiano Ronaldo',  country: 'Portugal',  code: 'PT', position: 'Attacker',   team: 'Portugal',  image: 'https://media.api-sports.io/football/players/874.png',  logo: 'https://media.api-sports.io/football/teams/27.png' },
  { apiId: 1100, name: 'Vinícius Jr.',       country: 'Brasil',    code: 'BR', position: 'Attacker',   team: 'Brasil',    image: 'https://media.api-sports.io/football/players/1100.png', logo: 'https://media.api-sports.io/football/teams/6.png' },
  { apiId: 521,  name: 'Erling Haaland',     country: 'Norway',    code: 'NO', position: 'Attacker',   team: 'Norway',    image: 'https://media.api-sports.io/football/players/521.png',  logo: 'https://media.api-sports.io/football/teams/1781.png' },
  { apiId: 18,   name: 'Jude Bellingham',    country: 'England',   code: 'EN', position: 'Midfielder', team: 'England',   image: 'https://media.api-sports.io/football/players/18.png',   logo: 'https://media.api-sports.io/football/teams/10.png' },
  { apiId: 186,  name: 'Lamine Yamal',       country: 'Spain',     code: 'ES', position: 'Attacker',   team: 'Spain',     image: 'https://media.api-sports.io/football/players/186.png',  logo: 'https://media.api-sports.io/football/teams/9.png' },
];

export async function GET() {
  // Proteção: apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return Response.json(
      { success: false, error: 'Endpoint desabilitado em produção' },
      { status: 403 }
    );
  }

  const logs: string[] = [];

  try {
    const db = sql();

    // 1. Executa o schema (cria tabelas statement by statement)
    logs.push('📦 Criando tabelas...');

    // Extension
    await db`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;

    // Users
    await db`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      cpf VARCHAR(14) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;
    await db`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await db`CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf)`;

    // Players
    await db`CREATE TABLE IF NOT EXISTS players (
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
    )`;
    await db`CREATE INDEX IF NOT EXISTS idx_players_api_id ON players(api_football_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_players_country ON players(country_code)`;

    // Vote Categories
    await db`CREATE TABLE IF NOT EXISTS vote_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(50) UNIQUE NOT NULL,
      icon VARCHAR(10) DEFAULT '🏆',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`;
    await db`INSERT INTO vote_categories (name, slug, icon) VALUES
      ('Melhor Jogador', 'melhor-jogador', '🏆'),
      ('Melhor Gol', 'melhor-gol', '⚡'),
      ('Melhor Seleção', 'melhor-selecao', '🚩')
    ON CONFLICT (slug) DO NOTHING`;

    // Votes
    await db`CREATE TABLE IF NOT EXISTS votes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES vote_categories(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(45) NOT NULL,
      fingerprint VARCHAR(64),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT unique_user_category_vote UNIQUE (user_id, category_id)
    )`;
    await db`CREATE INDEX IF NOT EXISTS idx_votes_category_player ON votes(category_id, player_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_votes_ip_category ON votes(ip_address, category_id)`;
    await db`CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS idx_votes_user_category ON votes(user_id, category_id)`;

    logs.push('✅ Tabelas criadas com sucesso');

    // 2. Insere jogadores iniciais
    logs.push('⚽ Inserindo jogadores...');
    let insertedCount = 0;

    for (const player of INITIAL_PLAYERS) {
      try {
        await db`
          INSERT INTO players (api_football_id, name, country, country_code, image_url, position, team_name, team_logo)
          VALUES (${player.apiId}, ${player.name}, ${player.country}, ${player.code}, ${player.image}, ${player.position}, ${player.team}, ${player.logo})
          ON CONFLICT (api_football_id) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = EXCLUDED.image_url,
            updated_at = NOW()
        `;
        insertedCount++;
      } catch (error) {
        logs.push(`⚠️ Erro ao inserir ${player.name}: ${error}`);
      }
    }

    logs.push(`✅ ${insertedCount}/${INITIAL_PLAYERS.length} jogadores inseridos`);

    // 3. Verifica as categorias
    const categories = await db`SELECT id, name, slug FROM vote_categories`;
    logs.push(`📋 Categorias ativas: ${categories.map((c: { name: string }) => c.name).join(', ')}`);

    // 4. Conta registros
    const playerCount = await db`SELECT COUNT(*) as total FROM players`;
    const userCount = await db`SELECT COUNT(*) as total FROM users`;
    const voteCount = await db`SELECT COUNT(*) as total FROM votes`;

    return Response.json({
      success: true,
      message: 'Setup concluído!',
      logs,
      stats: {
        players: Number(playerCount[0].total),
        users: Number(userCount[0].total),
        votes: Number(voteCount[0].total),
        categories: categories.length,
      },
    });
  } catch (error) {
    console.error('[SETUP-DB] Erro:', error);
    logs.push(`❌ Erro: ${error}`);
    return Response.json(
      { success: false, error: 'Erro ao executar setup', logs },
      { status: 500 }
    );
  }
}
