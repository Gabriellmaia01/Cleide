import React from 'react';

export default function FanVoteHome() {
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
        <div className="profile">👤</div>
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
          <button className="hero-btn">
            Começar a Votar
          </button>
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
            <p className="subtitle">Vote nos seus favoritos agora!</p>
          </div>
          <a href="#" className="view-all">Ver Todos</a>
        </div>
        
        {/* Aqui entram os cards dos jogadores! */}
        <div className="players-grid" id="playersGrid">
          
          {/* Neymar */}
          <div className="player-card">
            <div className="player-image">
              {/* Você pode trocar esse link pela imagem exportada do seu Figma depois */}
              <img src="/imagens/neymar.jpg" alt="Neymar Jr." />
              <div className="percentage">📈 68%</div>
            </div>
            <div className="player-info">
              <h2>Neymar Jr.</h2>
              <p className="country">BR Brasil</p>
              <div className="votes">
                <span>Votos</span>
                <span>234.567</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: '68%' }}></div>
              </div>
              <button className="vote-btn">♡ Votar</button>
            </div>
          </div>

          {/* Messi */}
          <div className="player-card">
            <div className="player-image">
              <img src="/imagens/messi.jpg" alt="Lionel Messi" />
              <div className="percentage">📈 82%</div>
            </div>
            <div className="player-info">
              <h2>Lionel Messi</h2>
              <p className="country">AR Argentina</p>
              <div className="votes">
                <span>Votos</span>
                <span>312.456</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: '82%' }}></div>
              </div>
              <button className="vote-btn">♡ Votar</button>
            </div>
          </div>

          {/* Mbappé */}
          <div className="player-card">
            <div className="player-image">
              <img src="/imagens/mbappe.jpg" alt="Kylian Mbappé" />
              <div className="percentage">📈 75%</div>
            </div>
            <div className="player-info">
              <h2>Kylian Mbappé</h2>
              <p className="country">FR França</p>
              <div className="votes">
                <span>Votos</span>
                <span>198.765</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: '75%' }}></div>
              </div>
              <button className="vote-btn">♡ Votar</button>
            </div>
          </div>

          {/* Cristiano Ronaldo */}
          <div className="player-card">
            <div className="player-image">
              <img src="/imagens/cr7.jpg" alt="Cristiano Ronaldo" />
              <div className="percentage">📈 79%</div>
            </div>
            <div className="player-info">
              <h2>Cristiano Ronaldo</h2>
              <p className="country">PT Portugal</p>
              <div className="votes">
                <span>Votos</span>
                <span>287.543</span>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: '79%' }}></div>
              </div>
              <button className="vote-btn">♡ Votar</button>
            </div>
          </div>

        </div>
      </section>

      <section className="live-section">
        <h3>🔥 VOTAÇÃO AO VIVO</h3>
        <h1 id="liveVotes">1.234.567</h1>
        <p>votos computados nas últimas 24 horas</p>
      </section>

      <nav className="bottom-nav">
        <div className="nav-item active">
          <div className="nav-icon">⌂</div>
          <span>Início</span>
        </div>
        <div className="nav-item">
          <div className="nav-icon">☑</div>
          <span>Votação</span>
        </div>
        <div className="nav-item">
          <div className="nav-icon">🏆</div>
          <span>Ranking</span>
        </div>
        <div className="nav-item">
          <div className="nav-icon">👤</div>
          <span>Perfil</span>
        </div>
      </nav>
    </>
  );
}