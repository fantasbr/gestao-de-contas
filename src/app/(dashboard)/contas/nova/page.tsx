import { queryLookup } from '@/lib/supabase/queries';
import { NovaContaClient } from '@/components/contas/NovaContaClient';

export const dynamic = 'force-dynamic';

export default async function NovaContaPage() {
  const { fornecedores, empresas, categorias } = await queryLookup();

  return (
    <NovaContaClient
      initialFornecedores={fornecedores}
      initialEmpresas={empresas}
      initialCategorias={categorias}
    />
  );
}
