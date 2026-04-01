import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Criar resposta inicial
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Criar cliente Supabase para verificar autenticação
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // ✅ CORRIGIDO: Verificar corretamente se o usuário está autenticado
  const { data: { user }, error } = await supabase.auth.getUser();

  // Pega o pathname atual
  const pathname = request.nextUrl.pathname;

  // Verifica se é uma rota protegida
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/contas') ||
                           pathname.startsWith('/fornecedores') ||
                           pathname.startsWith('/categorias') ||
                           pathname.startsWith('/empresas') ||
                           pathname.startsWith('/configuracoes') ||
                           pathname.startsWith('/relatorios');

  const isAuthRoute = pathname.startsWith('/login');

  // Se não está autenticado e tenta acessar rota protegida, redireciona para login
  if (isProtectedRoute) {
    // ✅ CORRIGIDO: Verifica user diretamente, não só o cookie
    if (!user || error) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Se está autenticado e tenta acessar login, redireciona para dashboard
  if (isAuthRoute) {
    // ✅ CORRIGIDO: Verifica user diretamente, não só o cookie
    if (user && !error) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
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
