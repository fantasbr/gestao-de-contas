import { queryEmpresas } from '@/lib/supabase/queries';
import { EmpresasClient } from '@/components/empresas';

export const dynamic = 'force-dynamic';

export default async function EmpresasPage() {
  const { data: empresas, error } = await queryEmpresas();

  return <EmpresasClient initialEmpresas={empresas || []} />;
}
