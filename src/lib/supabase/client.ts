import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { Database } from '@/types';

type BrowserSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>;

let client: BrowserSupabaseClient | null = null;

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

  client = createBrowserClient<Database, 'public'>(env.url, env.anonKey) as unknown as BrowserSupabaseClient;
  return client;
}

export { getSupabaseBrowserClient as createClient };
