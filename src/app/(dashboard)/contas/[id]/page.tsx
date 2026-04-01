'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge, ProcessamentoBadge } from '@/components/contas';
import { useContas, useAuth } from '@/hooks';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  Receipt,
  FileText,
  Download,
  Calendar,
  Building2,
  User,
  Hash,
  Check,
  Upload,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function DetalheContaPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { conta, obterConta, marcarConferido, registrarPagamento, excluirConta, isLoading } = useContas();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showConferirDialog, setShowConferirDialog] = useState(false);
  const [showPagarDialog, setShowPagarDialog] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
  const [comprovante, setComprovante] = useState<File | null>(null);
  const [pagarLoading, setPagarLoading] = useState(false);
  const [conferidoPorNome, setConferidoPorNome] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      obterConta(params.id as string);
    }
  }, [params.id]);

  // Buscar nome de quem conferiu
  useEffect(() => {
    const buscarConferidoPor = async () => {
      if (conta?.conferido_por) {
        const supabase = createClient();
        const { data } = await supabase
          .from('perfis_usuarios')
          .select('nome')
          .eq('id', conta.conferido_por)
          .single();
        setConferidoPorNome(data?.nome || 'Usuário');
      }
    };
    buscarConferidoPor();
  }, [conta?.conferido_por]);

  const podeEditar = user?.role === 'admin' || user?.role === 'atendente';
  const podeExcluir = user?.role === 'admin';

  const handleConferir = async () => {
    const result = await marcarConferido(conta!.id, observacao);
    if (result) {
      toast.success('Conta marcada como conferida!');
      setShowConferirDialog(false);
      setObservacao('');
      obterConta(conta!.id);
    } else {
      toast.error('Erro ao marcar como conferida');
    }
  };

  const handlePagar = async () => {
    // ✅ CORRIGIDO: Validar que a data de pagamento não é futura
    const dataPagamentoSelecionada = new Date(dataPagamento);
    const dataAtual = new Date();
    dataAtual.setHours(0, 0, 0, 0);
    
    if (dataPagamentoSelecionada > dataAtual) {
      toast.error('Data de pagamento não pode ser futura');
      return;
    }

    setPagarLoading(true);

    try {
      // Se tem comprovante, enviar via webhook (n8n processa e faz upload no S3)
      if (comprovante) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', comprovante);
        formDataUpload.append('tipo', 'comprovantes');
        formDataUpload.append('conta_id', conta!.id);
        formDataUpload.append('data_pagamento', dataPagamento);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || 'Erro ao processar comprovante');
          setPagarLoading(false);
          return;
        }

        // O n8n já cadastrou o pagamento via API, só atualizamos a UI
        toast.success('Pagamento registrado com sucesso!');
      } else {
        // Sem comprovante, registrar diretamente
        const result = await registrarPagamento(conta!.id, dataPagamento);
        if (result) {
          toast.success('Pagamento registrado com sucesso!');
        } else {
          toast.error('Erro ao registrar pagamento');
          setPagarLoading(false);
          return;
        }
      }

      setShowPagarDialog(false);
      setComprovante(null);
      setDataPagamento(new Date().toISOString().split('T')[0]);
      obterConta(conta!.id);
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error('Erro ao registrar pagamento');
    } finally {
      setPagarLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Apenas PDF, JPEG ou PNG são permitidos');
        return;
      }
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máximo 10MB)');
        return;
      }
      setComprovante(file);
    }
  };

  const handleExcluir = async () => {
    const result = await excluirConta(conta!.id);
    if (result) {
      toast.success('Conta excluída!');
      router.push('/contas');
    } else {
      toast.error('Erro ao excluir conta');
    }
  };

  if (isLoading || !conta) {
    return (
      <>
        <Header />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            Carregando...
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Detalhes da Conta</h1>
            <p className="text-muted-foreground">
              {conta.descricao}
            </p>
          </div>
          <div className="flex gap-2">
            {podeEditar && !conta.conferido && (
              <Dialog open={showConferirDialog} onOpenChange={setShowConferirDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Conferir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Marcar como Conferida</DialogTitle>
                    <DialogDescription>
                      Confirme que os dados desta conta estão corretos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="observacao">Observação (opcional)</Label>
                      <Textarea
                        id="observacao"
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                        placeholder="Observações sobre a conferência..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConferirDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleConferir}>Confirmar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {podeEditar && conta.status !== 'pago' && (
              <Dialog open={showPagarDialog} onOpenChange={(open) => {
                setShowPagarDialog(open);
                if (!open) {
                  setComprovante(null);
                  setDataPagamento(new Date().toISOString().split('T')[0]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Receipt className="h-4 w-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <DialogDescription>
                      Informe a data e envie o comprovante de pagamento.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_pagamento">Data do Pagamento</Label>
                      <Input
                        id="data_pagamento"
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comprovante">Comprovante (PDF, JPEG ou PNG)</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                        <Input
                          id="comprovante"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Label htmlFor="comprovante" className="cursor-pointer">
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          {comprovante ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 truncate max-w-[200px]">
                                {comprovante.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              Clique para selecionar ou arraste aqui
                            </span>
                          )}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Opcional. O comprovante será enviado para processamento.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowPagarDialog(false)} disabled={pagarLoading}>
                      Cancelar
                    </Button>
                    <Button onClick={handlePagar} disabled={pagarLoading}>
                      {pagarLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {comprovante ? 'Enviar e Confirmar' : 'Confirmar Pagamento'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {podeExcluir && (
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Excluir Conta</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleExcluir}>
                      Excluir
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex gap-4 mb-6">
          <Badge variant={conta.status === 'pago' ? 'success' : conta.status === 'vencido' ? 'destructive' : 'warning'} className="text-sm px-3 py-1">
            {conta.status.toUpperCase()}
          </Badge>
          <ProcessamentoBadge status={conta.status_processamento} />
          {conta.conferido && (
            <Badge variant="success" className="text-sm px-3 py-1">
              <Check className="h-3 w-3 mr-1" />
              Conferido
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="text-2xl font-bold">{formatCurrency(Number(conta.valor))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vencimento
                </span>
                <span>{formatDate(conta.data_vencimento)}</span>
              </div>
              {conta.data_pagamento && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Pago em
                  </span>
                  <span>{formatDate(conta.data_pagamento)}</span>
                </div>
              )}
              {conta.categoria && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Categoria</span>
                  <Badge style={{ backgroundColor: conta.categoria.cor || '#6B7280' }}>
                    {conta.categoria.nome}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorecido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Favorecido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span>{conta.fornecedor?.nome || conta.favorecido_nome || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">CNPJ/CPF</span>
                <span>{conta.fornecedor?.cnpj_cpf || conta.favorecido_cnpj_cpf || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Boleto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Dados do Boleto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conta.linha_digitavel && (
                <div>
                  <span className="text-muted-foreground text-sm">Linha Digitável</span>
                  <p className="font-mono text-sm break-all">{conta.linha_digitavel}</p>
                </div>
              )}
              {conta.codigo_barras && (
                <div>
                  <span className="text-muted-foreground text-sm">Código de Barras</span>
                  <p className="font-mono text-sm break-all">{conta.codigo_barras}</p>
                </div>
              )}
              {conta.numero_documento && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Nº Documento</span>
                  <span>{conta.numero_documento}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arquivos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Arquivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conta.url_pdf_original ? (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium">PDF do Boleto</p>
                      <p className="text-sm text-muted-foreground">Original</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={conta.url_pdf_original} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum arquivo anexado</p>
              )}
              {conta.url_comprovante_pagamento && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="font-medium">Comprovante de Pagamento</p>
                      <p className="text-sm text-muted-foreground">Baixado em {formatDate(conta.data_pagamento!)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={conta.url_comprovante_pagamento} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observações */}
          {conta.observacoes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{conta.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Conferência */}
          {conta.conferido && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Conferência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Conferido por</span>
                  <span>{conferidoPorNome || 'Carregando...'}</span>
                </div>
                {conta.conferido_em && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground">Conferido em</span>
                    <span>{formatDateTime(conta.conferido_em)}</span>
                  </div>
                )}
                {conta.observacao_conferido && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Observação:</p>
                    <p>{conta.observacao_conferido}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Cadastrado em {formatDateTime(conta.created_at!)}</span>
                <span>Atualizado em {formatDateTime(conta.updated_at!)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
