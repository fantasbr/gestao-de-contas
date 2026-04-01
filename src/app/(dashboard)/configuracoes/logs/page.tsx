'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebhooks } from '@/hooks';
import { formatDateTime } from '@/lib/utils';
import { FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LogsPage() {
  const { logs, listarLogs, listarWebhooks, webhooks, isLoading } = useWebhooks();

  const [filtros, setFiltros] = useState({
    webhook_id: '',
    status: '',
    data_inicio: '',
    data_fim: '',
  });

  const [page, setPage] = useState(1);

  useEffect(() => {
    listarWebhooks();
  }, []);

  useEffect(() => {
    listarLogs({
      webhook_id: filtros.webhook_id || undefined,
      status: filtros.status || undefined,
      data_inicio: filtros.data_inicio || undefined,
      data_fim: filtros.data_fim || undefined,
      page,
      limit: 25,
    });
  }, [filtros, page]);

  const statusConfig: Record<string, { label: string; variant: 'success' | 'destructive' | 'warning' | 'secondary'; icon: any }> = {
    sucesso: { label: 'Sucesso', variant: 'success', icon: CheckCircle },
    erro: { label: 'Erro', variant: 'destructive', icon: XCircle },
    pendente: { label: 'Pendente', variant: 'warning', icon: Clock },
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Logs de Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de todas as requisições de webhook
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Select
                value={filtros.webhook_id}
                onValueChange={(value) => setFiltros({ ...filtros, webhook_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Webhook" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {webhooks.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.nome_evento}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtros.status}
                onValueChange={(value) => setFiltros({ ...filtros, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="erro">Erro</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
              />
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum log encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>HTTP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const config = statusConfig[log.status || ''] || statusConfig.pendente;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>{formatDateTime(log.criado_em!)}</TableCell>
                        <TableCell>
                          {(log as any).webhook?.nome_evento || '-'}
                        </TableCell>
                        <TableCell>{log.tipo || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.tempo_resposta_ms ? `${log.tempo_resposta_ms}ms` : '-'}
                        </TableCell>
                        <TableCell>{log.codigo_http || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="px-4 py-2">Página {page}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={logs.length < 25}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
