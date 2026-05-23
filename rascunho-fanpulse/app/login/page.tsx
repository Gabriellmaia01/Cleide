export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-500 via-blue-600 to-yellow-400 p-4">
      
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl border-t-4 border-yellow-400 relative overflow-hidden">
        
        {/* Detalhe visual de fundo no card */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-green-100 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-50 text-2xl rounded-full mb-3 shadow-sm border border-green-100">
            ⚽
          </div>
          <h2 className="text-3xl font-extrabold text-blue-900">Bem-vindo de volta!</h2>
          <p className="text-sm text-gray-500 mt-2">
            Faça login para votar no <span className="font-bold text-green-600">FanPulse</span>
          </p>
        </div>

        <form className="space-y-5 relative z-10">
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

          {/* Requisito RF02: Erro genérico por segurança */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
            <p className="text-red-700 text-sm font-semibold">Email ou senha incorretos. Tente novamente.</p>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition transform hover:-translate-y-1 mt-6 flex justify-center items-center gap-2"
          >
            Entrar
          </button>
        </form>

        <div className="text-center mt-6 space-y-3 relative z-10">
          <p className="text-sm text-gray-600">
            Esqueceu sua senha? <a href="/recuperacao" className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition">Recuperar acesso</a>
          </p>
          <p className="text-sm text-gray-600">
            Ainda não tem conta? <a href="/cadastro" className="text-green-600 hover:text-green-800 hover:underline font-bold transition">Cadastre-se</a>
          </p>
        </div>
      </div>
    </div>
  );
}