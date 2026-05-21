import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/contas/[id]/conferir
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole(['admin', 'atendente']);
  if (!auth.ok) {
    return auth.response;
  }

  const { id } = await params;
  const supabase = auth.supabase;
  const body = await request.json();

  const { data, error } = await supabase
    .from('contas_pagar')
    .update({
      conferido: true,
      conferido_por: auth.userId,
      conferido_em: new Date().toISOString(),
      observacao_conferido: body.observacao_conferido || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Registrar em log
  await supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'conferido',
    dados_novos: data,
    realizado_por: auth.userId,
  });

  return NextResponse.json(data);
}
