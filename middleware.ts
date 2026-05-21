import type { CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

function redirectWithCookies(url: URL, cookiesToSet: CookieToSet[]) {
  const redirectResponse = NextResponse.redirect(url);

  cookiesToSet.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, options);
  });

  // Garantir que a página pode ser carregada em iframe
  redirectResponse.headers.set('Content-Security-Policy', "frame-ancestors *;");
  redirectResponse.headers.delete('X-Frame-Options');

  return redirectResponse;
}

function forbiddenWithCookies(cookiesToSet: CookieToSet[]) {
  const forbiddenResponse = new NextResponse('Acesso nao autorizado', { status: 403 });

  cookiesToSet.forEach(({ name, value, options }) => {
    forbiddenResponse.cookies.set(name, value, options);
  });

  forbiddenResponse.headers.set('Content-Security-Policy', "frame-ancestors *;");
  forbiddenResponse.headers.delete('X-Frame-Options');

  return forbiddenResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/contas') ||
    pathname.startsWith('/contas-pagas') ||
    pathname.startsWith('/conciliacao') ||
    pathname.startsWith('/fornecedores') ||
    pathname.startsWith('/categorias') ||
    pathname.startsWith('/empresas') ||
    pathname.startsWith('/configuracoes') ||
    pathname.startsWith('/relatorios');

  const isAuthRoute = pathname.startsWith('/login');

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next({ request });
  }

  const { response: sessionResponse, role, user, cookiesToSet } = await updateSession(request);

  if (pathname === '/') {
    if (user && role === 'motorista') {
      return forbiddenWithCookies(cookiesToSet);
    }

    const url = request.nextUrl.clone();
    url.pathname = user ? '/dashboard' : '/login';
    return redirectWithCookies(url, cookiesToSet);
  }

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return redirectWithCookies(url, cookiesToSet);
  }

  if (isProtectedRoute && role === 'motorista') {
    return forbiddenWithCookies(cookiesToSet);
  }

  if (isAuthRoute && user) {
    if (role === 'motorista') {
      return forbiddenWithCookies(cookiesToSet);
    }

    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return redirectWithCookies(url, cookiesToSet);
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/(?!webhooks)).*)',
  ],
};
