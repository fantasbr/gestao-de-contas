/**
 * Página de Configurações - Server Component
 */
import { createClient } from '@/lib/supabase/server';
import { ConfiguracoesClient } from '@/components/configuracoes';

export const dynamic = 'force-dynamic';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  // Buscar webhooks (tabela app_webhooks)
  const { data: webhooks } = await supabase
    .from('app_webhooks')
    .select('*')
    .order('created_at', { ascending: false });

  // Verificar se tem token configurado
  const { data: config } = await supabase
    .from('configuracoes')
    .select('api_token')
    .eq('chave', 'n8n_token')
    .single();

  const hasToken = !!config?.api_token;

  return <ConfiguracoesClient initialWebhooks={webhooks || []} hasToken={hasToken} />;
}
