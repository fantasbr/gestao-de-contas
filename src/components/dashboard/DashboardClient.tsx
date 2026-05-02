'use client';

import Link from 'next/link';
import { Header } from '@/components/layout';
import { StatsCard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/contas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, AlertTriangle, Clock, CheckCircle, Plus } from 'lucide-react';

interface Estatisticas {
  total: number;
  totalValor: number;
  pendentes: number;
  vencidas: number;
  proximosVencimentos: number;
  pagoMesAnterior: number;
  totalMesAtual: number;
  pagoMesAtualAteHoje: number;
  pagoMesAnteriorAteHoje: number;
}

interface DashboardClientProps {
  stats: Estatisticas;
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const diferencaComparativa = stats.pagoMesAtualAteHoje - stats.pagoMesAnteriorAteHoje;
  const porcentagemComparativa = stats.pagoMesAnteriorAteHoje > 0 
    ? (diferencaComparativa / stats.pagoMesAnteriorAteHoje) * 100 
    : 0;

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das contas a pagar
            </p>
          </div>
          <Button asChild>
            <Link href="/contas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Link>
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total a Pagar"
            value={formatCurrency(stats.totalValor)}
            subtitle={`${stats.total} contas`}
            icon={Receipt}
            variant="default"
          />
          <StatsCard
            title="Pendentes"
            value={stats.pendentes}
            subtitle="Aguardando pagamento"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Vencidas"
            value={stats.vencidas}
            subtitle="Precisam de atenção"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="Próximos 7 dias"
            value={stats.proximosVencimentos}
            subtitle="Vencem em breve"
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* KPIs de Fluxo e Comparativo */}
        <h2 className="text-xl font-semibold mb-4 mt-8">Performance Mensal</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Pago (Mês Anterior)"
            value={formatCurrency(stats.pagoMesAnterior)}
            subtitle="Total fechado do mês passado"
            icon={CheckCircle}
            variant="default"
          />
          <StatsCard
            title="Geral (Mês Atual)"
            value={formatCurrency(stats.totalMesAtual)}
            subtitle="Total de contas com vencimento este mês"
            icon={Receipt}
            variant="default"
          />
          <StatsCard
            title="Pago (Até Hoje)"
            value={formatCurrency(stats.pagoMesAtualAteHoje)}
            subtitle="Pagamentos realizados este mês"
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Vs Mês Anterior"
            value={formatCurrency(Math.abs(diferencaComparativa))}
            subtitle={`${diferencaComparativa >= 0 ? 'Mais' : 'Menos'} que o mesmo período anterior (${porcentagemComparativa.toFixed(1)}%)`}
            icon={AlertTriangle}
            variant={diferencaComparativa <= 0 ? 'success' : 'warning'}
          />
        </div>
      </div>
    </>
  );
}
