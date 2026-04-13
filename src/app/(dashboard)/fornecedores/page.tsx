/**
 * Página de Fornecedores - Server Component com Cache-First
 */
import { queryFornecedores } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { FornecedoresClient } from '@/components/fornecedores';

// Tempo de cache: 5 minutos (dados de lookup)
export const revalidate = 300;

export default async function FornecedoresPage() {
  const [fornecedoresResult, user] = await Promise.all([
    queryFornecedores(),
    getCurrentUser(),
  ]);

  const fornecedores = fornecedoresResult.data || [];

  const podeGerenciar = user?.perfil?.role === 'admin' || user?.perfil?.role === 'atendente';
  const isAdmin = user?.perfil?.role === 'admin';

  return (
    <FornecedoresClient
      initialFornecedores={fornecedores}
      podeGerenciar={podeGerenciar}
      isAdmin={isAdmin}
    />
  );
}
