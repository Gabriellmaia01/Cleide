'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface RankingPlayer {
  id: string;
  position: number;
  name: string;
  country: string;
  country_code: string;
  total_votes: number;
  image_url: string;
}

export default function Ranking() {
  const [dadosRanking, setDadosRanking] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const res = await fetch('/api/ranking');
        const data = await res.json();
        if (data.success) {
          setDadosRanking(data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-green-500 via-blue-600 to-blue-800 p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h1 className="text-xl font-bold leading-tight">Fan Pulse</h1>
              <span className="text-xs opacity-80">Ranking Global</span>
            </div>
          </div>
        </div>
      </header>

      {/* Título da Página e Filtros */}
      <div className="px-6 py-6">
        <h2 className="text-2xl font-extrabold text-blue-900 mb-2">Líderes de Votação</h2>
        <p className="text-gray-500 text-sm mb-6">Acompanhe a classificação em tempo real.</p>

        {/* Botões de Categoria */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button className="whitespace-nowrap px-5 py-2 bg-blue-900 text-white rounded-full text-sm font-bold shadow-md">Melhor Jogador</button>
          <button className="whitespace-nowrap px-5 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-bold">Melhor Gol</button>
          <button className="whitespace-nowrap px-5 py-2 bg-white text-gray-600 border border-gray-200 rounded-full text-sm font-bold">Melhor Seleção</button>
        </div>
      </div>

      {/* Lista do Ranking */}
      <div className="px-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : dadosRanking.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhum voto registrado ainda.</p>
          </div>
        ) : (
          dadosRanking.map((jogador) => (
            <div 
              key={jogador.id} 
              className={`flex items-center bg-white p-4 rounded-2xl shadow-sm border-l-4 ${
                jogador.position === 1 ? 'border-yellow-400' : 
                jogador.position === 2 ? 'border-gray-400' : 
                jogador.position === 3 ? 'border-amber-600' : 'border-transparent'
              }`}
            >
              {/* Posição (1º, 2º, etc) */}
              <div className="w-10 text-center font-black text-xl text-gray-400">
                {jogador.position}º
              </div>

              {/* Foto do Jogador */}
              <div className="w-14 h-14 rounded-full overflow-hidden ml-2 border-2 border-gray-100 flex-shrink-0">
                <img 
                  src={jogador.image_url || '/imagens/placeholder.jpg'} 
                  alt={jogador.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
                  }}
                />
              </div>

              {/* Informações */}
              <div className="ml-4 flex-1">
                <h3 className="font-bold text-blue-900 truncate">{jogador.name}</h3>
                <p className="text-xs text-gray-500">{jogador.country}</p>
              </div>

              {/* Votos */}
              <div className="text-right">
                <p className="font-extrabold text-blue-600">{Number(jogador.total_votes).toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Votos</p>
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item cursor-pointer">
          <div className="nav-icon">⌂</div>
          <span>Início</span>
        </Link>
        <Link href="/votacao" className="nav-item">
          <div className="nav-icon">☑</div>
          <span>Votação</span>
        </Link>
        <Link href="/ranking" className="nav-item active">
          <div className="nav-icon">🏆</div>
          <span>Ranking</span>
        </Link>
        <Link href="/perfil" className="nav-item">
          <div className="nav-icon">👤</div>
          <span>Perfil</span>
        </Link>
      </nav>
    </div>
  );
}