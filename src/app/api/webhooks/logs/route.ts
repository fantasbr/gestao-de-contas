import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/webhooks/logs
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const webhook_id = searchParams.get('webhook_id');
  const status = searchParams.get('status');
  const data_inicio = searchParams.get('data_inicio');
  const data_fim = searchParams.get('data_fim');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  let query = supabase
    .from('webhooks_log')
    .select('*, webhook:app_webhooks(nome_evento)', { count: 'exact' })
    .order('criado_em', { ascending: false });

  if (webhook_id) {
    query = query.eq('webhook_id', webhook_id);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (data_inicio) {
    query = query.gte('criado_em', data_inicio);
  }
  if (data_fim) {
    query = query.lte('criado_em', data_fim);
  }

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    total: count || 0,
    page,
    limit,
  });
}
