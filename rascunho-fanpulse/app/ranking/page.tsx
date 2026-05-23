import React from 'react';


const dadosRanking = [
  { id: 1, posicao: 1, nome: "Lionel Messi", pais: "AR Argentina", votos: "312.456", imagem: "/imagens/messi.jpg" },
  { id: 2, posicao: 2, nome: "Cristiano Ronaldo", pais: "PT Portugal", votos: "287.543", imagem: "/imagens/cr7.jpg" },
  { id: 3, posicao: 3, nome: "Neymar Jr.", pais: "BR Brasil", votos: "234.567", imagem: "/imagens/neymar.jpg" },
  { id: 4, posicao: 4, nome: "Kylian Mbappé", pais: "FR França", votos: "198.765", imagem: "/imagens/mbappe.jpg" },
];

export default function Ranking() {
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

      {/* Lista do Ranking (Consumindo a lista 'dadosRanking') */}
      <div className="px-6 space-y-4">
        {dadosRanking.map((jogador) => (
          <div 
            key={jogador.id} 
            className={`flex items-center bg-white p-4 rounded-2xl shadow-sm border-l-4 ${
              jogador.posicao === 1 ? 'border-yellow-400' : 
              jogador.posicao === 2 ? 'border-gray-400' : 
              jogador.posicao === 3 ? 'border-amber-600' : 'border-transparent'
            }`}
          >
            {/* Posição (1º, 2º, etc) */}
            <div className="w-10 text-center font-black text-xl text-gray-400">
              {jogador.posicao}º
            </div>

            {/* Foto do Jogador */}
            <div className="w-14 h-14 rounded-full overflow-hidden ml-2 border-2 border-gray-100">
              <img src={jogador.imagem} alt={jogador.nome} className="w-full h-full object-cover" />
            </div>

            {/* Informações */}
            <div className="ml-4 flex-1">
              <h3 className="font-bold text-blue-900">{jogador.nome}</h3>
              <p className="text-xs text-gray-500">{jogador.pais}</p>
            </div>

            {/* Votos */}
            <div className="text-right">
              <p className="font-extrabold text-blue-600">{jogador.votos}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Votos</p>
            </div>
          </div>
        ))}
      </div>

   
      <nav className="bottom-nav">
        <a href="/" className="nav-item cursor-pointer">
          <div className="nav-icon">⌂</div>
          <span>Início</span>
        </a>
        <div className="nav-item">
          <div className="nav-icon">☑</div>
          <span>Votação</span>
        </div>
    
        <div className="nav-item active">
          <div className="nav-icon">🏆</div>
          <span>Ranking</span>
        </div>
        <div className="nav-item">
          <div className="nav-icon">👤</div>
          <span>Perfil</span>
        </div>
      </nav>
    </div>
  );
}