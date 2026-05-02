import { Suspense } from 'react';
import { ContasClient } from '@/components/contas/ContasClient';
import { queryContas, queryLookup, FiltrosContas, queryTotalValorContas } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { redirect } from 'next/navigation';

export default async function ContasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // Se não houver parâmetros, redirecionar para os padrões: status=pendente e data_inicio=01 do mês anterior
  if (Object.keys(params).length === 0) {
    const now = new Date();
    const dataPadrao = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    redirect(`/contas?status=pendente&data_inicio=${dataPadrao}`);
  }
  
  // Extrair filtros da URL - converter para o tipo esperado
  const filtros: FiltrosContas = {
    status: params.status as FiltrosContas['status'],
    conferido: params.conferido ? params.conferido === 'true' : undefined,
    fornecedor_id: params.fornecedor_id as string || undefined,
    categoria_id: params.categoria_id as string || undefined,
    empresa_id: params.empresa_id ? parseInt(params.empresa_id as string) : undefined,
    data_inicio: params.data_inicio as string || undefined,
    data_fim: params.data_fim as string || undefined,
    busca: params.busca as string || undefined,
  };
  
  // Paginação
  const page = params.page ? parseInt(params.page as string) : 1;

  const [contasResult, totalValor, lookupData] = await Promise.all([
    queryContas(filtros, page, 25),
    queryTotalValorContas(filtros),
    queryLookup(),
  ]);

  // Preparar filtros para o cliente (com string vazia para campos não preenchidos)
  const filtrosCliente = {
    status: params.status as string || '',
    conferido: params.conferido as string || '',
    fornecedor_id: params.fornecedor_id as string || '',
    categoria_id: params.categoria_id as string || '',
    empresa_id: params.empresa_id as string || '',
    data_inicio: params.data_inicio as string || '',
    data_fim: params.data_fim as string || '',
    busca: params.busca as string || '',
  };

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ContasClient
        initialContas={contasResult.data || []}
        initialTotal={contasResult.total || 0}
        initialTotalValor={totalValor}
        lookup={{
          fornecedores: lookupData.fornecedores,
          empresas: lookupData.empresas,
          categorias: lookupData.categorias,
        }}
        initialPage={page}
        limit={25}
      />
    </Suspense>
  );
}
