import { queryFornecedor, queryContas } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { FornecedorDetailClient } from '@/components/fornecedores/FornecedorDetailClient';
import { redirect, notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function FornecedorDetailPage({ params }: { params: { id: string } }) {
  // Buscar usuário logado
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Obter o id aguardando os params para compatibilidade
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Buscar dados do fornecedor
  const { data: fornecedor, error: fornError } = await queryFornecedor(id);
  
  if (fornError || !fornecedor) {
    console.error('Erro ao buscar fornecedor:', fornError);
    notFound();
  }

  // Buscar todas as contas do fornecedor (sem limite inicial alto para garantir lista completa)
  const { data: contas } = await queryContas({ fornecedor_id: id }, 1, 1000);

  return (
    <FornecedorDetailClient 
      fornecedor={fornecedor}
      contas={contas}
    />
  );
}
