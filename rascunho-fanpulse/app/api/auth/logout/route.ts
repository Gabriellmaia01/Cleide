import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('fanpulse_session');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API LOGOUT] Erro no logout:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    );
  }
}
