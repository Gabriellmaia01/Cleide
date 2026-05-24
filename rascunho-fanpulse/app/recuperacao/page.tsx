import React from 'react';
import Link from 'next/link';

export default function Recuperacao() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[20%] h-[50%] w-[40%] animate-[pulse_6s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] h-[50%] w-[40%] animate-[pulse_8s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-orange-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-3xl shadow-lg">
              🔒
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">Recuperar Senha</h2>
            <p className="text-sm text-gray-300">
              Enviaremos as instruções de acesso para o seu email.
            </p>
          </div>

          <form className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Email Cadastrado</label>
              <input 
                type="email" 
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:border-amber-400 focus:bg-black/30 focus:ring-1 focus:ring-amber-400" 
                placeholder="torcedor@email.com" 
                required
              />
            </div>

            <button 
              type="submit" 
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-amber-500/30 active:scale-95"
            >
              Enviar Link de Recuperação
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Lembrou a senha? <Link href="/login" className="font-medium text-amber-400 transition-colors hover:text-amber-300">Voltar para o Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}