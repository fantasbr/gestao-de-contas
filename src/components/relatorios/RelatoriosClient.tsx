'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, FileText, TrendingUp } from 'lucide-react';
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

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  fornecedor?: { id: string; nome: string };
  favorecido_nome?: string;
}

interface RelatoriosClientProps {
  initialContas: Conta[];
  fornecedores: { id: string; nome: string }[];
}

export function RelatoriosClient({ initialContas, fornecedores }: RelatoriosClientProps) {
  const [contas] = useState(initialContas);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');

  // Filtrar contas por data e fornecedor (client-side para interatividade)
  const contasFiltradas = useMemo(() => {
    return initialContas.filter((conta) => {
      // Filtrar por fornecedor
      if (fornecedorId && fornecedorId !== 'todos' && conta.fornecedor?.id !== fornecedorId) {
        return false;
      }
      return true;
    });
  }, [initialContas, fornecedorId]);

  // Calcular totais
  const totalGeral = useMemo(() => {
    return contasFiltradas.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [contasFiltradas]);

  const gastosPorFornecedor = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; count: number }>();
    contasFiltradas.forEach((conta) => {
      const nome = conta.fornecedor?.nome || conta.favorecido_nome || 'Outros';
      const existente = map.get(nome) || { nome, total: 0, count: 0 };
      existente.total += Number(conta.valor);
      existente.count += 1;
      map.set(nome, existente);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [contasFiltradas]);

  const exportCSV = () => {
    const headers = ['Descrição', 'Fornecedor', 'Vencimento', 'Pagamento', 'Valor', 'Status'];
    const rows = contasFiltradas.map((c) => [
      c.descricao,
      c.fornecedor?.nome || c.favorecido_nome || '',
      c.data_vencimento,
      c.data_pagamento || '',
      c.valor,
      'pago',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-contas-${dataInicio || 'inicio'}-${dataFim || 'fim'}.csv`;
    a.click();
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground mt-1">Visualize e exporte dados das contas</p>
          </div>
          <Button variant="outline" onClick={exportCSV} disabled={contasFiltradas.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {fornecedores.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setDataInicio('');
                    setDataFim('');
                    setFornecedorId('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="font-medium">Total de Contas</span>
                <span className="text-2xl font-bold">{contasFiltradas.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="font-medium">Valor Total</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(totalGeral)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Gastos por Fornecedor */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent>
              {gastosPorFornecedor.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-3">
                  {gastosPorFornecedor.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.nome}</p>
                        <p className="text-sm text-muted-foreground">{item.count} conta(s)</p>
                      </div>
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {contasFiltradas.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma conta encontrada no período</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasFiltradas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell>{conta.fornecedor?.nome || conta.favorecido_nome || '-'}</TableCell>
                      <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                      <TableCell>{conta.data_pagamento ? formatDate(conta.data_pagamento) : '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(conta.valor))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
