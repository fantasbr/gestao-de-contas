/**
 * Página de Detalhes da Conta - Server Component com Cache-First
 */
import { notFound } from 'next/navigation';
import { queryConta } from '@/lib/supabase/queries';
import { getCurrentUser } from '@/actions/auth';
import { ContaDetailClient } from '@/components/contas/ContaDetailClient';

// Cache de 60 segundos
export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheContaPage({ params }: PageProps) {
  const { id } = await params;

  // Buscar dados em paralelo
  const [contaResult, user] = await Promise.all([queryConta(id), getCurrentUser()]);

  if (contaResult.error || !contaResult.data) {
    notFound();
  }

  const conta = contaResult.data;

  // Verificar permissões
  const podeEditar = user?.perfil?.role === 'admin' || user?.perfil?.role === 'atendente';
  const podeExcluir = user?.perfil?.role === 'admin';

  // Buscar nome de quem conferiu
  let conferidoPorNome: string | null = null;
  if (conta.conferido_por) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: perfil } = await supabase
      .from('perfis_usuarios')
      .select('nome')
      .eq('id', conta.conferido_por)
      .single();
    conferidoPorNome = perfil?.nome || null;
  }

  return (
    <ContaDetailClient
      conta={conta}
      podeEditar={podeEditar}
      podeExcluir={podeExcluir}
      conferidoPorNome={conferidoPorNome}
    />
  );
}
