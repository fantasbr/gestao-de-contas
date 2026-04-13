import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Se não houver variáveis configuradas, pular autenticação
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured, skipping auth');
    return supabaseResponse;
  }

  // Criar cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Verifica se é uma rota protegida
  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/contas') ||
    pathname.startsWith('/fornecedores') ||
    pathname.startsWith('/categorias') ||
    pathname.startsWith('/empresas') ||
    pathname.startsWith('/configuracoes') ||
    pathname.startsWith('/relatorios');

  const isAuthRoute = pathname.startsWith('/login');

  // Otimização: Se não é rota de auth nem protegida, retorna logo
  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  // Obter token do cookie manualmente
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  if (accessToken) {
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });
  }

  // Verificar se o usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirecionamento da raiz puro para dashboard ou login
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = user ? '/dashboard' : '/login';
    return NextResponse.redirect(url);
  }

  // Se não está autenticado e tenta acessar rota protegida, redireciona para login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Se está autenticado e tenta acessar login, redireciona para dashboard
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (exceto webhooks)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/(?!webhooks)).*)',
  ],
};
