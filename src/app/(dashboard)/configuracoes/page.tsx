/**
 * Página de Configurações - Server Component
 */
import { createClient } from '@/lib/supabase/server';
import { ConfiguracoesClient } from '@/components/configuracoes';
import { getCurrentUser } from '@/actions/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.perfil?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Buscar webhooks (tabela app_webhooks)
  const { data: webhooks } = await supabase
    .from('app_webhooks')
    .select('*')
    .order('created_at', { ascending: false });

  // Verificar se tem token configurado
  const { data: config } = await supabase
    .from('api_configuracoes')
    .select('api_token')
    .eq('id', 1)
    .single();

  const hasToken = !!config?.api_token;
  const normalizedWebhooks = (webhooks || []).map((webhook) => ({
    ...webhook,
    ativo: !!webhook.ativo,
    descricao: webhook.descricao || undefined,
  }));

  return (
    <ConfiguracoesClient
      initialWebhooks={normalizedWebhooks}
      hasToken={hasToken}
    />
  );
}
