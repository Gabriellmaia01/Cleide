import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db/client';
import LogoutButton from './LogoutButton';

// Força componente ser renderizado no servidor dinamicamente por causa dos cookies
export const dynamic = 'force-dynamic';

export default async function Perfil() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('fanpulse_session');
  
  if (!sessionCookie) {
    redirect('/login');
  }

  let user;
  try {
    user = JSON.parse(sessionCookie.value);
  } catch (e) {
    redirect('/login');
  }

  // Buscar votos do usuário
  const db = sql();
  let userVotes = [];
  try {
    // Fazemos um JOIN com players e vote_categories
    userVotes = await db`
      SELECT 
        v.created_at,
        p.name as player_name,
        p.image_url,
        vc.name as category_name
      FROM votes v
      JOIN players p ON v.player_id = p.id
      JOIN vote_categories vc ON v.category_id = vc.id
      WHERE v.user_id = ${user.id}
      ORDER BY v.created_at DESC
    `;
  } catch (e) {
    console.error('Erro ao buscar votos do usuário', e);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 p-6 rounded-b-3xl shadow-lg text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-900 text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">Meu Perfil</h1>
              <span className="text-sm opacity-80">{user.email}</span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Conteúdo */}
      <div className="px-6 py-6">
        <h2 className="text-2xl font-extrabold text-blue-900 mb-2">Meus Votos</h2>
        <p className="text-gray-500 text-sm mb-6">Histórico de votação nas categorias.</p>

        {userVotes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">🗳️</div>
            <h3 className="text-lg font-bold text-gray-800">Você ainda não votou</h3>
            <p className="text-gray-500 text-sm mt-2 mb-6">Explore as categorias e registre seus votos!</p>
            <Link 
              href="/votacao" 
              className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-md"
            >
              Começar a Votar
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userVotes.map((voto: any, index: number) => (
              <div key={index} className="flex items-center bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 flex-shrink-0">
                  <img 
                    src={voto.image_url || '/imagens/placeholder.jpg'} 
                    alt={voto.player_name} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
                    }}
                  />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-xs text-blue-600 font-bold">{voto.category_name}</p>
                  <h3 className="font-bold text-gray-800">{voto.player_name}</h3>
                  <p className="text-[10px] text-gray-400">
                    {new Date(voto.created_at).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <div className="nav-icon">⌂</div>
          <span>Início</span>
        </Link>
        <Link href="/votacao" className="nav-item">
          <div className="nav-icon">☑</div>
          <span>Votação</span>
        </Link>
        <Link href="/ranking" className="nav-item">
          <div className="nav-icon">🏆</div>
          <span>Ranking</span>
        </Link>
        <Link href="/perfil" className="nav-item active">
          <div className="nav-icon">👤</div>
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  );
}
