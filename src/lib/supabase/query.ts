/**
 * Configuração centralizada de cache para Next.js + Supabase
 * Padrão: Cache-First com Invalidation Manual
 */

// Tags para categorização de cache (usadas com unstable_cache)
export const CACHE_TAGS = {
  CONTAS: 'contas',
  CONTA: 'conta',
  FORNECEDORES: 'fornecedores',
  FORNECEDOR: 'fornecedor',
  EMPRESAS: 'empresas',
  EMPRESA: 'empresa',
  CATEGORIAS: 'categorias',
  CATEGORIA: 'categoria',
  DASHBOARD: 'dashboard',
  LOGS: 'logs',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

// Tempo de revalidação em segundos
export const CACHE_REVALIDATE = {
  CONTAS: 60,        // 60 segundos para lista de contas
  CONTA: 60,         // 60 segundos para detalhe
  LOOKUP: 300,       // 5 minutos para dados de lookup (fornecedores, empresas, categorias)
  DASHBOARD: 30,    // 30 segundos para estatísticas do dashboard
  LOGS: 60,         // 1 minuto para logs
} as const;

// Tempo máximo de espera pela query (ms)
export const QUERY_TIMEOUT = 10000; // 10 segundos
