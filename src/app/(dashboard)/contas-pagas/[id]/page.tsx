import { queryContaPaga } from '@/lib/supabase/queries';
import { ContaPagaDetailClient } from '@/components/contas-pagas';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ContaPagaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const numericId = Number(id);
  if (isNaN(numericId)) {
    notFound();
  }

  const { data: conta, error } = await queryContaPaga(id);

  if (error || !conta) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let canEdit = false;
  
  if (user) {
    const { data: perfil } = await supabase
      .from('perfis_usuarios')
      .select('role')
      .eq('id', user.id)
      .limit(1);

    if (perfil?.[0]?.role === 'admin' || perfil?.[0]?.role === 'atendente') {
      canEdit = true;
    }
  }

  return <ContaPagaDetailClient conta={conta} canEdit={canEdit} />;
}
