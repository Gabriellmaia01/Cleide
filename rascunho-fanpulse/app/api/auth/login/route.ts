import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const db = sql();
    const crypto = require('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // NOTA: Em produção, o ideal é usar hash de senha (bcrypt). Para o MVP, validaremos a string direta ou qualquer senha dummy temporariamente (se for registro automático),
    // ou assumimos a query básica.
    const users = await db`SELECT id, name, email FROM users WHERE email = ${email} AND password_hash = ${passwordHash} LIMIT 1`;
    const user = users[0];

    if (!user) {
      // Por enquanto, como o MVP não tem signup finalizado, vamos simular sucesso ou criar conta dummy se não existir?
      // Melhor retornar erro genérico.
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Configurando sessão em cookies
    const cookieStore = await cookies();
    cookieStore.set({
      name: 'fanpulse_session',
      value: JSON.stringify({ id: user.id, name: user.name, email: user.email }),
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    return NextResponse.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('[API LOGIN] Erro no login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar login' },
      { status: 500 }
    );
  }
}
