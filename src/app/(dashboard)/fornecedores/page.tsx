import { queryFornecedores } from '@/lib/supabase/queries';
import { FornecedoresClient } from '@/components/fornecedores';

export const dynamic = 'force-dynamic';

export default async function FornecedoresPage() {
  const { data: fornecedores, error } = await queryFornecedores();

  return <FornecedoresClient initialFornecedores={fornecedores || []} />;
}
