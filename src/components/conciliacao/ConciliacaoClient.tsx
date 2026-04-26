'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Header } from '@/components/layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Link2,
  Link2Off,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Loader2,
  Calendar,
  TrendingUp,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { vincularConciliacao, desvincularConciliacao } from '@/actions/conciliacao';
import { cn } from '@/lib/utils';

interface ContaPagarItem {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: string;
  favorecido_nome: string | null;
  fornecedor: { id: string; nome: string } | null;
  categoria: { id: string; nome: string; cor: string | null } | null;
  empresa: { id_empresa: number; nome: string } | null;
  conta_paga_id: number | null;
}

interface ContaPagaItem {
  id: number;
  beneficiario_nome: string | null;
  pagador_nome: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  valor_documento: number | null;
  juros_multa: number | null;
  valor_pago: number | null;
  url_pdf: string | null;
  tipo: string | null;
  descricao: string | null;
  conciliado: boolean | null;
}

interface ConciliacaoClientProps {
  contasPagar: ContaPagarItem[];
  contasPagas: ContaPagaItem[];
}

function calcularScore(pagar: ContaPagarItem, paga: ContaPagaItem): number {
  let score = 0;

  // Valor (±5%): até 40 pts
  const vPagar = Number(pagar.valor);
  const vPaga = Number(paga.valor_pago ?? paga.valor_documento ?? 0);
  if (vPagar > 0 && vPaga > 0) {
    const diff = Math.abs(vPagar - vPaga) / vPagar;
    if (diff <= 0.02) score += 40;
    else if (diff <= 0.05) score += 28;
    else if (diff <= 0.10) score += 14;
  }

  // Data (diferença em dias): até 30 pts
  if (pagar.data_vencimento && paga.data_pagamento) {
    const dVenc = new Date(pagar.data_vencimento).getTime();
    const dPago = new Date(paga.data_pagamento).getTime();
    const diffDays = Math.abs((dPago - dVenc) / 86400000);
    if (diffDays <= 2)  score += 30;
    else if (diffDays <= 7)  score += 22;
    else if (diffDays <= 15) score += 12;
    else if (diffDays <= 30) score += 5;
  }

  // Nome: até 30 pts
  const nomePagar = (pagar.favorecido_nome ?? pagar.fornecedor?.nome ?? '').toLowerCase();
  const nomePaga  = (paga.beneficiario_nome ?? '').toLowerCase();
  if (nomePagar && nomePaga) {
    if (nomePagar === nomePaga) score += 30;
    else if (nomePagar.includes(nomePaga) || nomePaga.includes(nomePagar)) score += 22;
    else {
      const words = nomePagar.split(/\s+/).filter(w => w.length > 3);
      if (words.some(w => nomePaga.includes(w))) score += 12;
    }
  }

  return Math.min(score, 100);
}

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70)
    return (
      <Badge className="text-[10px] px-1.5 py-0.5 bg-emerald-500 hover:bg-emerald-500 text-white gap-1">
        <Sparkles className="h-2.5 w-2.5" />{score}%
      </Badge>
    );
  if (score >= 40)
    return (
      <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-500 text-white">
        {score}%
      </Badge>
    );
  return null;
}

export function ConciliacaoClient({ contasPagar, contasPagas }: ConciliacaoClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [selectedPagarId, setSelectedPagarId] = useState<string | null>(null);
  const [selectedPagaId,  setSelectedPagaId]  = useState<number | null>(null);
  const [showConfirm,     setShowConfirm]      = useState(false);
  const [showDesvincular, setShowDesvincular]  = useState(false);
  const [desvincularId,   setDesvincularId]    = useState<string | null>(null);
  const [isLoading,       setIsLoading]        = useState(false);
  const [buscaPagar,      setBuscaPagar]        = useState('');
  const [buscaPaga,       setBuscaPaga]         = useState('');

  const selectedPagar = useMemo(() => contasPagar.find(c => c.id === selectedPagarId) ?? null, [contasPagar, selectedPagarId]);
  const selectedPaga  = useMemo(() => contasPagas.find(c => c.id === selectedPagaId)  ?? null, [contasPagas, selectedPagaId]);

  const scores = useMemo(() => {
    if (!selectedPagar) return new Map<number, number>();
    return new Map(contasPagas.map(cp => [cp.id, calcularScore(selectedPagar, cp)]));
  }, [selectedPagar, contasPagas]);

  const filteredPagar = useMemo(() => {
    const q = buscaPagar.toLowerCase();
    return contasPagar.filter(c =>
      !q ||
      c.descricao.toLowerCase().includes(q) ||
      (c.favorecido_nome ?? '').toLowerCase().includes(q) ||
      (c.fornecedor?.nome ?? '').toLowerCase().includes(q)
    );
  }, [contasPagar, buscaPagar]);

  const filteredPaga = useMemo(() => {
    const q = buscaPaga.toLowerCase();
    let list = contasPagas.filter(c =>
      !q ||
      (c.beneficiario_nome ?? '').toLowerCase().includes(q) ||
      (c.pagador_nome ?? '').toLowerCase().includes(q) ||
      (c.descricao ?? '').toLowerCase().includes(q)
    );
    if (selectedPagar) {
      list = [...list].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    }
    return list;
  }, [contasPagas, buscaPaga, selectedPagar, scores]);

  const canVincular = !!selectedPagar && !!selectedPaga;
  const conciliadasCount = contasPagar.filter(c => c.conta_paga_id !== null).length;

  const handleVincular = async () => {
    if (!selectedPagar || !selectedPaga) return;
    setIsLoading(true);
    try {
      const result = await vincularConciliacao(selectedPagar.id, selectedPaga.id);
      if (result.success) {
        toast.success('Conciliação realizada com sucesso!');
        setShowConfirm(false);
        setSelectedPagarId(null);
        setSelectedPagaId(null);
        startTransition(() => router.refresh());
      } else {
        toast.error(result.error ?? 'Erro ao conciliar');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDesvincular = async () => {
    if (!desvincularId) return;
    setIsLoading(true);
    try {
      const result = await desvincularConciliacao(desvincularId);
      if (result.success) {
        toast.success('Vínculo desfeito!');
        setShowDesvincular(false);
        setDesvincularId(null);
        startTransition(() => router.refresh());
      } else {
        toast.error(result.error ?? 'Erro ao desvincular');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Page Header ── */}
        <div className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
                Conciliação Financeira
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Selecione uma conta pendente (esquerda) e o comprovante correspondente (direita), depois clique em <strong>Vincular</strong>.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge variant="outline" className="gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                {filteredPagar.length} pendente(s)
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                {filteredPaga.length} comprovante(s)
              </Badge>
              {conciliadasCount > 0 && (
                <Badge variant="outline" className="gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {conciliadasCount} conciliada(s)
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Bar (aparece quando ambos estão selecionados) ── */}
        {canVincular && (
          <div className="px-6 py-3 bg-primary/5 border-b flex items-center gap-4 shrink-0">
            <div className="flex-1 text-sm">
              <span className="font-medium text-primary">{selectedPagar?.descricao}</span>
              <span className="text-muted-foreground mx-2">←→</span>
              <span className="font-medium text-primary">{selectedPaga?.beneficiario_nome ?? selectedPaga?.descricao ?? `#${selectedPaga?.id}`}</span>
            </div>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Link2 className="h-4 w-4" />
              Vincular
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedPagarId(null); setSelectedPagaId(null); }}>
              Limpar seleção
            </Button>
          </div>
        )}

        {/* ── Two-column grid ── */}
        <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden min-h-0">

          {/* === COLUNA ESQUERDA: Contas a Pagar === */}
          <div className="flex flex-col overflow-hidden border-r">
            <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Contas a Pagar — Pendentes / Vencidas
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca-contas-pagar"
                  placeholder="Buscar conta, fornecedor..."
                  value={buscaPagar}
                  onChange={e => setBuscaPagar(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPagar.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma conta pendente</p>
                </div>
              ) : filteredPagar.map(conta => {
                const isSelected = conta.id === selectedPagarId;
                const isConciliada = conta.conta_paga_id !== null;
                const isVencida   = conta.status === 'vencido';
                return (
                  <div
                    key={conta.id}
                    id={`conta-pagar-${conta.id}`}
                    onClick={() => !isConciliada && setSelectedPagarId(isSelected ? null : conta.id)}
                    className={cn(
                      'rounded-lg border p-3 transition-all',
                      isConciliada
                        ? 'opacity-50 cursor-default bg-muted/20'
                        : 'cursor-pointer hover:border-primary/50 hover:bg-accent/30',
                      isSelected && 'border-primary bg-primary/5 ring-1 ring-primary',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{conta.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conta.fornecedor?.nome ?? conta.favorecido_nome ?? '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{formatCurrency(Number(conta.valor))}</p>
                        {isConciliada ? (
                          <Badge className="text-[10px] px-1.5 bg-emerald-500 hover:bg-emerald-500 text-white mt-1 gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />Conciliada
                          </Badge>
                        ) : (
                          <Badge
                            variant={isVencida ? 'destructive' : 'warning'}
                            className="text-[10px] px-1.5 mt-1"
                          >
                            {conta.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(conta.data_vencimento)}
                      </span>
                      {conta.categoria && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                          style={{ backgroundColor: conta.categoria.cor ?? '#6B7280' }}
                        >
                          {conta.categoria.nome}
                        </span>
                      )}
                      {isConciliada && (
                        <button
                          id={`desvincular-${conta.id}`}
                          onClick={e => {
                            e.stopPropagation();
                            setDesvincularId(conta.id);
                            setShowDesvincular(true);
                          }}
                          className="ml-auto text-destructive hover:underline flex items-center gap-1"
                        >
                          <Link2Off className="h-3 w-3" />
                          Desfazer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* === COLUNA DIREITA: Contas Pagas === */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Comprovantes Disponíveis
                {selectedPagar && (
                  <span className="ml-2 normal-case text-primary font-normal">
                    — ordenados por similaridade
                  </span>
                )}
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca-contas-pagas"
                  placeholder="Buscar beneficiário, descrição..."
                  value={buscaPaga}
                  onChange={e => setBuscaPaga(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPaga.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">Nenhum comprovante disponível</p>
                </div>
              ) : filteredPaga.map(cp => {
                const isSelected = cp.id === selectedPagaId;
                const score      = scores.get(cp.id) ?? 0;
                return (
                  <div
                    key={cp.id}
                    id={`conta-paga-${cp.id}`}
                    onClick={() => setSelectedPagaId(isSelected ? null : cp.id)}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-all hover:border-primary/50 hover:bg-accent/30',
                      isSelected && 'border-primary bg-primary/5 ring-1 ring-primary',
                      selectedPagar && score >= 70 && !isSelected && 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/20',
                      selectedPagar && score >= 40 && score < 70 && !isSelected && 'border-amber-300 bg-amber-50/30 dark:border-amber-700 dark:bg-amber-950/20',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {cp.beneficiario_nome ?? cp.descricao ?? `Comprovante #${cp.id}`}
                          </p>
                          {selectedPagar && <ScoreBadge score={score} />}
                        </div>
                        {cp.pagador_nome && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{cp.pagador_nome}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(Number(cp.valor_pago ?? 0))}</p>
                        {cp.juros_multa && cp.juros_multa > 0 && (
                          <p className="text-[10px] text-destructive">
                            +{formatCurrency(cp.juros_multa)} juros
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {cp.data_pagamento ? formatDate(cp.data_pagamento) : '—'}
                      </span>
                      {cp.tipo && (
                        <Badge variant="outline" className="text-[10px] px-1.5">{cp.tipo}</Badge>
                      )}
                      {cp.url_pdf && (
                        <a
                          href={cp.url_pdf}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="ml-auto flex items-center gap-1 text-primary hover:underline"
                        >
                          <Download className="h-3 w-3" />PDF
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal Confirmar Vínculo ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-emerald-600" />
              Confirmar Conciliação
            </DialogTitle>
            <DialogDescription>
              Os seguintes registros serão vinculados. A conta a pagar passará para status <strong>Pago</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <Card className="border-amber-200 bg-amber-50/40 dark:border-amber-800 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conta a Pagar</p>
                <p className="font-semibold text-sm">{selectedPagar?.descricao}</p>
                <p className="text-xs text-muted-foreground">{selectedPagar?.fornecedor?.nome ?? selectedPagar?.favorecido_nome ?? '—'}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Valor</span>
                  <span className="font-bold">{formatCurrency(Number(selectedPagar?.valor))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Vencimento</span>
                  <span className="text-xs">{selectedPagar?.data_vencimento ? formatDate(selectedPagar.data_vencimento) : '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comprovante</p>
                <p className="font-semibold text-sm">{selectedPaga?.beneficiario_nome ?? selectedPaga?.descricao ?? `#${selectedPaga?.id}`}</p>
                <p className="text-xs text-muted-foreground">{selectedPaga?.pagador_nome ?? '—'}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Valor Pago</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(Number(selectedPaga?.valor_pago ?? 0))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Data Pgto.</span>
                  <span className="text-xs">{selectedPaga?.data_pagamento ? formatDate(selectedPaga.data_pagamento) : '—'}</span>
                </div>
                {selectedPaga?.url_pdf && (
                  <a
                    href={selectedPaga.url_pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline pt-1"
                  >
                    <ExternalLink className="h-3 w-3" />Ver PDF
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedPagar && selectedPaga && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Score de similaridade:
              <ScoreBadge score={scores.get(selectedPaga.id) ?? 0} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              id="btn-confirmar-vincular"
              onClick={handleVincular}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal Desvincular ── */}
      <Dialog open={showDesvincular} onOpenChange={setShowDesvincular}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2Off className="h-5 w-5 text-destructive" />
              Desfazer Conciliação
            </DialogTitle>
            <DialogDescription>
              O status da conta voltará para <strong>Pendente</strong> ou <strong>Vencido</strong> conforme a data de vencimento, e o comprovante será desvinculado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDesvincular(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              id="btn-confirmar-desvincular"
              variant="destructive"
              onClick={handleDesvincular}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desfazer Vínculo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
