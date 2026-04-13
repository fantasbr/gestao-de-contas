/**
 * Dashboard - Server Component com Cache-First
 * Busca dados no servidor, passa para Client Component para renderização
 */
import { queryEstatisticas, queryContas } from '@/lib/supabase/queries';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

// Tempo de cache: 30 segundos
export const revalidate = 30;

export default async function DashboardPage() {
  // Carregar dados em paralelo
  const [statsResult, contasResult] = await Promise.all([
    queryEstatisticas(),
    queryContas({}, 1, 5),
  ]);

  const stats = statsResult.data || {
    total: 0,
    totalValor: 0,
    pendentes: 0,
    vencidas: 0,
    proximosVencimentos: 0,
  };

  const contas = contasResult.data || [];

  return <DashboardClient stats={stats} contas={contas} />;
}
