import { getCurrentUser } from '@/actions/auth';
import { CategoriasClient } from '@/components/categorias';
import { queryCategorias } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const [{ data: categorias }, user] = await Promise.all([queryCategorias(), getCurrentUser()]);

  return (
    <CategoriasClient
      initialCategorias={categorias || []}
      isAdmin={user?.perfil?.role === 'admin'}
    />
  );
}
