'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const contaPagaSchema = z.object({
  beneficiario_nome: z.string().nullable().optional(),
  pagador_nome: z.string().nullable().optional(),
  data_vencimento: z.string().nullable().optional(),
  data_pagamento: z.string().nullable().optional(),
  valor_documento: z.number().nullable().optional(),
  juros_multa: z.number().nullable().optional(),
  desconto_abatimento: z.number().nullable().optional(),
  valor_pago: z.number().nullable().optional(),
  url_pdf: z.string().nullable().optional(),
  tipo: z.enum(['Fixo', 'Variável']).nullable().optional(),
  identificador: z.string().nullable().optional(),
});

export async function atualizarContaPaga(id: number | string, formData: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: perfil } = await supabase
      .from('perfis_usuarios')
      .select('role')
      .eq('id', user.id)
      .limit(1);

    if (perfil?.[0]?.role !== 'admin' && perfil?.[0]?.role !== 'atendente') {
      return { error: 'Sem permissão para atualizar' };
    }

    const validatedData = contaPagaSchema.parse(formData);

    const { error } = await supabase
      .from('contaspagas')
      .update(validatedData)
      .eq('id', Number(id));

    if (error) {
      console.error('Erro no Supabase:', error);
      return { error: error.message };
    }

    revalidatePath('/contas-pagas');
    revalidatePath(`/contas-pagas/${id}`);

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao atualizar:', error);
    return { error: 'Erro ao validar os dados. Verifique os valores.' };
  }
}

export async function excluirContaPaga(id: number | string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: perfil } = await supabase
      .from('perfis_usuarios')
      .select('role')
      .eq('id', user.id)
      .limit(1);

    if (perfil?.[0]?.role !== 'admin' && perfil?.[0]?.role !== 'atendente') {
      return { error: 'Sem permissão para excluir' };
    }

    const { error } = await supabase
      .from('contaspagas')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('Erro no Supabase:', error);
      return { error: error.message };
    }

    revalidatePath('/contas-pagas');
    
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir:', error);
    return { error: 'Erro interno ao tentar excluir.' };
  }
}
