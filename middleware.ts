import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Criar cliente Supabase para verificar autenticação
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

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

  // Otimização: Se não é rota de auth nem protegida, retorna logo (pula rede do Supabase)
  if (!isProtectedRoute && !isAuthRoute) {
    return supabaseResponse;
  }

  // Verificar se o usuário está autenticado
  // Esta chamada faz requisição à API do Supabase e causa lentidão se não for filtrada
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
