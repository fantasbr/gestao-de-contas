/**
 * Server Actions para operações com Categorias
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface CategoriaInput {
  nome: string;
  tipo?: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
  permite_quaisquer?: boolean; // Allow any value (free typing)
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
 * Cria uma nova categoria
 */
export async function criarCategoria(formData: FormData): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  // Apenas admin pode criar categorias
  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem criar categorias' };
  }

  const supabase = await createClient();

  const data: CategoriaInput = {
    nome: formData.get('nome') as string,
    tipo: (formData.get('tipo') as 'despesa' | 'receita') || 'despesa',
    cor: (formData.get('cor') as string) || undefined,
    icone: (formData.get('icone') as string) || undefined,
    permite_quaisquer: formData.get('permite_quaisquer') === 'true',
  };

  if (!data.nome) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  const { data: categoria, error } = await supabase.from('categorias').insert(data).select().single();

  if (error) {
    console.error('Erro ao criar categoria:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/categorias');
  revalidatePath('/contas'); // Lookup muda

  return { success: true, data: categoria };
}

/**
 * Atualiza uma categoria
 */
export async function atualizarCategoria(
  id: string,
  data: Partial<CategoriaInput>
): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem editar categorias' };
  }

  const supabase = await createClient();

  const { data: categoria, error } = await supabase
    .from('categorias')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar categoria:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/categorias');
  revalidatePath('/contas');

  return { success: true, data: categoria };
}

/**
 * Exclui uma categoria (soft delete)
 */
export async function excluirCategoria(id: string): Promise<ActionResult> {
  const { user, perfil, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    return { success: false, error: authError || 'Não autenticado' };
  }

  if (perfil?.role !== 'admin') {
    return { success: false, error: 'Apenas administradores podem excluir categorias' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir categoria:', error);
    return { success: false, error: error.message };
  }

  // ✅ Invalida cache
  revalidatePath('/categorias');
  revalidatePath('/contas');

  return { success: true };
}
