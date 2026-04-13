/**
 * Página de Nova Conta - Server Component com Cache-First
 */
import { queryLookup } from '@/lib/supabase/queries';
import { NovaContaClient } from '@/components/contas/NovaContaClient';

// Tempo de cache: 5 minutos (dados de lookup)
export const revalidate = 300;

export default async function NovaContaPage() {
  const lookupResult = await queryLookup();

  const lookup = {
    fornecedores: lookupResult.fornecedores,
    empresas: lookupResult.empresas,
    categorias: lookupResult.categorias,
  };

  return <NovaContaClient lookup={lookup} />;
}
