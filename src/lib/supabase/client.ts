import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { Database } from '@/types';

type BrowserSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>;

let client: BrowserSupabaseClient | null = null;

/**
 * Lock customizado que executa o callback diretamente, sem tentar adquirir
 * navigator.locks ou localStorage locks. Necessário quando a aplicação roda
 * dentro de um iframe cross-site (e.g. CRM), onde a Web Locks API pode ser
 * bloqueada pelo navegador, causando timeout e loop infinito de autenticação.
 */
type LockFn = (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => Promise<unknown>;
const iframeSafeLock: LockFn = (_name, _acquireTimeout, fn) => fn();

/**
 * Retorna o cliente Supabase para o browser.
 * Retorna null quando executado no servidor (SSG/SSR build time)
 * pois as variáveis NEXT_PUBLIC_* só existem em runtime.
 */
export function getSupabaseBrowserClient(): BrowserSupabaseClient | null {
  // Não executa no servidor (evita falha no build Docker com .env.production vazio)
  if (typeof window === 'undefined') return null;

  if (client) return client;

  const env = getSupabasePublicEnv();
  if (!env) return null;

  client = createBrowserClient<Database, 'public'>(env.url, env.anonKey, {
    cookieOptions: {
      sameSite: 'none',
      secure: true,
    },
    auth: {
      lock: iframeSafeLock,
      // Desativa o detectSessionInUrl para evitar loops quando a URL não muda
      detectSessionInUrl: true,
      // Persistência via cookie gerenciado pelo middleware (SSR)
      persistSession: true,
      // Sem auto-refresh de token conflitante com o lock
      autoRefreshToken: true,
    },
  } as any) as unknown as BrowserSupabaseClient;
  return client;
}

export { getSupabaseBrowserClient as createClient };

