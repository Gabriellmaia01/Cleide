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

export default function FanVoteHome() {
  const [players, setPlayers] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSiteVotes, setTotalSiteVotes] = useState(0);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const res = await fetch('/api/ranking');
        const data = await res.json();
        if (data.success) {
          const fetchedPlayers = data.data as RankingPlayer[];
          setPlayers(fetchedPlayers.slice(0, 4));
          
          // Calcula o total de votos somando todos os jogadores
          const total = fetchedPlayers.reduce((acc, p) => acc + Number(p.total_votes), 0);
          setTotalSiteVotes(total);
        }
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  // Calcula o máximo de votos para fazer a barra de porcentagem
  const maxVotes = Math.max(...players.map(p => Number(p.total_votes)), 1);

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-icon">🏆</div>
          <div className="logo-text">
            <h1>Fan Pulse</h1>
            <span>Copa 2026</span>
          </div>
        </div>
        <Link href="/perfil" className="profile">👤</Link>
      </header>

      <section className="hero">
        <div className="overlay"></div>
        <div className="hero-content">
          <h1>
            Vote nos seus jogadores
            <br />
            <span>favoritos da Copa!</span>
          </h1>
          <p>
            Participe da maior votação de fãs e ajude a escolher
            os melhores da Copa do Mundo 2026
          </p>
          <Link href="/votacao" className="hero-btn inline-flex items-center justify-center">
            Começar a Votar
          </Link>
        </div>
      </section>

      <section className="container">
        <h2 className="section-title">Categorias</h2>
        <div className="categories">
          
          <div className="category-card">
            <div className="category-icon gold">🏆</div>
            <h3>Melhor Jogador</h3>
          </div>

          <div className="category-card">
            <div className="category-icon purple">⚡</div>
            <h3>Melhor Gol</h3>
          </div>

          <div className="category-card">
            <div className="category-icon green">🚩</div>
            <h3>Melhor Seleção</h3>
          </div>

        </div>
      </section>

      <section className="container">
        <div className="players-top">
          <div>
            <h2 className="section-title">Jogadores em Destaque</h2>
            <p className="subtitle">Líderes atuais do ranking!</p>
          </div>
          <Link href="/ranking" className="view-all">Ver Todos</Link>
        </div>
        
        <div className="players-grid" id="playersGrid">
          {loading ? (
            <div className="flex justify-center w-full py-10">
               <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-10 w-full text-gray-500">
               Nenhum voto computado ainda.
            </div>
          ) : (
            players.map((player) => {
              const percentage = Math.round((Number(player.total_votes) / maxVotes) * 100) || 0;
              
              return (
                <div className="player-card" key={player.id}>
                  <div className="player-image">
                    <img 
                      src={player.image_url || '/imagens/placeholder.jpg'} 
                      alt={player.name} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
                      }}
                    />
                    <div className="percentage">📈 {percentage}%</div>
                  </div>
                  <div className="player-info">
                    <h2 className="truncate">{player.name}</h2>
                    <p className="country">{player.country}</p>
                    <div className="votes">
                      <span>Votos</span>
                      <span>{Number(player.total_votes).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <Link href="/votacao" className="vote-btn">♡ Votar</Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="live-section">
        <h3>🔥 VOTAÇÃO AO VIVO</h3>
        <h1 id="liveVotes">{totalSiteVotes.toLocaleString('pt-BR')}</h1>
        <p>votos computados até o momento</p>
      </section>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item active">
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
        <Link href="/perfil" className="nav-item">
          <div className="nav-icon">👤</div>
          <span>Perfil</span>
        </Link>
      </nav>
    </>
  );
}