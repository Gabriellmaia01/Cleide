import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cpf, email, password } = body;

    if (!name || !cpf || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    const db = sql();

    // Cria um hash SHA-256 da senha
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    let user;
    try {
      const result = await db`
        INSERT INTO users (name, cpf, email, password_hash)
        VALUES (${name}, ${cpf}, ${email}, ${passwordHash})
        RETURNING id, name, email
      `;
      user = result[0];
    } catch (e: any) {
      // Tratamento de erro de violação de restrição única (unique constraint)
      if (e.message && e.message.includes('users_email_key')) {
         return NextResponse.json({ success: false, error: 'Email já cadastrado' }, { status: 400 });
      }
      if (e.message && e.message.includes('users_cpf_key')) {
         return NextResponse.json({ success: false, error: 'CPF já cadastrado' }, { status: 400 });
      }
      throw e;
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
    console.error('[API REGISTER] Erro no cadastro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar cadastro' },
      { status: 500 }
    );
  }
}
