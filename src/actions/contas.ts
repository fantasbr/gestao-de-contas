/**
 * Server Actions para operações com Contas
 * Segue o padrão: Cache-First com Invalidation Manual
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { StatusConta, StatusProcessamento } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface ContaInput {
  descricao: string;
  valor: number;
  data_vencimento: string;
  fornecedor_id?: string;
  favorecido_nome?: string;
  favorecido_documento?: string;
  categoria_id?: string;
  empresa_pagadora_id?: number;
  observacoes?: string;
  url_nf?: string;
}

export interface UpdateContaInput extends Partial<ContaInput> {
  status?: StatusConta;
  status_processamento?: StatusProcessamento;
  conferido?: boolean;
  conferido_por?: string;
  conferido_em?: string;
  observacao_conferido?: string;
  data_pagamento?: string;
  url_comprovante_pagamento?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateContaResult {
  success: boolean;
  data?: { id: string } | null;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se usuário está autenticado e retorna seus dados
 */
async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, error: 'Não autenticado' };
  }

  // Buscar perfil do usuário
  const { data: perfil } = await supabase.from('perfis_usuarios').select('*').eq('id', user.id).single();

  return { user, perfil };
}

// ============================================
// CREATE
// ============================================

/**
 * Cria uma nova conta
 */
export async function criarConta(formData: FormData): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  // Extrair dados do FormData
  const data: ContaInput = {
    descricao: formData.get('descricao') as string,
    valor: Number(formData.get('valor')),
    data_vencimento: formData.get('data_vencimento') as string,
    fornecedor_id: (formData.get('fornecedor_id') as string) || undefined,
    favorecido_nome: (formData.get('favorecido_nome') as string) || undefined,
    favorecido_documento: (formData.get('favorecido_documento') as string) || undefined,
    categoria_id: (formData.get('categoria_id') as string) || undefined,
    empresa_pagadora_id: Number(formData.get('empresa_pagadora_id')) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
    url_nf: (formData.get('url_nf') as string) || undefined,
  };

  // Validações básicas
  if (!data.descricao || !data.valor || !data.data_vencimento) {
    return { success: false, error: 'Campos obrigatórios não preenchidos' };
  }

  // Inserir conta
  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .insert({ ...data, created_by: user.id, status: 'pendente', status_processamento: 'pendente' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar conta:', error);
    return { success: false, error: error.message };
  }

  // Registrar log de auditoria (não bloqueia)
  supabase
    .from('contas_log')
    .insert({
      conta_id: conta.id,
      acao: 'criado',
      dados_novos: conta,
      realizado_por: user.id,
    })
    .then(({ error: logError }) => {
      if (logError) console.error('Erro ao registrar log:', logError);
    });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');

  return { success: true, data: conta };
}

/**
 * Cria conta via JSON (para uploads n8n)
 */
export async function criarContaJson(data: Record<string, unknown>): Promise<CreateContaResult> {
  const supabase = await createClient();

  // Verificar duplicata
  if (data.fornecedor_id || data.favorecido_nome) {
    const { data: existente } = await supabase
      .from('contas_pagar')
      .select('id')
      .is('deleted_at', null)
      .eq('status', 'pendente')
      .eq('valor', data.valor)
      .eq('data_vencimento', data.data_vencimento)
      .single();

    if (existente) {
      return { success: false, error: 'Conta duplicada', data: existente };
    }
  }

  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .insert({ ...data, status_processamento: 'processado' })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar conta:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/contas');
  revalidatePath('/dashboard');

  return { success: true, data: conta };
}

// ============================================
// UPDATE
// ============================================

/**
 * Atualiza uma conta
 */
export async function atualizarConta(id: string, updates: UpdateContaInput): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  // Buscar dados anteriores para log
  const { data: anterior } = await supabase.from('contas_pagar').select().eq('id', id).single();

  // Atualizar
  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar conta:', error);
    return { success: false, error: error.message };
  }

  // Registrar log
  supabase
    .from('contas_log')
    .insert({
      conta_id: id,
      acao: 'editado',
      dados_anteriores: anterior,
      dados_novos: conta,
      realizado_por: user.id,
    })
    .then(({ error: logError }) => {
      if (logError) console.error('Erro ao registrar log:', logError);
    });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');
  revalidatePath(`/contas/${id}`);

  return { success: true, data: conta };
}

/**
 * Marca conta como conferida
 */
export async function marcarConferido(id: string, observacao?: string): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .update({
      conferido: true,
      conferido_por: user.id,
      conferido_em: new Date().toISOString(),
      observacao_conferido: observacao,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao marcar como conferida:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'conferido',
    observacao,
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');
  revalidatePath(`/contas/${id}`);

  return { success: true, data: conta };
}

/**
 * Registra pagamento de uma conta
 */
export async function registrarPagamento(
  id: string,
  data_pagamento: string,
  url_comprovante?: string
): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  // Validar data de pagamento (não pode ser futura)
  if (new Date(data_pagamento) > new Date()) {
    return { success: false, error: 'Data de pagamento não pode ser futura' };
  }

  const supabase = await createClient();

  // Buscar conta anterior
  const { data: anterior } = await supabase.from('contas_pagar').select().eq('id', id).single();

  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .update({
      status: 'pago',
      data_pagamento,
      url_comprovante_pagamento: url_comprovante,
      pago_por: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao registrar pagamento:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'pago',
    dados_anteriores: anterior,
    dados_novos: conta,
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');
  revalidatePath(`/contas/${id}`);

  return { success: true, data: conta };
}

/**
 * Salva comprovante de pagamento
 */
export async function salvarComprovante(
  id: string,
  url_comprovante: string
): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .update({ url_comprovante_pagamento: url_comprovante })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar comprovante:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath(`/contas/${id}`);

  return { success: true, data: conta };
}

// ============================================
// DELETE
// ============================================

/**
 * Exclui uma conta (soft delete)
 */
export async function excluirConta(id: string): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  // Apenas admin pode excluir
  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir contas' };
  }

  const supabase = await createClient();

  // Buscar dados para log
  const { data: anterior } = await supabase.from('contas_pagar').select().eq('id', id).single();

  // Soft delete
  const { error } = await supabase
    .from('contas_pagar')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir conta:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'excluido',
    dados_anteriores: anterior,
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');
  revalidatePath(`/contas/${id}`);

  return { success: true };
}

/**
 * Restaura uma conta excluída
 */
export async function restaurarConta(id: string): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const { data: conta, error } = await supabase
    .from('contas_pagar')
    .update({ deleted_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao restaurar conta:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('contas_log').insert({
    conta_id: id,
    acao: 'restaurado',
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/contas');
  revalidatePath('/dashboard');

  return { success: true, data: conta };
}
