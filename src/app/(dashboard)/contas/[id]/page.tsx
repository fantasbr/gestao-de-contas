import { queryConta, queryLookup } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { ContaDetailClient } from '@/components/contas/ContaDetailClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ContaDetailPage({ params, searchParams }: PageProps) {
  // Buscar usuário logado
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Obter o id aguardando os params para compatibilidade com Next.js 15+ se existir, mas também seguro no Next 14
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  // Aguardar searchParams (Next.js 16+)
  const paramsURL = await searchParams;

  const { data: conta } = await queryConta(id);
  const lookup = await queryLookup();

  // Debug: Verificando o papel do usuário no servidor
  console.log(`[DEBUG] Acessando Detalhes da Conta - Usuário: ${user.email}, Role: ${user.role}`);

  const role = (user.role || user.perfil?.role || '').toLowerCase();
  const podeEditar = ['admin', 'atendente'].includes(role);
  const podeExcluir = role === 'admin';

  // Extrair filtros da URL para preservar ao voltar
  const filtros = {
    status: paramsURL.status as string || '',
    conferido: paramsURL.conferido as string || '',
    fornecedor_id: paramsURL.fornecedor_id as string || '',
    categoria_id: paramsURL.categoria_id as string || '',
    empresa_id: paramsURL.empresa_id as string || '',
    data_inicio: paramsURL.data_inicio as string || '',
    data_fim: paramsURL.data_fim as string || '',
    busca: paramsURL.busca as string || '',
    page: paramsURL.page as string || '1',
  };

  return (
    <ContaDetailClient 
      conta={conta}
      podeEditar={podeEditar}
      podeExcluir={podeExcluir}
      lookup={lookup}
      filtros={filtros}
    />
  );
}
