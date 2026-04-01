'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ProcessamentoBadge } from '@/components/contas';
import { useContas, useLookupData, useAuth } from '@/hooks';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, FileText, CheckCircle } from 'lucide-react';
import type { StatusConta } from '@/types/database';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function ContasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { contas, listarContas, total, isLoading } = useContas();
  const { fornecedores, empresas, categorias } = useLookupData();
  const searchParams = useSearchParams();

  const [filtros, setFiltros] = useState({
    status: searchParams.get('status') || '',
    conferido: searchParams.get('conferido') || '',
    fornecedor_id: searchParams.get('fornecedor') || '',
    categoria_id: searchParams.get('categoria') || '',
    empresa_id: searchParams.get('empresa') || '',
    data_inicio: searchParams.get('data_inicio') || '',
    data_fim: searchParams.get('data_fim') || '',
    busca: '',
  });

  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    listarContas({
      status: (filtros.status as StatusConta) || undefined,
      conferido: filtros.conferido === 'true' ? true : filtros.conferido === 'false' ? false : undefined,
      fornecedor_id: filtros.fornecedor_id || undefined,
      categoria_id: filtros.categoria_id || undefined,
      empresa_id: filtros.empresa_id ? Number(filtros.empresa_id) : undefined,
      data_inicio: filtros.data_inicio || undefined,
      data_fim: filtros.data_fim || undefined,
      busca: filtros.busca || undefined,
    }, page, limit);
  }, [filtros, page]);

  const podeEditar = user?.role === 'admin' || user?.role === 'atendente';

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-1">
              {total} conta(s) encontrada(s)
            </p>
          </div>
          <Button onClick={() => router.push('/contas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
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
                  value={filtros.busca}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  className="pl-9"
                />
              </div>
              <Select
                value={filtros.status}
                onValueChange={(value) => setFiltros({ ...filtros, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtros.conferido}
                onValueChange={(value) => setFiltros({ ...filtros, conferido: value })}
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
                onValueChange={(value) => setFiltros({ ...filtros, fornecedor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filtros.categoria_id}
                onValueChange={(value) => setFiltros({ ...filtros, categoria_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filtros.data_inicio}
                onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
                placeholder="Data início"
              />
              <Input
                type="date"
                value={filtros.data_fim}
                onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
                placeholder="Data fim"
              />
              <Button
                variant="outline"
                onClick={() => setFiltros({
                  status: '', conferido: '', fornecedor_id: '',
                  categoria_id: '', empresa_id: '', data_inicio: '', data_fim: '', busca: ''
                })}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
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
                  {contas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell>
                        {conta.conferido && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/contas/${conta.id}`}
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
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={conta.status} />
                          {conta.status_processamento !== 'processado' && (
                            <ProcessamentoBadge status={conta.status_processamento} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {conta.conferido ? (
                          <span className="text-green-600 text-sm">Sim</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
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
