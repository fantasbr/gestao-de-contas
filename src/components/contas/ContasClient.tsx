'use client';

import { useState, useCallback, useTransition, useEffect, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/contas';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, FileText, CheckCircle } from 'lucide-react';
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

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  status_processamento: string;
  conferido: boolean;
  fornecedor?: { id: string; nome: string };
  favorecido_nome?: string;
  categoria?: { id: string; nome: string };
}

interface LookupData {
  fornecedores: { id: string; nome: string }[];
  empresas: { id_empresa: number; nome: string }[];
  categorias: { id: string; nome: string }[];
}

interface Filtros {
  status: string;
  conferido: string;
  fornecedor_id: string;
  categoria_id: string;
  empresa_id: string;
  data_inicio: string;
  data_fim: string;
  busca: string;
}

interface ContasClientProps {
  initialContas: Conta[];
  initialTotal: number;
  lookup: LookupData;
  initialPage: number;
  limit: number;
  initialTotalValor: number;
}

const FILTROS_PADRAO: Filtros = {
  status: '',
  conferido: '',
  fornecedor_id: '',
  categoria_id: '',
  empresa_id: '',
  data_inicio: '',
  data_fim: '',
  busca: '',
};

export function ContasClient({
  initialContas,
  initialTotal,
  lookup,
  initialPage,
  limit,
  initialTotalValor,
}: ContasClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Sincronizar filtros com URL
  const filtros = useMemo<Filtros>(() => ({
    status: searchParams.get('status') || '',
    conferido: searchParams.get('conferido') || '',
    fornecedor_id: searchParams.get('fornecedor_id') || '',
    categoria_id: searchParams.get('categoria_id') || '',
    empresa_id: searchParams.get('empresa_id') || '',
    data_inicio: searchParams.get('data_inicio') || '',
    data_fim: searchParams.get('data_fim') || '',
    busca: searchParams.get('busca') || '',
  }), [searchParams]);

  const page = parseInt(searchParams.get('page') || String(initialPage));
  
  // Usar props do servidor E filtros da URL para exibição
  const [contas, setContas] = useState<Conta[]>(initialContas);
  const [total, setTotal] = useState(initialTotal);
  const [totalValor, setTotalValor] = useState(initialTotalValor);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Atualizar dados quando initialContas mudar (re-render do servidor)
  useEffect(() => {
    setContas(initialContas);
    setTotal(initialTotal);
    setTotalValor(initialTotalValor);
    setCurrentPage(page);
  }, [initialContas, initialTotal, initialTotalValor, page]);

  const [buscaInput, setBuscaInput] = useState(filtros.busca);

  // Atualizar URL com novos filtros
  const updateFilters = useCallback(
    (newFiltros: Partial<Filtros>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      Object.entries(newFiltros).forEach(([key, value]) => {
        if (value && value !== 'todos') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset para página 1 ao mudar filtros
      params.delete('page');

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  // Debounce para busca
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (buscaInput !== filtros.busca) {
        updateFilters({ busca: buscaInput });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [buscaInput]);

  const limparFiltros = () => {
    setBuscaInput('');
    startTransition(() => {
      router.push(pathname);
    });
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">Contas a Pagar</h1>
              <Badge variant="secondary" className="text-lg px-3 py-1 bg-primary/10 text-primary border-primary/20">
                {formatCurrency(totalValor)}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {total} conta(s) encontrada(s)
            </p>
          </div>
          <Button asChild>
            <Link href="/contas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conta..."
                  value={buscaInput}
                  onChange={(e) => setBuscaInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filtros.status}
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.conferido}
                onValueChange={(value) => updateFilters({ conferido: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Conferido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.fornecedor_id}
                onValueChange={(value) => updateFilters({ fornecedor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {lookup.fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtros.categoria_id}
                onValueChange={(value) => updateFilters({ categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {lookup.categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => updateFilters({ data_inicio: e.target.value })}
                placeholder="Data início"
              />
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => updateFilters({ data_fim: e.target.value })}
                placeholder="Data fim"
              />
              <Button variant="outline" onClick={limparFiltros}>
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
                <p className="text-muted-foreground">Nenhuma conta encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Conferido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.map((conta) => {
                    // Calcular status exibido: se pendente e já passou do vencimento, mostrar vencido
                    const hoje = new Date().toISOString().split('T')[0];
                    const statusExibido =
                      conta.status === 'pendente' && conta.data_vencimento < hoje
                        ? 'vencido'
                        : conta.status;

                    return (
                      <TableRow key={conta.id}>
                        <TableCell>
                          {conta.conferido && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/contas/${conta.id}?${searchParams.toString()}`}
                            className="font-medium hover:underline"
                          >
                            {conta.descricao}
                          </Link>
                          {conta.categoria && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {conta.categoria.nome}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {conta.fornecedor?.nome || conta.favorecido_nome || '-'}
                        </TableCell>
                        <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(conta.valor))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={statusExibido as any} />
                        </TableCell>
                        <TableCell>
                          {conta.conferido ? (
                            <span className="text-green-600 text-sm">Sim</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Não</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Paginação */}
        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * limit + 1} a {Math.min(currentPage * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(currentPage - 1));
                  startTransition(() => {
                    router.push(`${pathname}?${params.toString()}`);
                  });
                }}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage * limit >= total}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', String(currentPage + 1));
                  startTransition(() => {
                    router.push(`${pathname}?${params.toString()}`);
                  });
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
