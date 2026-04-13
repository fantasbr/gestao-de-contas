/**
 * Página de Categorias - Server Component com Cache-First
 */
import { queryCategorias } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { CategoriasClient } from '@/components/categorias';

// Tempo de cache: 5 minutos (dados de lookup)
export const revalidate = 300;

export default async function CategoriasPage() {
  const [categoriasResult, user] = await Promise.all([
    queryCategorias(),
    getCurrentUser(),
  ]);

  const categorias = categoriasResult.data || [];
  const isAdmin = user?.perfil?.role === 'admin';

  return <CategoriasClient initialCategorias={categorias} isAdmin={isAdmin} />;
}
