'use client';

import { useState, useCallback } from 'react';
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

  const listarContas = useCallback(async (
    filtros: FiltrosContas = {},
    page = 1,
    limit = 25
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filtros.status) params.set('status', filtros.status);
      if (filtros.status_processamento) params.set('status_processamento', filtros.status_processamento);
      if (filtros.conferido !== undefined) params.set('conferido', String(filtros.conferido));
      if (filtros.fornecedor_id) params.set('fornecedor_id', filtros.fornecedor_id);
      if (filtros.categoria_id) params.set('categoria_id', filtros.categoria_id);
      if (filtros.empresa_id) params.set('empresa_id', String(filtros.empresa_id));
      if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.set('data_fim', filtros.data_fim);
      if (filtros.busca) params.set('busca', filtros.busca);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const response = await fetch(`/api/contas?${params}`);
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      setContas(result.data || []);
      setTotal(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const obterConta = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contas/${id}`);
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      setConta(result.data);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarConta = useCallback(async (contaData: Partial<ContaPagar>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contaData),
      });
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const atualizarConta = useCallback(async (id: string, updates: Partial<ContaPagar>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/contas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      return result.data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const marcarConferido = useCallback(async (id: string, observacao?: string) => {
    return atualizarConta(id, {
      conferido: true,
      conferido_em: new Date().toISOString(),
      observacao_conferido: observacao,
    });
  }, [atualizarConta]);

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
      const response = await fetch(`/api/contas/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const obterEstatisticas = useCallback(async () => {
    try {
      const response = await fetch('/api/estatisticas');
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      return result.data;
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
  }, []);

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
