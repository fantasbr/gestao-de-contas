/**
 * Helpers de queries para Server Components
 * Usam Supabase Server Client com configuração de cache
 */

import { createClient } from '@/lib/supabase/server';
import type { StatusConta, StatusProcessamento } from '@/types/database';

// ============================================
// TIPOS
// ============================================

export interface FiltrosContas {
  status?: StatusConta;
  status_processamento?: StatusProcessamento;
  conferido?: boolean;
  fornecedor_id?: string;
  categoria_id?: string;
  empresa_id?: number;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}

export interface Estatisticas {
  total: number;
  totalValor: number;
  pendentes: number;
  vencidas: number;
  proximosVencimentos: number;
}

export interface QueryResult<T> {
  data: T | null;
  error: string | null;
}

export interface QueryListResult<T> {
  data: T[];
  total: number;
  error: string | null;
}

// ============================================
// QUERIES - CONTAS
// ============================================

/**
 * Lista contas com filtros e paginação
 */
export async function queryContas(
  filtros: FiltrosContas = {},
  page = 1,
  limit = 25
): Promise<QueryListResult<any>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('contas_pagar')
      .select(
        `
        *,
        fornecedor:fornecedores(id, nome),
        categoria:categorias(id, nome),
        empresa:empresas(id_empresa, nome)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null);

    // Aplicar filtros
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }
    if (filtros.status_processamento) {
      query = query.eq('status_processamento', filtros.status_processamento);
    }
    if (filtros.conferido !== undefined) {
      query = query.eq('conferido', filtros.conferido);
    }
    if (filtros.fornecedor_id) {
      query = query.eq('fornecedor_id', filtros.fornecedor_id);
    }
    if (filtros.categoria_id) {
      query = query.eq('categoria_id', filtros.categoria_id);
    }
    if (filtros.empresa_id) {
      query = query.eq('empresa_pagadora_id', filtros.empresa_id);
    }
    if (filtros.data_inicio) {
      query = query.gte('data_vencimento', filtros.data_inicio);
    }
    if (filtros.data_fim) {
      query = query.lte('data_vencimento', filtros.data_fim);
    }
    if (filtros.busca) {
      query = query.or(`descricao.ilike.%${filtros.busca}%,favorecido_nome.ilike.%${filtros.busca}%`);
    }

    // Ordenação e paginação
    query = query.order('data_vencimento', { ascending: true }).range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar contas:', error);
      return { data: [], total: 0, error: error.message };
    }

    return {
      data: data || [],
      total: count || 0,
      error: null,
    };
  } catch (err: any) {
    console.error('Erro ao buscar contas:', err);
    return { data: [], total: 0, error: err.message };
  }
}

/**
 * Busca conta por ID
 */
export async function queryConta(id: string): Promise<QueryResult<any>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('contas_pagar')
      .select(
        `
        *,
        fornecedor:fornecedores(*),
        categoria:categorias(*),
        empresa:empresas(*)
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Erro ao buscar conta:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Erro ao buscar conta:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Estatísticas do dashboard
 */
export async function queryEstatisticas(): Promise<QueryResult<Estatisticas>> {
  try {
    const supabase = await createClient();
    const hoje = new Date().toISOString().split('T')[0];
    const seteDias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Queries em paralelo
    const [totalResult, pendentesResult, vencidasResult, proximosResult, valorResult] = await Promise.all([
      // Total de contas não pagas
      supabase
        .from('contas_pagar')
        .select('valor', { count: 'exact', head: true })
        .is('deleted_at', null)
        .neq('status', 'pago'),

      // Pendentes
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente'),

      // Vencidas
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .lt('data_vencimento', hoje),

      // Próximos 7 dias
      supabase
        .from('contas_pagar')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null)
        .eq('status', 'pendente')
        .gte('data_vencimento', hoje)
        .lte('data_vencimento', seteDias),

      // Soma dos valores
      supabase.from('contas_pagar').select('valor').is('deleted_at', null).neq('status', 'pago'),
    ]);

    // Calcular soma no cliente
    const totalValor =
      valorResult.data?.reduce((acc: number, curr: { valor: number | null }) => acc + Number(curr.valor || 0), 0) ||
      0;

    return {
      data: {
        total: totalResult.count || 0,
        totalValor,
        pendentes: pendentesResult.count || 0,
        vencidas: vencidasResult.count || 0,
        proximosVencimentos: proximosResult.count || 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Erro ao buscar estatísticas:', err);
    return { data: null, error: err.message };
  }
}

// ============================================
// QUERIES - LOOKUP (Fornecedores, Empresas, Categorias)
// ============================================

/**
 * Lista fornecedores
 */
export async function queryFornecedores(): Promise<QueryResult<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .is('deleted_at', null)
      .order('nome');

    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Erro ao buscar fornecedores:', err);
    return { data: [], error: err.message };
  }
}

/**
 * Busca fornecedor por ID
 */
export async function queryFornecedor(id: string): Promise<QueryResult<any>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Erro ao buscar fornecedor:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Erro ao buscar fornecedor:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Lista empresas
 */
export async function queryEmpresas(): Promise<QueryResult<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.from('empresas').select('*').order('nome');

    if (error) {
      console.error('Erro ao buscar empresas:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Erro ao buscar empresas:', err);
    return { data: [], error: err.message };
  }
}

/**
 * Lista categorias
 */
export async function queryCategorias(): Promise<QueryResult<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.from('categorias').select('*').order('nome');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Erro ao buscar categorias:', err);
    return { data: [], error: err.message };
  }
}

/**
 * Busca todos os dados de lookup de uma vez
 */
export async function queryLookup(): Promise<{
  fornecedores: any[];
  empresas: any[];
  categorias: any[];
  error: string | null;
}> {
  const [fornsResult, empsResult, catsResult] = await Promise.all([
    queryFornecedores(),
    queryEmpresas(),
    queryCategorias(),
  ]);

  const hasError = fornsResult.error || empsResult.error || catsResult.error;

  return {
    fornecedores: fornsResult.data || [],
    empresas: empsResult.data || [],
    categorias: catsResult.data || [],
    error: hasError ? 'Erro ao carregar dados de lookup' : null,
  };
}

// ============================================
// QUERIES - LOGS
// ============================================

/**
 * Lista logs de uma conta
 */
export async function queryLogsConta(contaId: string): Promise<QueryResult<any[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('contas_log')
      .select('*, perfil:perfis_usuarios(nome)')
      .eq('conta_id', contaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar logs:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Erro ao buscar logs:', err);
    return { data: [], error: err.message };
  }
}
