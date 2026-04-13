/**
 * Página de Relatórios - Server Component com Cache-First
 */
import { queryContas, queryFornecedores } from '@/lib/supabase/queries';
import { RelatoriosClient } from '@/components/relatorios';

// Cache de 60 segundos
export const revalidate = 60;

export default async function RelatoriosPage() {
  // Buscar contas pagas e fornecedores em paralelo
  const [contasResult, fornecedoresResult] = await Promise.all([
    queryContas({ status: 'pago' }, 1, 1000),
    queryFornecedores(),
  ]);

  const contas = contasResult.data || [];
  const fornecedores = fornecedoresResult.data || [];

  return (
    <RelatoriosClient
      initialContas={contas}
      fornecedores={fornecedores}
    />
  );
}
