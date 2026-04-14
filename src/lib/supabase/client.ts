import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnvOrThrow } from '@/lib/supabase/env';
import type { Database } from '@/types';

type BrowserSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>;

let client: BrowserSupabaseClient | null = null;

export function getSupabaseBrowserClient(): BrowserSupabaseClient {
  if (client) return client;

  const { url, anonKey } = getSupabasePublicEnvOrThrow('supabase/client');
  client = createBrowserClient<Database, 'public'>(url, anonKey) as unknown as BrowserSupabaseClient;

  return client;
}

export { getSupabaseBrowserClient as createClient };
