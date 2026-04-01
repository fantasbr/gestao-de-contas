'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth, useContas } from '@/hooks';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { maskCNPJCPF, validateCNPJCPF } from '@/lib/utils';

export default function NovaContaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { criarConta, isLoading } = useContas();
  const [uploadLoading, setUploadLoading] = useState(false);

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data_vencimento: '',
    fornecedor_nome: '',
    fornecedor_cnpj: '',
    linha_digitavel: '',
    codigo_barras: '',
    observacoes: '',
  });

  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Por favor, selecione um arquivo PDF');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.valor || !formData.data_vencimento) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    // Validar CNPJ/CPF se preenchido
    if (formData.fornecedor_cnpj && !validateCNPJCPF(formData.fornecedor_cnpj)) {
      toast.error('CNPJ/CPF inválido');
      return;
    }

    // Se tem arquivo PDF, enviar para processamento (n8n faria OCR)
    if (file) {
      setUploadLoading(true);
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('tipo', 'contas');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Arquivo enviado para processamento! A conta será cadastrada automaticamente após a extração dos dados.');
          router.push('/contas');
        } else {
          toast.error(data.error || 'Erro ao processar arquivo');
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        toast.error('Erro ao enviar arquivo para processamento');
      } finally {
        setUploadLoading(false);
      }
    } else {
      // Criar conta manualmente se não houver arquivo
      const result = await criarConta({
        descricao: formData.descricao,
        valor: Number(formData.valor),
        data_vencimento: formData.data_vencimento,
        favorecido_nome: formData.fornecedor_nome,
        favorecido_cnpj_cpf: formData.fornecedor_cnpj,
        linha_digitavel: formData.linha_digitavel,
        codigo_barras: formData.codigo_barras,
        observacoes: formData.observacoes,
        status_processamento: 'processado',
        conferido: true,
        created_by: user?.id,
      });

      if (result) {
        toast.success('Conta criada com sucesso!');
        router.push('/contas');
      } else {
        toast.error('Erro ao criar conta');
      }
    }
  };

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
          <div>
            <h1 className="text-3xl font-bold">Nova Conta</h1>
            <p className="text-muted-foreground">
              Cadastrar uma nova conta a pagar
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Conta de luz CPFL"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$) *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
                    <Input
                      id="data_vencimento"
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData({ ...formData, data_vencimento: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor_nome">Nome do Fornecedor</Label>
                    <Input
                      id="fornecedor_nome"
                      value={formData.fornecedor_nome}
                      onChange={(e) => setFormData({ ...formData, fornecedor_nome: e.target.value })}
                      placeholder="Nome do favorecido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fornecedor_cnpj">CNPJ/CPF do Fornecedor</Label>
                    <Input
                      id="fornecedor_cnpj"
                      value={formData.fornecedor_cnpj}
                      onChange={(e) => setFormData({ ...formData, fornecedor_cnpj: maskCNPJCPF(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="linha_digitavel">Linha Digitável</Label>
                    <Input
                      id="linha_digitavel"
                      value={formData.linha_digitavel}
                      onChange={(e) => setFormData({ ...formData, linha_digitavel: e.target.value })}
                      placeholder="Código do boleto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigo_barras">Código de Barras</Label>
                    <Input
                      id="codigo_barras"
                      value={formData.codigo_barras}
                      onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                      placeholder="Código de barras"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Upload do Boleto (PDF)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Arraste e solte um arquivo PDF aqui ou clique para selecionar
                  </p>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                  {file && (
                    <p className="mt-4 text-sm text-green-600">
                      ✓ {file.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    O arquivo será processado automaticamente para extrair os dados do boleto
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/contas')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || uploadLoading}
              >
                {(isLoading || uploadLoading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {file ? 'Enviar para Processamento' : 'Cadastrar Conta'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
