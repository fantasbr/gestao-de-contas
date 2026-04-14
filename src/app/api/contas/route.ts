import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { StatusConta } from '@/types/database';

// GET /api/contas - Listar contas
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const statusParam = searchParams.get('status');
  const conferido = searchParams.get('conferido');
  const isValidStatus = (value: string): value is StatusConta =>
    ['pendente', 'pago', 'vencido', 'cancelado'].includes(value);

  let query = supabase
    .from('contas_pagar')
    .select(`
      *,
      fornecedor:fornecedores(*),
      categoria:categorias(*),
      empresa:empresas(*)
    `, { count: 'exact' })
    .is('deleted_at', null);

  if (statusParam && isValidStatus(statusParam)) {
    query = query.eq('status', statusParam);
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
    const valor =
      typeof body.valor === 'number'
        ? body.valor
        : typeof body.valor === 'string'
          ? Number(body.valor)
          : NaN;
    const dataVencimento = typeof body.data_vencimento === 'string' ? body.data_vencimento : '';

    if (!Number.isFinite(valor) || !dataVencimento || typeof body.descricao !== 'string') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    if (body.fornecedor_id || body.favorecido_nome) {
      const { data: existente } = await supabase
        .from('contas_pagar')
        .select('id')
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .eq('valor', valor)
        .eq('data_vencimento', dataVencimento)
        .single();

      if (existente) {
        return NextResponse.json(
          { error: 'Conta duplicada', duplicata_id: existente.id },
          { status: 409 }
        );
      }
    }

    const insertData = {
      descricao: body.descricao,
      valor,
      data_vencimento: dataVencimento,
      fornecedor_id: typeof body.fornecedor_id === 'string' ? body.fornecedor_id : null,
      categoria_id: typeof body.categoria_id === 'string' ? body.categoria_id : null,
      favorecido_nome: typeof body.favorecido_nome === 'string' ? body.favorecido_nome : null,
      favorecido_cnpj_cpf:
        typeof body.favorecido_documento === 'string'
          ? body.favorecido_documento
          : typeof body.favorecido_cnpj_cpf === 'string'
            ? body.favorecido_cnpj_cpf
            : null,
      numero_documento: typeof body.numero_documento === 'string' ? body.numero_documento : null,
      linha_digitavel: typeof body.linha_digitavel === 'string' ? body.linha_digitavel : null,
      codigo_barras: typeof body.codigo_barras === 'string' ? body.codigo_barras : null,
      url_pdf_original: typeof body.url_pdf_original === 'string' ? body.url_pdf_original : null,
      observacoes: typeof body.observacoes === 'string' ? body.observacoes : null,
      status: 'pendente' as const,
      status_processamento: 'processado' as const,
    };

    const { data, error } = await supabase
      .from('contas_pagar')
      .insert(insertData)
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
