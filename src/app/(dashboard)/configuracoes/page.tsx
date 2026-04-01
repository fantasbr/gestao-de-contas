'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebhooks } from '@/hooks';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Key, Globe, Shield, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Webhooks predefinidos pelo sistema
const WEBHOOKS_PREDEFINIDOS = [
  {
    nome_evento: 'conta_cadastro',
    descricao: 'Recebe boleto PDF para extração de dados via OCR. O n8n processa e cadastra a conta automaticamente.',
  },
  {
    nome_evento: 'conta_pagamento',
    descricao: 'Recebe comprovante de pagamento. O n8n faz upload no S3 e atualiza o status da conta.',
  },
  {
    nome_evento: 'notificacao',
    descricao: 'Envia notificações via WhatsApp quando uma conta é processada ou paga.',
  },
];

export default function ConfiguracoesPage() {
  const { webhooks, listarWebhooks, criarWebhook, atualizarWebhook, excluirWebhook, isLoading } = useWebhooks();
  const [tokenApi, setTokenApi] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Webhook dialog
  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome_evento: '',
    url_webhook: '',
    ativo: true,
    descricao: '',
  });

  useEffect(() => {
    listarWebhooks();
    carregarToken();
  }, []);

  const carregarToken = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (data.api_token) {
          setTokenApi('••••••••••••••••');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const salvarToken = async () => {
    setTokenLoading(true);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_token: tokenApi }),
      });
      if (res.ok) {
        toast.success('Token atualizado com sucesso!');
        setTokenApi('••••••••••••••••');
      }
    } catch (e) {
      toast.error('Erro ao salvar token');
    }
    setTokenLoading(false);
  };

  const handleOpenDialog = (webhook?: any) => {
    if (webhook) {
      setEditando(webhook);
      setFormData(webhook);
    } else {
      setEditando(null);
      setFormData({ nome_evento: '', url_webhook: '', ativo: true, descricao: '' });
    }
    setShowDialog(true);
  };

  const handleWebhookSelecionado = (nome_evento: string) => {
    const webhookPredefinido = WEBHOOKS_PREDEFINIDOS.find(w => w.nome_evento === nome_evento);
    if (webhookPredefinido) {
      setFormData({
        ...formData,
        nome_evento: webhookPredefinido.nome_evento,
        descricao: webhookPredefinido.descricao,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_evento || !formData.url_webhook) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    let result;
    if (editando) {
      result = await atualizarWebhook(editando.id, formData);
      if (result) toast.success('Webhook atualizado!');
    } else {
      result = await criarWebhook(formData);
      if (result) toast.success('Webhook criado!');
    }

    if (result) {
      setShowDialog(false);
      listarWebhooks();
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      const result = await excluirWebhook(id);
      if (result) {
        toast.success('Webhook excluído!');
        listarWebhooks();
      }
    }
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure webhooks, API e outras opções do sistema
          </p>
        </div>

        <Tabs defaultValue="webhooks" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="webhooks">
              <Globe className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" />
              API Token
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>
                    Configure os webhooks para integração com o n8n
                  </CardDescription>
                </div>
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Webhook
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editando ? 'Editar Webhook' : 'Novo Webhook'}
                      </DialogTitle>
                      <DialogDescription>
                        {editando 
                          ? 'Edite as informações do webhook.' 
                          : 'Selecione o tipo de webhook que deseja configurar.'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4 py-4">
                        {!editando && (
                          <div className="space-y-2">
                            <Label htmlFor="tipo_webhook">Tipo de Webhook *</Label>
                            <Select onValueChange={handleWebhookSelecionado}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {WEBHOOKS_PREDEFINIDOS.map((webhook) => (
                                  <SelectItem 
                                    key={webhook.nome_evento} 
                                    value={webhook.nome_evento}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">{webhook.nome_evento}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {webhook.descricao.substring(0, 50)}...
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="nome_evento">Nome do Evento *</Label>
                          <Input
                            id="nome_evento"
                            value={formData.nome_evento}
                            onChange={(e) => setFormData({ ...formData, nome_evento: e.target.value })}
                            placeholder="Ex: conta_cadastro"
                            required
                            disabled={!editando}
                            className={!editando ? 'bg-muted' : ''}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="url_webhook">URL do Webhook *</Label>
                          <Input
                            id="url_webhook"
                            type="url"
                            value={formData.url_webhook}
                            onChange={(e) => setFormData({ ...formData, url_webhook: e.target.value })}
                            placeholder="https://seu-n8n.exemplo.com/webhook/..."
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descricao">Descrição</Label>
                          <Input
                            id="descricao"
                            value={formData.descricao}
                            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            placeholder="Descrição do webhook"
                          />
                        </div>
                        {formData.nome_evento && !editando && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Função:</p>
                            <p className="text-xs text-muted-foreground">
                              {WEBHOOKS_PREDEFINIDOS.find(w => w.nome_evento === formData.nome_evento)?.descricao}
                            </p>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit">
                          {editando ? 'Salvar' : 'Criar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="p-8 text-center">Carregando...</div>
                ) : webhooks.length === 0 ? (
                  <div className="p-8 text-center">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum webhook configurado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{webhook.nome_evento}</span>
                            <Badge variant={webhook.ativo ? 'success' : 'secondary'}>
                              {webhook.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {webhook.url_webhook}
                          </p>
                          {webhook.descricao && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {webhook.descricao}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(webhook)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExcluir(webhook.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Token API do n8n
                </CardTitle>
                <CardDescription>
                  Configure o token de autenticação para comunicação com o n8n
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Token API</Label>
                  <div className="flex gap-2">
                    <Input
                      id="token"
                      type={showToken ? 'text' : 'password'}
                      value={tokenApi}
                      onChange={(e) => setTokenApi(e.target.value)}
                      placeholder="Cole o token aqui"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O token é armazenado de forma segura no banco de dados
                  </p>
                </div>
                <Button onClick={salvarToken} disabled={tokenLoading || !tokenApi}>
                  {tokenLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Token
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Logs de Webhooks
                </CardTitle>
                <CardDescription>
                  Acesse os logs de todos os webhooks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href="/configuracoes/logs">Ver Logs de Webhooks</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
