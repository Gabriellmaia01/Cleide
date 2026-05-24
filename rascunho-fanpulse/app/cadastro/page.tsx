'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Cadastro() {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cpf, email, password }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Redirecionar para o perfil após cadastro bem-sucedido
        router.push('/perfil');
      } else {
        setError(data.error || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-900 py-10">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[20%] -right-[10%] h-[60%] w-[50%] animate-[pulse_7s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute bottom-[0%] left-[0%] h-[70%] w-[60%] animate-[pulse_9s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-emerald-600/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-3xl shadow-lg">
              🏆
            </div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">Criar Conta</h2>
            <p className="text-sm text-gray-300">
              Junte-se à torcida do <span className="font-semibold text-emerald-400">FanPulse</span>
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-black/30 focus:ring-1 focus:ring-blue-400" 
                placeholder="Digite seu nome" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">CPF</label>
              <input 
                type="text" 
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-black/30 focus:ring-1 focus:ring-blue-400" 
                placeholder="000.000.000-00" 
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-black/30 focus:ring-1 focus:ring-blue-400" 
                placeholder="torcedor@email.com" 
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-white placeholder-gray-500 outline-none backdrop-blur-sm transition-all focus:border-blue-400 focus:bg-black/30 focus:ring-1 focus:ring-blue-400" 
                placeholder="••••••••" 
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4">
                <p className="text-sm font-medium text-red-400">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-4 text-sm font-semibold tracking-wide text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Criando...' : 'Cadastrar na Torcida'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Já tem uma conta? <Link href="/login" className="font-medium text-emerald-400 transition-colors hover:text-emerald-300">Faça Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}