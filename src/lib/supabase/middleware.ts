import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublicEnv } from '@/lib/supabase/env';
import type { Database } from '@/types';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export interface SessionUpdateResult {
  cookiesToSet: CookieToSet[];
  response: NextResponse;
  user: User | null;
}

export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({ request });
  const env = getSupabasePublicEnv();

  if (!env) {
    return { cookiesToSet: [], response: supabaseResponse, user: null };
  }

  let cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient<Database, 'public'>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies: CookieToSet[]) {
        cookiesToSet = nextCookies;

        nextCookies.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        nextCookies.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  }) as unknown as SupabaseClient<Database, 'public', 'public', Database['public']>;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { cookiesToSet, response: supabaseResponse, user };
}
