import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/contas - Listar contas
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const status = searchParams.get('status');
  const conferido = searchParams.get('conferido');

  let query = supabase
    .from('contas_pagar')
    .select(`
      *,
      fornecedor:fornecedores(*),
      categoria:categorias(*),
      empresa:empresas(*)
    `, { count: 'exact' })
    .is('deleted_at', null);

  if (status) {
    query = query.eq('status', status);
  }
  if (conferido !== null && conferido !== undefined) {
    query = query.eq('conferido', conferido === 'true');
  }

  query = query
    .order('data_vencimento', { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

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

// POST /api/contas - Criar conta (via n8n)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  try {
    // Verificar duplicata
    if (body.fornecedor_id || body.favorecido_nome) {
      const { data: existente } = await supabase
        .from('contas_pagar')
        .select('id')
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .eq('valor', body.valor)
        .eq('data_vencimento', body.data_vencimento)
        .single();

      if (existente) {
        return NextResponse.json(
          { error: 'Conta duplicada', duplicata_id: existente.id },
          { status: 409 }
        );
      }
    }

    const { data, error } = await supabase
      .from('contas_pagar')
      .insert({
        ...body,
        status_processamento: 'processado',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
