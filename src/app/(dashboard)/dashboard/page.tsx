'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { StatsCard, SkeletonCard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/contas';
import { useContas } from '@/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, AlertTriangle, Clock, CheckCircle, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Estatisticas {
  total: number;
  totalValor: number;
  pendentes: number;
  vencidas: number;
  proximosVencimentos: number;
}

function DashboardSkeleton() {
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
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Skeleton dos cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Skeleton da lista */}
        <Card>
          <CardHeader>
            <SkeletonCard variant="text" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { contas, listarContas, obterEstatisticas } = useContas();
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Carregar dados em paralelo
    const load = async () => {
      setIsLoading(true);
      const [stats] = await Promise.all([
        obterEstatisticas(),
      ]);
      setEstatisticas(stats);
      await listarContas({}, 1, 5);
      setIsLoading(false);
    };
    load();
  }, [obterEstatisticas, listarContas]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

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
          <Button onClick={() => router.push('/contas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title="Total a Pagar"
            value={formatCurrency(estatisticas?.totalValor || 0)}
            subtitle={`${estatisticas?.total || 0} contas`}
            icon={Receipt}
            variant="default"
          />
          <StatsCard
            title="Pendentes"
            value={estatisticas?.pendentes || 0}
            subtitle="Aguardando pagamento"
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Vencidas"
            value={estatisticas?.vencidas || 0}
            subtitle="Precisam de atenção"
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="Próximos 7 dias"
            value={estatisticas?.proximosVencimentos || 0}
            subtitle="Vencem em breve"
            icon={CheckCircle}
            variant="success"
          />
        </div>

        {/* Últimas contas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas Contas</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/contas">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {contas.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
                <Button className="mt-4" onClick={() => router.push('/contas/nova')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeira conta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {contas.map((conta) => (
                  <div
                    key={conta.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/contas/${conta.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium hover:underline truncate block">
                        {conta.descricao}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {conta.fornecedor?.nome || conta.favorecido_nome || 'Sem fornecedor'}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          Vence em {formatDate(conta.data_vencimento)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={conta.status} />
                      <span className="font-semibold whitespace-nowrap">
                        {formatCurrency(Number(conta.valor))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
