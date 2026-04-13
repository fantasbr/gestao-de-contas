export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  
  const { searchParams } = new URL(request.url);
  const webhook_id = searchParams.get('webhook_id');
  const status = searchParams.get('status');
  const data_inicio = searchParams.get('data_inicio');
  const data_fim = searchParams.get('data_fim');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  try {
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

    if (error) throw error;

    return NextResponse.json({ data: data || [], count: count || 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 });
  }
}
