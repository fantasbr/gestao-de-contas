import { timingSafeEqual } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type ApiTokenAuthResult =
  | { ok: true; supabase: SupabaseServerClient }
  | { ok: false; response: NextResponse };

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

function safeTokenEquals(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function requireApiToken(request: NextRequest): Promise<ApiTokenAuthResult> {
  const receivedToken = getBearerToken(request);
  if (!receivedToken) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token de API ausente' }, { status: 401 }),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('api_configuracoes')
    .select('api_token')
    .eq('id', 1)
    .single();

  if (error) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Erro ao validar token de API' }, { status: 500 }),
    };
  }

  if (!data?.api_token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token de API nao configurado' }, { status: 503 }),
    };
  }

  if (!safeTokenEquals(receivedToken, data.api_token)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Token de API invalido' }, { status: 401 }),
    };
  }

  return { ok: true, supabase };
}
