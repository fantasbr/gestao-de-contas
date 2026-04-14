import { ContasClient } from '@/components/contas/ContasClient';
import { queryContas, queryLookup } from '@/lib/supabase/queries';

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
      lookup={{
        fornecedores: lookupData.fornecedores,
        empresas: lookupData.empresas,
        categorias: lookupData.categorias,
      }}
      initialPage={1}
      limit={25}
    />
  );
}
