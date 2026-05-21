import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireRole } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/contas/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;

  const { data, error } = await supabase
    .from('contas_pagar')
    .select(`
      *,
      fornecedor:fornecedores(*),
      categoria:categorias(*),
      empresa:empresas(*)
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Conta nao encontrada' }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/contas/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;
  const body = await request.json();

  // Buscar dados anteriores
  const { data: anterior } = await supabase
    .from('contas_pagar')
    .select()
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('contas_pagar')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Registrar em log
  await supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'editado',
    dados_anteriores: anterior,
    dados_novos: data,
    realizado_por: auth.userId,
  });

  return NextResponse.json(data);
}

// DELETE /api/contas/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;

  const { error } = await supabase
    .from('contas_pagar')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Registrar em log
  await supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'excluido',
    realizado_por: auth.userId,
  });

  return NextResponse.json({ success: true });
}
