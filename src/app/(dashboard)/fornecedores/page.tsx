import { getCurrentUser } from '@/actions/auth';
import { FornecedoresClient } from '@/components/fornecedores';
import { queryFornecedores } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function FornecedoresPage() {
  const [{ data: fornecedores }, user] = await Promise.all([queryFornecedores(), getCurrentUser()]);
  const role = user?.perfil?.role;

  return (
    <FornecedoresClient
      initialFornecedores={fornecedores || []}
      podeGerenciar={role === 'admin' || role === 'atendente'}
      isAdmin={role === 'admin'}
    />
  );
}
