import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('category') || 'melhor-jogador';

    const db = sql();

    // Busca o ranking com JOIN direto (não depende da view v_ranking)
    const ranking = await db`
      SELECT 
        p.id as id,
        p.name as name,
        p.country,
        p.country_code,
        p.image_url,
        COUNT(v.id) as total_votes,
        RANK() OVER (
          ORDER BY COUNT(v.id) DESC
        ) as position
      FROM players p
      INNER JOIN votes v ON v.player_id = p.id
      INNER JOIN vote_categories vc ON v.category_id = vc.id
      WHERE vc.slug = ${categorySlug}
      GROUP BY p.id, p.name, p.country, p.country_code, p.image_url
      ORDER BY position ASC
      LIMIT 100
    `;

    // Se o banco estiver vazio (setup não rodou), retorna dados vazios com sucesso
    return NextResponse.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('[API RANKING] Erro ao buscar ranking:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao carregar ranking' },
      { status: 500 }
    );
  }
}
