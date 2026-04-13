'use client';

import { useState, useCallback } from 'react';
import type { AppWebhook, WebhookLog } from '@/types';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<AppWebhook[]>([]);
  const [webhook, setWebhook] = useState<AppWebhook | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listarWebhooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhooks');
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      setWebhooks(result.data || []);
      return result.data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarWebhook = useCallback(async (webhookData: Partial<AppWebhook>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/webhooks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData),
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

  const atualizarWebhook = useCallback(async (id: string, updates: Partial<AppWebhook>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
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

  const excluirWebhook = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
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
      const params = new URLSearchParams();
      if (filtros.webhook_id) params.set('webhook_id', filtros.webhook_id);
      if (filtros.status) params.set('status', filtros.status);
      if (filtros.data_inicio) params.set('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.set('data_fim', filtros.data_fim);
      params.set('page', String(filtros.page || 1));
      params.set('limit', String(filtros.limit || 25));

      const response = await fetch(`/api/webhooks/logs?${params}`);
      const result = await response.json();
      
      if (result.error) throw new Error(result.error);

      setLogs(result.data || []);
      return result.data;
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
