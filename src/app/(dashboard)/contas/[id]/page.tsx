import { queryConta } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { ContaDetailClient } from '@/components/contas/ContaDetailClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ContaDetailPage() {
  // Buscar usuário logado
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Retornar página de loading enquanto buscamos os dados
  return <ContaDetailClient />;
}
