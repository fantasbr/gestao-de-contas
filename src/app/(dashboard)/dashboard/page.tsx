/**
 * Dashboard - Server Component com Cache-First
 * Busca dados no servidor, passa para Client Component para renderização
 */
export const dynamic = 'force-dynamic';

import { queryEstatisticas, queryContas } from '@/lib/supabase/queries';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  // Carregar estatísticas
  const statsResult = await queryEstatisticas();
  const stats = statsResult.data || {
    total: 0,
    totalValor: 0,
    pendentes: 0,
    vencidas: 0,
    proximosVencimentos: 0,
    pagoMesAnterior: 0,
    totalMesAtual: 0,
    pagoMesAtualAteHoje: 0,
    pagoMesAnteriorAteHoje: 0,
  };

  return <DashboardClient stats={stats} />;
}
