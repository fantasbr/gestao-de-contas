import { queryContas, queryFornecedores } from '@/lib/supabase/queries';
import { RelatoriosClient } from '@/components/relatorios';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage() {
  const [contasResult, fornecedoresResult] = await Promise.all([
    queryContas({}, 1, 1000),
    queryFornecedores(),
  ]);

  return (
    <RelatoriosClient
      initialContas={contasResult.data || []}
      initialFornecedores={fornecedoresResult.data || []}
    />
  );
}
