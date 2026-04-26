import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConciliacaoClient } from '@/components/conciliacao';
import { queryContasPagarPendentes, queryContasPagasNaoConciliadas } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Conciliação Financeira',
  description: 'Vincule comprovantes de pagamento às contas a pagar pendentes.',
};

export default async function ConciliacaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .limit(1);

  if (perfil?.[0]?.role !== 'admin' && perfil?.[0]?.role !== 'atendente') {
    redirect('/dashboard');
  }

  const [pendentesResult, pagasResult] = await Promise.all([
    queryContasPagarPendentes(),
    queryContasPagasNaoConciliadas(),
  ]);

  return (
    <ConciliacaoClient
      contasPagar={pendentesResult.data}
      contasPagas={pagasResult.data}
    />
  );
}
