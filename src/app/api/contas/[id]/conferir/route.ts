import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/contas/[id]/conferir
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('contas_pagar')
    .update({
      conferido: true,
      conferido_por: user?.id,
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
    realizado_por: user?.id,
  });

  return NextResponse.json(data);
}
