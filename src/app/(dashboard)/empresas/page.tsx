/**
 * Página de Empresas - Server Component com Cache-First
 */
import { queryEmpresas } from '@/lib/supabase/queries';
import { EmpresasClient } from '@/components/empresas';

// Tempo de cache: 5 minutos (dados de lookup)
export const revalidate = 300;

export default async function EmpresasPage() {
  const empresasResult = await queryEmpresas();
  const empresas = empresasResult.data || [];

  return <EmpresasClient initialEmpresas={empresas} />;
}
