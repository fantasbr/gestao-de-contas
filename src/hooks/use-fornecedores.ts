'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Fornecedor, Empresa, Categoria } from '@/types';

export function useFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const listarFornecedores = useCallback(async (busca = '', page = 1, limit = 25) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('fornecedores')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (busca) {
        query = query.or(`nome.ilike.%${busca}%,cnpj_cpf.ilike.%${busca}%`);
      }

      query = query
        .order('nome')
        .range((page - 1) * limit, page * limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      setFornecedores(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const obterFornecedor = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setFornecedor(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarFornecedor = useCallback(async (fornecedor: Partial<Fornecedor>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('fornecedores')
        .insert({ ...fornecedor, created_by: user?.id })
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

  const atualizarFornecedor = useCallback(async (id: string, updates: Partial<Fornecedor>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('fornecedores')
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

  const excluirFornecedor = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({ deleted_at: new Date().toISOString() })
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

  return {
    fornecedores,
    fornecedor,
    isLoading,
    error,
    listarFornecedores,
    obterFornecedor,
    criarFornecedor,
    atualizarFornecedor,
    excluirFornecedor,
  };
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const listarEmpresas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('nome');

      if (error) throw error;

      setEmpresas(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { empresas, isLoading, error, listarEmpresas };
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const listarCategorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;

      setCategorias(data || []);
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const criarCategoria = useCallback(async (categoria: Partial<Categoria>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('categorias')
        .insert({ ...categoria, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const atualizarCategoria = useCallback(async (id: string, updates: Partial<Categoria>) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const excluirCategoria = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return { categorias, isLoading, error, listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria };
}
