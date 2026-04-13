/**
 * Página de Contas - Server Component com Cache-First
 * Padrão: Busca dados no servidor, passa para Client Component para interatividade
 */
import { Suspense } from 'react';
import { Header } from '@/components/layout';
import { queryContas, queryLookup, FiltrosContas } from '@/lib/supabase/queries';
import { ContasClient } from '@/components/contas/ContasClient';
import type { StatusConta } from '@/types/database';

// Tempo de cache: 60 segundos
export const revalidate = 60;

// Para gerar os params de searchParams de forma assíncrona
export default async function ContasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Aguardar searchParams
  const params = await searchParams;

  // Parsear parâmetros
  const page = parseInt((params.page as string) || '1');
  const limit = 25;

  const filtros: FiltrosContas = {
    status: (params.status as StatusConta) || undefined,
    conferido:
      params.conferido === 'true' ? true : params.conferido === 'false' ? false : undefined,
    fornecedor_id: (params.fornecedor as string) || undefined,
    categoria_id: (params.categoria as string) || undefined,
    empresa_id: params.empresa ? Number(params.empresa) : undefined,
    data_inicio: (params.data_inicio as string) || undefined,
    data_fim: (params.data_fim as string) || undefined,
    busca: (params.busca as string) || undefined,
  };

  // Carregar dados em paralelo
  const [contasResult, lookupResult] = await Promise.all([
    queryContas(filtros, page, limit),
    queryLookup(),
  ]);

  const contas = contasResult.data || [];
  const total = contasResult.total;
  const lookup = {
    fornecedores: lookupResult.fornecedores,
    empresas: lookupResult.empresas,
    categorias: lookupResult.categorias,
  };

  return (
    <Suspense fallback={<ContasLoading />}>
      <ContasClient
        initialContas={contas}
        initialTotal={total}
        lookup={lookup}
        initialPage={page}
        limit={limit}
      />
    </Suspense>
  );
}

// Loading state
function ContasLoading() {
  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-1">Carregando...</p>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        <div className="h-16 bg-muted animate-pulse rounded mb-6" />

        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    </>
  );
}
