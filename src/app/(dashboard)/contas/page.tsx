import { queryContas, queryLookup } from '@/lib/supabase/queries';
import { ContasClient } from '@/components/contas/ContasClient';
import type { StatusConta } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function ContasPage() {
  const [contasResult, lookupData] = await Promise.all([
    queryContas({}, 1, 25),
    queryLookup(),
  ]);

  return (
    <ContasClient
      initialContas={contasResult.data || []}
      initialTotal={contasResult.total || 0}
      initialFornecedores={lookupData.fornecedores}
      initialEmpresas={lookupData.empresas}
      initialCategorias={lookupData.categorias}
    />
  );
}
