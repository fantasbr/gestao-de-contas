import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/config
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('api_configuracoes')
    .select('api_token')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json({ api_token: null });
  }

  return NextResponse.json({
    api_token: data?.api_token ? '••••••••••••••••' : null,
  });
}

// PATCH /api/config
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { api_token } = body;

  // Upsert
  const { data, error } = await supabase
    .from('api_configuracoes')
    .upsert({ id: 1, api_token })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
