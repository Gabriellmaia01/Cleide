// =============================================================
// FanPulse — Next.js Middleware
// =============================================================
// Executa em CADA request antes de atingir as rotas.
// Responsabilidades:
//   - Extração e injeção de IP para headers
//   - Proteção de rotas que exigem autenticação
//   - Logging de requests em desenvolvimento
// =============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que exigem autenticação
const PROTECTED_API_ROUTES = [
  '/api/vote',
];

// Rotas que NÃO devem passar pelo middleware
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/players',
  '/api/matches',
  '/api/ranking',
  '/_next',
  '/favicon.ico',
  '/imagens',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pula assets estáticos e rotas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Injeção de IP nos headers ────────────────────────────
  const response = NextResponse.next();

  // Extrai IP real (Vercel injeta x-forwarded-for)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '127.0.0.1';

  // Injeta IP em header customizado para fácil acesso nas routes
  response.headers.set('x-client-ip', ip);

  // ── Proteção de rotas de API ─────────────────────────────
  if (PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    // Verifica se é um POST (GET é público para consultar votos)
    if (request.method === 'POST') {
      const token = request.cookies.get('fanpulse_session')?.value;

      if (!token) {
        return Response.json(
          { success: false, error: 'Autenticação necessária' },
          { status: 401 }
        );
      }

      // Nota: a validação completa do JWT é feita na route handler
      // Aqui apenas verificamos se o cookie existe (fast-fail)
    }
  }

  // ── Logging em desenvolvimento ───────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[MW] ${request.method} ${pathname} | IP: ${ip}`
    );
  }

  return response;
}

// ── Matcher: quais rotas ativam o middleware ──────────────────
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    // Páginas (exceto _next, static, etc)
    '/((?!_next/static|_next/image|favicon.ico|imagens).*)',
  ],
};
