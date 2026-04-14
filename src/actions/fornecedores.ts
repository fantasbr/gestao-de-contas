/**
 * Server Actions para operações com Fornecedores
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface FornecedorInput {
  nome: string;
  documento?: string;
  tipo_documento?: 'CNPJ' | 'CPF';
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  observacoes?: string;
}

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

  if (authError || !user) {
    return { user: null, perfil: null, error: 'Não autenticado' };
  }

  const { data: perfil } = await supabase.from('perfis_usuarios').select('*').eq('id', user.id).single();

  return { user, perfil, error: null };
}

/**
 * Cria um novo fornecedor
 */
export async function criarFornecedor(formData: FormData): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const data: FornecedorInput = {
    nome: formData.get('nome') as string,
    documento: (formData.get('documento') as string) || undefined,
    tipo_documento: (formData.get('tipo_documento') as 'CNPJ' | 'CPF') || undefined,
    email: (formData.get('email') as string) || undefined,
    telefone: (formData.get('telefone') as string) || undefined,
    endereco: (formData.get('endereco') as string) || undefined,
    cidade: (formData.get('cidade') as string) || undefined,
    estado: (formData.get('estado') as string) || undefined,
    cep: (formData.get('cep') as string) || undefined,
    banco: (formData.get('banco') as string) || undefined,
    agencia: (formData.get('agencia') as string) || undefined,
    conta: (formData.get('conta') as string) || undefined,
    pix: (formData.get('pix') as string) || undefined,
    observacoes: (formData.get('observacoes') as string) || undefined,
  };

  if (!data.nome) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  const { data: fornecedor, error } = await supabase.from('fornecedores').insert(data).select().single();

  if (error) {
    console.error('Erro ao criar fornecedor:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('fornecedores_log').insert({
    fornecedor_id: fornecedor.id,
    acao: 'criado',
    dados_novos: fornecedor,
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/fornecedores');
  revalidatePath('/contas'); // Lookup muda

  return { success: true, data: fornecedor };
}

/**
 * Atualiza um fornecedor
 */
export async function atualizarFornecedor(id: string, data: Partial<FornecedorInput>): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  // Buscar dados anteriores
  const { data: anterior } = await supabase.from('fornecedores').select().eq('id', id).single();

  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('fornecedores_log').insert({
    fornecedor_id: id,
    acao: 'editado',
    dados_anteriores: anterior,
    dados_novos: fornecedor,
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/fornecedores');
  revalidatePath(`/fornecedores/${id}`);
  revalidatePath('/contas');

  return { success: true, data: fornecedor };
}

/**
 * Exclui um fornecedor (soft delete)
 */
export async function excluirFornecedor(id: string): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir fornecedores' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('fornecedores')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir fornecedor:', error);
    return { success: false, error: error.message };
  }

  // Log
  supabase.from('fornecedores_log').insert({
    fornecedor_id: id,
    acao: 'excluido',
    realizado_por: user.id,
  });

  // ✅ Invalida cache
  revalidatePath('/fornecedores');
  revalidatePath('/contas');

  return { success: true };
}
