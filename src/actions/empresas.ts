/**
 * Server Actions para operações com Empresas
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface EmpresaInput {
  nome: string;
  documento?: string;
  tipo_documento?: 'CNPJ' | 'CPF';
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  logo_url?: string;
}

export interface ActionResult<T = void> {
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
 * Cria uma nova empresa
 */
export async function criarEmpresa(formData: FormData): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const data: EmpresaInput = {
    nome: formData.get('nome') as string,
    documento: (formData.get('documento') as string) || undefined,
    tipo_documento: (formData.get('tipo_documento') as 'CNPJ' | 'CPF') || undefined,
    endereco: (formData.get('endereco') as string) || undefined,
    cidade: (formData.get('cidade') as string) || undefined,
    estado: (formData.get('estado') as string) || undefined,
    cep: (formData.get('cep') as string) || undefined,
    telefone: (formData.get('telefone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    logo_url: (formData.get('logo_url') as string) || undefined,
  };

  if (!data.nome) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  const { data: empresa, error } = await supabase.from('empresas').insert(data).select().single();

  if (error) {
    console.error('Erro ao criar empresa:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/empresas');
  revalidatePath('/contas'); // Lookup muda

  return { success: true, data: empresa };
}

/**
 * Atualiza uma empresa
 */
export async function atualizarEmpresa(id: string, data: Partial<EmpresaInput>): Promise<ActionResult> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar empresa:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/empresas');
  revalidatePath(`/empresas/${id}`);
  revalidatePath('/contas');

  return { success: true, data: empresa };
}

/**
 * Exclui uma empresa (soft delete)
 */
export async function excluirEmpresa(id: string): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir empresas' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('empresas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir empresa:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/empresas');
  revalidatePath('/contas');

  return { success: true };
}
