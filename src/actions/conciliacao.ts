'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { user: null, error: 'Não autenticado' };

  const { data: perfil } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, perfil };
}

/**
 * Vincula uma conta a pagar a um comprovante de pagamento (conta paga).
 * - Atualiza contas_pagar: status=pago, data_pagamento, url_comprovante, conta_paga_id
 * - Atualiza contaspagas:  conciliado=true, conta_pagar_id
 * - Registra log de auditoria
 */
export async function vincularConciliacao(
  contaPagarId: string,
  contaPagaId: number
): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) return { success: false, error: authError || 'Não autenticado' };

  if (perfil?.role !== 'admin' && perfil?.role !== 'atendente') {
    return { success: false, error: 'Sem permissão para conciliar' };
  }

  const supabase = await createClient();

  // Buscar dados da conta paga para copiar url e data de pagamento
  const { data: contaPaga, error: cpError } = await supabase
    .from('contaspagas')
    .select('*')
    .eq('id', contaPagaId)
    .single();

  if (cpError || !contaPaga) {
    return { success: false, error: 'Comprovante não encontrado' };
  }

  // Buscar dados anteriores para log
  const { data: anterior } = await supabase
    .from('contas_pagar')
    .select('*')
    .eq('id', contaPagarId)
    .single();

  // Atualizar contas_pagar
  const { data: contaAtualizada, error: updateError } = await supabase
    .from('contas_pagar')
    .update({
      status: 'pago',
      data_pagamento: contaPaga.data_pagamento,
      url_comprovante_pagamento: contaPaga.url_pdf,
      conta_paga_id: contaPagaId,
    } as any)
    .eq('id', contaPagarId)
    .select()
    .single();

  if (updateError) {
    console.error('Erro ao atualizar conta a pagar:', updateError);
    return { success: false, error: updateError.message };
  }

  // Atualizar contaspagas
  const { error: cpUpdateError } = await supabase
    .from('contaspagas')
    .update({ conciliado: true, conta_pagar_id: contaPagarId } as any)
    .eq('id', contaPagaId);

  if (cpUpdateError) {
    console.error('Erro ao atualizar conta paga:', cpUpdateError);
    // Não bloqueia — principal já foi feito
  }

  // Log de auditoria
  supabase.from('contas_log').insert({
    conta_id: contaPagarId,
    acao: 'conciliado',
    dados_anteriores: anterior,
    dados_novos: contaAtualizada,
    realizado_por: user.id,
  });

  revalidatePath('/conciliacao');
  revalidatePath('/contas');
  revalidatePath('/contas-pagas');
  revalidatePath(`/contas/${contaPagarId}`);

  return { success: true, data: contaAtualizada };
}

/**
 * Desfaz a conciliação de uma conta a pagar.
 * - Reverte contas_pagar: status=pendente/vencido, limpa data_pagamento, url e conta_paga_id
 * - Reverte contaspagas: conciliado=false, conta_pagar_id=null
 */
export async function desvincularConciliacao(
  contaPagarId: string
): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) return { success: false, error: authError || 'Não autenticado' };

  if (perfil?.role !== 'admin' && perfil?.role !== 'atendente') {
    return { success: false, error: 'Sem permissão para desvincular' };
  }

  const supabase = await createClient();

  // Buscar conta para obter o conta_paga_id
  const { data: anterior } = await supabase
    .from('contas_pagar')
    .select('*')
    .eq('id', contaPagarId)
    .single();

  const contaPagaId = (anterior as any)?.conta_paga_id;

  // Determinar status de retorno baseado na data de vencimento
  const vencimento = anterior?.data_vencimento ? new Date(anterior.data_vencimento) : null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const novoStatus = vencimento && vencimento < hoje ? 'vencido' : 'pendente';

  // Reverter contas_pagar
  const { error: revertError } = await supabase
    .from('contas_pagar')
    .update({
      status: novoStatus,
      data_pagamento: null,
      url_comprovante_pagamento: null,
      conta_paga_id: null,
    } as any)
    .eq('id', contaPagarId);

  if (revertError) {
    console.error('Erro ao desvincular conta:', revertError);
    return { success: false, error: revertError.message };
  }

  // Reverter contaspagas (se temos o ID)
  if (contaPagaId) {
    await supabase
      .from('contaspagas')
      .update({ conciliado: false, conta_pagar_id: null } as any)
      .eq('id', contaPagaId);
  }

  // Log
  supabase.from('contas_log').insert({
    conta_id: contaPagarId,
    acao: 'desvinculado',
    dados_anteriores: anterior,
    realizado_por: user.id,
  });

  revalidatePath('/conciliacao');
  revalidatePath('/contas');
  revalidatePath('/contas-pagas');
  revalidatePath(`/contas/${contaPagarId}`);

  return { success: true };
}
