import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type AdminAuthResult =
  | { ok: true; supabase: SupabaseServerClient; userId: string }
  | { ok: false; response: NextResponse };

type AllowedRole = 'admin' | 'atendente';

export async function requireRole(roles: AllowedRole[]): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }),
    };
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .single();

  if (perfilError || !perfil?.role || !roles.includes(perfil.role as AllowedRole)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Acesso nao autorizado' }, { status: 403 }),
    };
  }

  return { ok: true, supabase, userId: user.id };
}

export async function requireAdmin(): Promise<AdminAuthResult> {
  return requireRole(['admin']);
}
