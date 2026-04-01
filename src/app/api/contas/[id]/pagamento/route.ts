import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/contas/[id]/pagamento
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();

  // Buscar dados anteriores
  const { data: anterior } = await supabase
    .from('contas_pagar')
    .select()
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('contas_pagar')
    .update({
      status: 'pago',
      data_pagamento: body.data_pagamento,
      url_comprovante_pagamento: body.url_comprovante_pagamento || null,
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
    acao: 'pago',
    dados_anteriores: anterior,
    dados_novos: data,
    realizado_por: user?.id,
  });

  return NextResponse.json(data);
}
