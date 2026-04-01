'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AppWebhook, WebhookLog } from '@/types';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<AppWebhook[]>([]);
  const [webhook, setWebhook] = useState<AppWebhook | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const listarWebhooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_webhooks')
        .select('*')
        .order('nome_evento');

      if (error) throw error;

      setWebhooks(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarWebhook = useCallback(async (webhook: Partial<AppWebhook>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_webhooks')
        .insert(webhook)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const atualizarWebhook = useCallback(async (id: string, updates: Partial<AppWebhook>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('app_webhooks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const excluirWebhook = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('app_webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listarLogs = useCallback(async (filtros: {
    webhook_id?: string;
    status?: string;
    data_inicio?: string;
    data_fim?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('webhooks_log')
        .select('*, webhook:app_webhooks(nome_evento)', { count: 'exact' })
        .order('criado_em', { ascending: false });

      if (filtros.webhook_id) {
        query = query.eq('webhook_id', filtros.webhook_id);
      }
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.data_inicio) {
        query = query.gte('criado_em', filtros.data_inicio);
      }
      if (filtros.data_fim) {
        query = query.lte('criado_em', filtros.data_fim);
      }

      const page = filtros.page || 1;
      const limit = filtros.limit || 25;
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    webhooks,
    webhook,
    logs,
    isLoading,
    error,
    listarWebhooks,
    criarWebhook,
    atualizarWebhook,
    excluirWebhook,
    listarLogs,
  };
}
