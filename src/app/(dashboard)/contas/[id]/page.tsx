import { queryConta, queryLookup } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { ContaDetailClient } from '@/components/contas/ContaDetailClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ContaDetailPage({ params }: { params: { id: string } }) {
  // Buscar usuário logado
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Obter o id aguardando os params para compatibilidade com Next.js 15+ se existir, mas também seguro no Next 14
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  const { data: conta } = await queryConta(id);
  const lookup = await queryLookup();

  // Debug: Verificando o papel do usuário no servidor
  console.log(`[DEBUG] Acessando Detalhes da Conta - Usuário: ${user.email}, Role: ${user.role}`);

  const role = (user.role || user.perfil?.role || '').toLowerCase();
  const podeEditar = ['admin', 'atendente'].includes(role);
  const podeExcluir = role === 'admin';

  return (
    <ContaDetailClient 
      conta={conta}
      podeEditar={podeEditar}
      podeExcluir={podeExcluir}
      lookup={lookup}
    />
  );
}
