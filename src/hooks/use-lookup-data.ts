'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Fornecedor, Empresa, Categoria } from '@/types';

// Cache global para dados de lookup
let lookupCache: {
  fornecedores: Fornecedor[] | null;
  empresas: Empresa[] | null;
  categorias: Categoria[] | null;
  timestamp: number;
} = {
  fornecedores: null,
  empresas: null,
  categorias: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useLookupData() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const loadAll = useCallback(async () => {
    // Verificar se há cache válido
    const now = Date.now();
    if (
      lookupCache.fornecedores && 
      lookupCache.empresas && 
      lookupCache.categorias &&
      now - lookupCache.timestamp < CACHE_DURATION
    ) {
      setFornecedores(lookupCache.fornecedores);
      setEmpresas(lookupCache.empresas);
      setCategorias(lookupCache.categorias);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // Carregar tudo em PARALELO
      const [fornsResult, empsResult, catsResult] = await Promise.all([
        supabase.from('fornecedores').select('*').is('deleted_at', null).order('nome'),
        supabase.from('empresas').select('*').order('nome'),
        supabase.from('categorias').select('*').order('nome'),
      ]);

      const forns = fornsResult.data || [];
      const emps = empsResult.data || [];
      const cats = catsResult.data || [];

      // Atualizar cache
      lookupCache = {
        fornecedores: forns,
        empresas: emps,
        categorias: cats,
        timestamp: now,
      };

      setFornecedores(forns);
      setEmpresas(emps);
      setCategorias(cats);
    } catch (error) {
      console.error('Erro ao carregar dados de lookup:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Função para invalidar cache quando necessário
  const invalidateCache = useCallback(() => {
    lookupCache.timestamp = 0;
  }, []);

  return {
    fornecedores,
    empresas,
    categorias,
    isLoading,
    invalidateCache,
  };
}
