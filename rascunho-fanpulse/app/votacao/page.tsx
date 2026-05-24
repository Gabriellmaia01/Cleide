'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ── Tipos ────────────────────────────────────────────────────
interface Player {
  id: string;
  name: string;
  country: string;
  country_code: string;
  image_url: string;
  position: string;
  team_name: string;
  total_votes: number;
}

type VoteStep = 'select' | 'confirm' | 'success' | 'error';

// ── Componente Principal ─────────────────────────────────────
export default function Votacao() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [voteStep, setVoteStep] = useState<VoteStep>('select');
  const [voteResult, setVoteResult] = useState<{ totalVotes?: number; error?: string }>({});
  const [voting, setVoting] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number; color: string }[]>([]);

  // Busca jogadores do backend
  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        if (data.success) {
          setPlayers(data.data);
        }
      } catch (err) {
        console.error('Erro ao buscar jogadores:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  // Gera confetti particles
  const triggerConfetti = useCallback(() => {
    const colors = ['#00c98b', '#0066ff', '#f5b400', '#ff0055', '#8a2cff', '#b8ff42'];
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 3000);
  }, []);

  // Handler do voto
  const handleVote = async () => {
    if (!selectedPlayer) return;
    setVoting(true);

    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          categorySlug: 'melhor-jogador',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setVoteResult({ totalVotes: data.totalVotes });
        setVoteStep('success');
        triggerConfetti();
        // Atualiza contagem local
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === selectedPlayer.id
              ? { ...p, total_votes: data.totalVotes }
              : p
          )
        );
      } else {
        setVoteResult({ error: data.error || 'Erro ao votar' });
        setVoteStep('error');
      }
    } catch {
      setVoteResult({ error: 'Erro de conexão. Tente novamente.' });
      setVoteStep('error');
    } finally {
      setVoting(false);
    }
  };

  const resetVote = () => {
    setSelectedPlayer(null);
    setVoteStep('select');
    setVoteResult({});
  };

  return (
    <div className="votacao-page">
      {/* Confetti */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            backgroundColor: p.color,
          }}
        />
      ))}

      {/* Header */}
      <header className="votacao-header">
        <Link href="/" className="votacao-back">
          ← Voltar
        </Link>
        <div className="votacao-header-title">
          <span className="votacao-header-icon">🗳️</span>
          <div>
            <h1>Votação</h1>
            <span>Melhor Jogador • Copa 2026</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="votacao-content">
        {loading ? (
          <div className="votacao-loading">
            <div className="votacao-spinner" />
            <p>Carregando jogadores...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="votacao-empty">
            <p>⚠️ Nenhum jogador encontrado.</p>
            <p className="votacao-empty-sub">
              Execute <code>/api/setup-db</code> para configurar o banco.
            </p>
          </div>
        ) : (
          <>
            <p className="votacao-subtitle">
              Escolha seu jogador favorito e registre seu voto!
            </p>

            <div className="votacao-grid">
              {players.map((player) => (
                <button
                  key={player.id}
                  className={`votacao-card ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setVoteStep('confirm');
                  }}
                >
                  <div className="votacao-card-img">
                    <img
                      src={player.image_url || '/imagens/placeholder.jpg'}
                      alt={player.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
                      }}
                    />
                    <div className="votacao-card-votes">
                      {player.total_votes ?? 0} votos
                    </div>
                  </div>
                  <div className="votacao-card-info">
                    <h3>{player.name}</h3>
                    <p>{player.country}</p>
                    <span className="votacao-card-pos">{player.position}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Confirmação */}
      {voteStep === 'confirm' && selectedPlayer && (
        <div className="votacao-overlay" onClick={resetVote}>
          <div className="votacao-modal" onClick={(e) => e.stopPropagation()}>
            <div className="votacao-modal-icon">🗳️</div>
            <h2>Confirmar Voto</h2>
            <p className="votacao-modal-desc">
              Você está votando em:
            </p>

            <div className="votacao-modal-player">
              <img
                src={selectedPlayer.image_url || '/imagens/placeholder.jpg'}
                alt={selectedPlayer.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjwvc3ZnPg==';
                }}
              />
              <div>
                <h3>{selectedPlayer.name}</h3>
                <p>{selectedPlayer.country}</p>
              </div>
            </div>

            <p className="votacao-modal-warning">
              ⚠️ Você só pode votar <strong>uma vez</strong> por categoria.
            </p>

            <div className="votacao-modal-actions">
              <button className="votacao-btn-cancel" onClick={resetVote}>
                Cancelar
              </button>
              <button
                className="votacao-btn-confirm"
                onClick={handleVote}
                disabled={voting}
              >
                {voting ? (
                  <span className="votacao-btn-loading">
                    <span className="votacao-mini-spinner" /> Votando...
                  </span>
                ) : (
                  '✓ Confirmar Voto'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {voteStep === 'success' && selectedPlayer && (
        <div className="votacao-overlay">
          <div className="votacao-modal success">
            <div className="votacao-modal-icon success-icon">🎉</div>
            <h2>Voto Registrado!</h2>
            <p className="votacao-modal-desc">
              Seu voto em <strong>{selectedPlayer.name}</strong> foi computado com sucesso!
            </p>

            {voteResult.totalVotes && (
              <div className="votacao-success-count">
                <span className="votacao-count-number">{voteResult.totalVotes}</span>
                <span className="votacao-count-label">votos no total</span>
              </div>
            )}

            <div className="votacao-modal-actions">
              <Link href="/ranking" className="votacao-btn-ranking">
                🏆 Ver Ranking
              </Link>
              <button className="votacao-btn-confirm" onClick={resetVote}>
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Erro */}
      {voteStep === 'error' && (
        <div className="votacao-overlay" onClick={resetVote}>
          <div className="votacao-modal error" onClick={(e) => e.stopPropagation()}>
            <div className="votacao-modal-icon error-icon">❌</div>
            <h2>Voto não registrado</h2>
            <p className="votacao-modal-desc">
              {voteResult.error}
            </p>
            <div className="votacao-modal-actions">
              <button className="votacao-btn-confirm" onClick={resetVote}>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link href="/" className="nav-item">
          <div className="nav-icon">⌂</div>
          <span>Início</span>
        </Link>
        <Link href="/votacao" className="nav-item active">
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
    </div>
  );
}
