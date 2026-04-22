import { Suspense } from 'react';
import { queryContasPagas, queryEstatisticasContasPagas, FiltrosContasPagas } from '@/lib/supabase/queries';
import { ContasPagasClient } from '@/components/contas-pagas';
import Loading from './loading';

export const dynamic = 'force-dynamic';

export default async function ContasPagasPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page, 10) : 1;
  const limit = 25;

  const date = new Date();
  const primeiroDiaDoMes = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];

  const filtros: FiltrosContasPagas = {
    busca: typeof resolvedSearchParams.busca === 'string' ? resolvedSearchParams.busca : undefined,
    tipo: typeof resolvedSearchParams.tipo === 'string' ? resolvedSearchParams.tipo : undefined,
    data_pagamento_inicio: typeof resolvedSearchParams.data_pagamento_inicio === 'string' ? resolvedSearchParams.data_pagamento_inicio : primeiroDiaDoMes,
    data_pagamento_fim: typeof resolvedSearchParams.data_pagamento_fim === 'string' ? resolvedSearchParams.data_pagamento_fim : undefined,
    data_vencimento_inicio: typeof resolvedSearchParams.data_vencimento_inicio === 'string' ? resolvedSearchParams.data_vencimento_inicio : undefined,
    data_vencimento_fim: typeof resolvedSearchParams.data_vencimento_fim === 'string' ? resolvedSearchParams.data_vencimento_fim : undefined,
  };

  const [contasResult, estatisticasResult] = await Promise.all([
    queryContasPagas(filtros, page, limit),
    queryEstatisticasContasPagas(filtros),
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <ContasPagasClient
        initialContas={contasResult.data || []}
        initialTotal={contasResult.total || 0}
        estatisticas={estatisticasResult.data || { totalRegistros: 0, totalValorPago: 0, totalJurosMulta: 0 }}
        initialPage={page}
        limit={limit}
      />
    </Suspense>
  );
}
