'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, Pencil, Trash2, Calendar, FileText, Download, Building2, User } from 'lucide-react';
import { ContaPagaEditModal } from './ContaPagaEditModal';
import { excluirContaPaga } from '@/actions/contas-pagas';
import { toast } from 'sonner';
import type { ContaPaga } from '@/types/database';

interface ContaPagaDetailClientProps {
  conta: ContaPaga;
  canEdit: boolean;
}

export function ContaPagaDetailClient({ conta, canEdit }: ContaPagaDetailClientProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este registro de conta paga?')) return;
    
    setIsDeleting(true);
    const result = await excluirContaPaga(conta.id);
    
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success('Registro excluído com sucesso');
      router.push('/contas-pagas');
    }
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto bg-muted/20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            {canEdit && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </Button>
              </div>
            )}
          </div>

          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Conta Paga {conta.identificador && `#${conta.identificador}`}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant={conta.tipo === 'Fixo' ? 'default' : 'secondary'} className="text-sm">
                  {conta.tipo || 'Despesa'}
                </Badge>
                {conta.created_at && (
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Registrada em {new Date(conta.created_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
                {conta.n8n && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Via {conta.n8n}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-right bg-primary/5 p-4 rounded-xl border border-primary/20">
              <p className="text-sm font-medium text-muted-foreground mb-1">Valor Pago</p>
              <p className="text-3xl font-bold text-green-600">
                {conta.valor_pago ? formatCurrency(conta.valor_pago) : '-'}
              </p>
              {conta.data_pagamento && (
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  em {formatDate(conta.data_pagamento)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Involved Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Envolvidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Beneficiário / Fornecedor</p>
                    <p className="font-semibold text-lg">{conta.beneficiario_nome || 'Não especificado'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-secondary/20 rounded-lg text-secondary-foreground">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pagador / Fonte</p>
                    <p className="font-medium">{conta.pagador_nome || 'Não especificado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates & Values Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhes do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Vencimento Original</p>
                      <p className="font-medium">{conta.data_vencimento ? formatDate(conta.data_vencimento) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor do Documento</p>
                      <p className="font-medium">{conta.valor_documento ? formatCurrency(conta.valor_documento) : '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Juros e Multas</p>
                      {conta.juros_multa && conta.juros_multa > 0 ? (
                        <p className="font-medium text-destructive">+{formatCurrency(conta.juros_multa)}</p>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Descontos</p>
                      {conta.desconto_abatimento && conta.desconto_abatimento > 0 ? (
                        <p className="font-medium text-green-600">-{formatCurrency(conta.desconto_abatimento)}</p>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document / PDF */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Comprovante / Documento
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conta.url_pdf ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-md">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">Documento PDF</p>
                          <p className="text-xs text-muted-foreground">Armazenado via n8n</p>
                        </div>
                      </div>
                      <Button asChild variant="outline">
                        <a href={conta.url_pdf} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Documento
                        </a>
                      </Button>
                    </div>
                    {/* Optional PDF preview if url is a direct link to an image or embeddable pdf */}
                    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <iframe 
                        src={`${conta.url_pdf}#view=FitH`} 
                        className="w-full h-full"
                        title="Visualização do PDF"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">Nenhum documento anexado a este registro.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ContaPagaEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        conta={conta}
      />
    </>
  );
}
