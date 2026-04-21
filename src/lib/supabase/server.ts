import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabasePublicEnvOrThrow } from '@/lib/supabase/env';
import type { Database } from '@/types';

type ServerSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>;
type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createServerSupabaseClient(): Promise<ServerSupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabasePublicEnvOrThrow('supabase/server');

  return createServerClient<Database, 'public'>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOpts = {
              ...options,
              sameSite: 'none' as const,
              secure: true
            };
            cookieStore.set(name, value, cookieOpts);
          });
        } catch {
          // Server Components cannot always mutate cookies; middleware handles refresh writes.
        }
      },
    },
  }) as unknown as ServerSupabaseClient;
}

export { createServerSupabaseClient as createClient };
