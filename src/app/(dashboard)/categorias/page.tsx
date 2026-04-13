import { queryCategorias } from '@/lib/supabase/queries';
import { CategoriasClient } from '@/components/categorias';

export const dynamic = 'force-dynamic';

export default async function CategoriasPage() {
  const { data: categorias, error } = await queryCategorias();

  return <CategoriasClient initialCategorias={categorias || []} />;
}
