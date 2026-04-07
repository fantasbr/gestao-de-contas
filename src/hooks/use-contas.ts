'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ContaPagar, ContaPagarComRelacionamentos } from '@/types';
import type { StatusConta, StatusProcessamento } from '@/types/database';

interface FiltrosContas {
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

export function useContas() {
  const [contas, setContas] = useState<ContaPagarComRelacionamentos[]>([]);
  const [conta, setConta] = useState<ContaPagarComRelacionamentos | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Usar ref para manter cliente estável
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const listarContas = useCallback(async (
    filtros: FiltrosContas = {},
    page = 1,
    limit = 25
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedor:fornecedores(id, nome),
          categoria:categorias(id, nome),
          empresa:empresas(id_empresa, nome)
        `, { count: 'exact' })
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
      query = query
        .order('data_vencimento', { ascending: true })
        .range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setContas(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const obterConta = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          *,
          fornecedor:fornecedores(*),
          categoria:categorias(*),
          empresa:empresas(*)
        `)
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setConta(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const criarConta = useCallback(async (contaData: Partial<ContaPagar>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contas_pagar')
        .insert({ ...contaData, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      // Registrar log em background (não bloquear)
      supabase.from('contas_log').insert({
        conta_id: data.id,
        acao: 'criado',
        dados_novos: data,
        realizado_por: user?.id,
      }).then(({ error: logError }) => {
        if (logError) console.error('Log auditoria:', logError);
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const atualizarConta = useCallback(async (id: string, updates: Partial<ContaPagar>) => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar dados anteriores
      const { data: anterior } = await supabase
        .from('contas_pagar')
        .select()
        .eq('id', id)
        .single();

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('contas_pagar')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Registrar log em background
      supabase.from('contas_log').insert({
        conta_id: id,
        acao: 'editado',
        dados_anteriores: anterior,
        dados_novos: data,
        realizado_por: user?.id,
      }).then(({ error: logError }) => {
        if (logError) console.error('Log auditoria:', logError);
      });

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const marcarConferido = useCallback(async (id: string, observacao?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    return atualizarConta(id, {
      conferido: true,
      conferido_por: user?.id,
      conferido_em: new Date().toISOString(),
      observacao_conferido: observacao,
    });
  }, [atualizarConta, supabase]);

  const registrarPagamento = useCallback(async (
    id: string,
    data_pagamento: string,
    url_comprovante?: string
  ) => {
    return atualizarConta(id, {
      status: 'pago',
      data_pagamento,
      url_comprovante_pagamento: url_comprovante,
    });
  }, [atualizarConta]);

  const excluirConta = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contas_pagar')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Registrar log em background
      supabase.from('contas_log').insert({
        conta_id: id,
        acao: 'excluido',
        realizado_por: user?.id,
      }).then(({ error: logError }) => {
        if (logError) console.error('Log auditoria:', logError);
      });

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Estatísticas otimizadas com queries paralelas
  const obterEstatisticas = useCallback(async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const seteDias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Executar TODAS as queries em PARALELO
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
        
        // Vencidas (pendente + data < hoje)
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
          
        // Soma dos valores (apenas não pagos)
        supabase
          .from('contas_pagar')
          .select('valor')
          .is('deleted_at', null)
          .neq('status', 'pago'),
      ]);

      // Calcular soma no cliente (Supabase não tem sum nativo em all)
      const totalValor = valorResult.data?.reduce((acc, curr) => acc + Number(curr.valor || 0), 0) || 0;

      return {
        total: totalResult.count || 0,
        totalValor,
        pendentes: pendentesResult.count || 0,
        vencidas: vencidasResult.count || 0,
        proximosVencimentos: proximosResult.count || 0,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        totalValor: 0,
        pendentes: 0,
        vencidas: 0,
        proximosVencimentos: 0,
      };
    }
  }, [supabase]);

  // Carregar dashboard completo (estatísticas + contas) em paralelo
  const carregarDashboard = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const [stats, contasData] = await Promise.all([
        obterEstatisticas(),
        listarContas({}, 1, 5),
      ]);
      
      return { stats, contas: contasData };
    } finally {
      setIsLoading(false);
    }
  }, [obterEstatisticas, listarContas]);

  return {
    contas,
    conta,
    isLoading,
    error,
    total,
    listarContas,
    obterConta,
    criarConta,
    atualizarConta,
    marcarConferido,
    registrarPagamento,
    excluirConta,
    obterEstatisticas,
    carregarDashboard,
  };
}
