import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase sem SSR para uso no browser
let client: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found');
    return null;
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}

export function createClient() {
  return getSupabaseBrowserClient();
}
