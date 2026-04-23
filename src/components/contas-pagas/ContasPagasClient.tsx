'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileText, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Header } from '@/components/layout';

import type { ContaPaga } from '@/types/database';

interface Filtros {
  tipo: string;
  data_pagamento_inicio: string;
  data_pagamento_fim: string;
  data_vencimento_inicio: string;
  data_vencimento_fim: string;
  busca: string;
}

interface ContasPagasClientProps {
  initialContas: ContaPaga[];
  initialTotal: number;
  estatisticas: {
    totalRegistros: number;
    totalValorPago: number;
    totalJurosMulta: number;
  };
  initialPage: number;
  limit: number;
}

export function ContasPagasClient({
  initialContas,
  initialTotal,
  estatisticas,
  initialPage,
  limit,
}: ContasPagasClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [contas] = useState<ContaPaga[]>(initialContas);
  const [total] = useState(initialTotal);
  const [page] = useState(initialPage);

  const date = new Date();
  const primeiroDiaDoMes = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];

  const [filtros, setFiltros] = useState<Filtros>({
    tipo: searchParams.get('tipo') || '',
    data_pagamento_inicio: searchParams.get('data_pagamento_inicio') || primeiroDiaDoMes,
    data_pagamento_fim: searchParams.get('data_pagamento_fim') || '',
    data_vencimento_inicio: searchParams.get('data_vencimento_inicio') || '',
    data_vencimento_fim: searchParams.get('data_vencimento_fim') || '',
    busca: searchParams.get('busca') || '',
  });

  const [buscaInput, setBuscaInput] = useState(filtros.busca);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Atualizar URL com novos filtros
  const updateFilters = useCallback(
    (newFiltros: Partial<Filtros>) => {
      const updated = { ...filtros, ...newFiltros };
      setFiltros(updated);

      const params = new URLSearchParams();
      Object.entries(updated).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [filtros, pathname, router]
  );

  // Debounce para busca
  const handleBuscaChange = (value: string) => {
    setBuscaInput(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      updateFilters({ busca: value });
    }, 400);
  };

  const limparFiltros = () => {
    setFiltros({
      tipo: '',
      data_pagamento_inicio: primeiroDiaDoMes,
      data_pagamento_fim: '',
      data_vencimento_inicio: '',
      data_vencimento_fim: '',
      busca: '',
    });
    setBuscaInput('');
    router.push(pathname);
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contas Pagas</h1>
            <p className="text-muted-foreground mt-1">
              Registro de todas as contas pagas processadas pelo n8n
            </p>
          </div>
        </div>

        {/* Estatisticas */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Total de Registros</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{estatisticas.totalRegistros}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Valor Total Pago</p>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(estatisticas.totalValorPago)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium">Juros / Multas Totais</p>
              </div>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(estatisticas.totalJurosMulta)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar beneficiário/pagador"
                  value={buscaInput}
                  onChange={(e) => handleBuscaChange(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={filtros.tipo}
                onValueChange={(value) => updateFilters({ tipo: value === 'todos' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Despesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Variável">Variável</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 items-center">
                <span className="text-sm whitespace-nowrap">Pgto:</span>
                <Input
                  type="date"
                  value={filtros.data_pagamento_inicio}
                  onChange={(e) => updateFilters({ data_pagamento_inicio: e.target.value })}
                  className="w-auto"
                />
                <span className="text-sm">até</span>
                <Input
                  type="date"
                  value={filtros.data_pagamento_fim}
                  onChange={(e) => updateFilters({ data_pagamento_fim: e.target.value })}
                  className="w-auto"
                />
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-sm whitespace-nowrap">Venc:</span>
                <Input
                  type="date"
                  value={filtros.data_vencimento_inicio}
                  onChange={(e) => updateFilters({ data_vencimento_inicio: e.target.value })}
                  className="w-auto"
                />
                <span className="text-sm">até</span>
                <Input
                  type="date"
                  value={filtros.data_vencimento_fim}
                  onChange={(e) => updateFilters({ data_vencimento_fim: e.target.value })}
                  className="w-auto"
                />
              </div>

              <Button variant="outline" onClick={limparFiltros} className="md:col-start-4">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isPending ? (
              <div className="p-8 text-center">Atualizando...</div>
            ) : contas.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma conta paga encontrada com estes filtros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beneficiário</TableHead>
                      <TableHead>Pagador</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Valor Doc.</TableHead>
                      <TableHead className="text-right">Juros/Multa</TableHead>
                      <TableHead className="text-right">Valor Pago</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Comprovante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contas.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell>
                          <Link
                            href={`/contas-pagas/${conta.id}`}
                            className="font-medium hover:underline flex items-center gap-2"
                          >
                            {conta.beneficiario_nome || 'N/A'}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{conta.pagador_nome || 'N/A'}</TableCell>
                        <TableCell>{conta.data_vencimento ? formatDate(conta.data_vencimento) : '-'}</TableCell>
                        <TableCell className="font-semibold">{conta.data_pagamento ? formatDate(conta.data_pagamento) : '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {conta.valor_documento ? formatCurrency(conta.valor_documento) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {conta.juros_multa && conta.juros_multa > 0 ? (
                            <span className="text-destructive font-medium">{formatCurrency(conta.juros_multa)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          {conta.valor_pago ? formatCurrency(conta.valor_pago) : '-'}
                        </TableCell>
                        <TableCell>
                          {conta.tipo && (
                            <Badge variant={conta.tipo === 'Fixo' ? 'default' : 'secondary'}>
                              {conta.tipo}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {conta.url_pdf ? (
                            <a
                              href={conta.url_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm font-medium text-primary hover:underline group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-4 h-4 mr-1 group-hover:-translate-y-1 transition-transform" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">S/ Anexo</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(page - 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * limit >= total}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(page + 1));
                  router.push(`${pathname}?${params.toString()}`);
                }}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
