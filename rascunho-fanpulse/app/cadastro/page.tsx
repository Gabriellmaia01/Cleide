export default function Cadastro() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-500 via-blue-600 to-yellow-400 p-4">
      
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border-t-4 border-yellow-400 relative overflow-hidden">
        
        {/* Detalhe visual de fundo no card */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 text-2xl rounded-full mb-3 shadow-sm border border-blue-100">
            🏆
          </div>
          <h2 className="text-3xl font-extrabold text-blue-900">Criar Conta</h2>
          <p className="text-sm text-gray-500 mt-2">
            Junte-se à torcida do <span className="font-bold text-green-600">FanPulse</span>
          </p>
        </div>

        <form className="space-y-4 relative z-10">
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Nome Completo</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all" 
              placeholder="Digite seu nome" 
              required
            />
          </div>

          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">CPF</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all" 
              placeholder="000.000.000-00" 
              required
            />
          </div>
          
          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Email</label>
            <input 
              type="email" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all" 
              placeholder="torcedor@email.com" 
              required
            />
          </div>

          <div>
            <label className="block text-blue-900 text-sm font-bold mb-2">Senha</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all" 
              placeholder="••••••••" 
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-4 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg transition transform hover:-translate-y-1 mt-6 flex justify-center items-center gap-2"
          >
            Cadastrar na Torcida
          </button>
        </form>

        <div className="text-center mt-6 relative z-10">
          <p className="text-sm text-gray-600">
            Já tem uma conta? <a href="/login" className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition">Faça Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}