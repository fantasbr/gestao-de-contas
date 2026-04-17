'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout';
import { formatCurrency, formatDate, maskCNPJCPF, maskPhone } from '@/lib/utils';
import { StatusBadge } from '@/components/contas';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  User,
  CreditCard,
  Target,
  FileText,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Fornecedor {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  contato?: string;
  email?: string;
  telefone?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo_conta?: string;
  chave_pix?: string;
  tipo_pix?: string;
  observacoes?: string;
}

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  status_processamento: string;
}

interface FornecedorDetailClientProps {
  fornecedor: Fornecedor;
  contas: Conta[];
}

export function FornecedorDetailClient({ fornecedor, contas }: FornecedorDetailClientProps) {
  const router = useRouter();
  
  // Estados para filtros
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');

  // Filtragem das contas no cliente
  const contasFiltradas = useMemo(() => {
    return contas.filter((conta) => {
      const matchBusca = conta.descricao.toLowerCase().includes(busca.toLowerCase());
      
      const matchData = (!dataInicio || conta.data_vencimento >= dataInicio) &&
                        (!dataFim || conta.data_vencimento <= dataFim);
      
      const valMin = valorMin ? parseFloat(valorMin) : -Infinity;
      const valMax = valorMax ? parseFloat(valorMax) : Infinity;
      const matchValor = conta.valor >= valMin && conta.valor <= valMax;

      return matchBusca && matchData && matchValor;
    });
  }, [contas, busca, dataInicio, dataFim, valorMin, valorMax]);

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        {/* Header com Navegação */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fornecedores">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{fornecedor.nome}</h1>
            <p className="text-muted-foreground">Detalhes do Fornecedor e Histórico de Contas</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Informações de Contato */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nome Comercial</p>
                <p className="font-medium">{fornecedor.nome}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">CNPJ/CPF</p>
                <p className="font-medium">{fornecedor.cnpj_cpf ? maskCNPJCPF(fornecedor.cnpj_cpf) : '-'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pessoa de Contato</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {fornecedor.contato || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</p>
                {fornecedor.email ? (
                  <a href={`mailto:${fornecedor.email}`} className="text-primary hover:underline flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {fornecedor.email}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Telefone</p>
                {fornecedor.telefone ? (
                  <a href={`tel:${fornecedor.telefone}`} className="font-medium flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {maskPhone(fornecedor.telefone)}
                  </a>
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados Bancários */}
          <Card className="md:col-span-1 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Banco</p>
                  <p className="font-medium">{fornecedor.banco || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Agência</p>
                  <p className="font-medium">{fornecedor.agencia || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Conta</p>
                  <p className="font-medium">{fornecedor.conta || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tipo</p>
                  <p className="font-medium text-xs">{fornecedor.tipo_conta || '-'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Chave PIX
                </p>
                <div className="bg-background border rounded-lg p-3">
                  <p className="font-mono text-sm break-all">{fornecedor.chave_pix || 'Não informada'}</p>
                  {fornecedor.tipo_pix && (
                    <Badge variant="secondary" className="mt-2 text-[10px] uppercase">
                      {fornecedor.tipo_pix}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {fornecedor.observacoes || 'Nenhuma observação cadastrada para este fornecedor.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Contas */}
        <div className="mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              Contas do Fornecedor
              <Badge variant="outline" className="ml-2 font-mono">
                {contasFiltradas.length}
              </Badge>
            </h2>
            
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 bg-accent/30 p-2 rounded-xl border">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por descrição..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 bg-background h-9 border-none focus-visible:ring-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="h-9 w-36 text-xs bg-background"
                />
                <span className="text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="h-9 w-36 text-xs bg-background"
                />
              </div>
              <div className="flex items-center gap-1 border-l pl-2 ml-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Min"
                  value={valorMin}
                  onChange={(e) => setValorMin(e.target.value)}
                  className="h-9 w-20 text-xs bg-background"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={valorMax}
                  onChange={(e) => setValorMax(e.target.value)}
                  className="h-9 w-20 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          <Card className="overflow-hidden border-none shadow-lg">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40%]">Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contasFiltradas.length > 0 ? (
                  contasFiltradas.map((conta) => (
                    <TableRow 
                      key={conta.id} 
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => router.push(`/contas/${conta.id}`)}
                    >
                      <TableCell className="font-medium">{conta.descricao}</TableCell>
                      <TableCell>{formatDate(conta.data_vencimento)}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={conta.status as any} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Nenhuma conta encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
