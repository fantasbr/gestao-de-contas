'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFornecedores, useAuth } from '@/hooks';
import { Plus, Search, Edit, Trash2, Building, Phone, Mail } from 'lucide-react';
import { maskCNPJCPF, maskPhone, validateCNPJCPF, onlyNumbers } from '@/lib/utils';
import type { TipoPix } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function FornecedoresPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fornecedores, listarFornecedores, criarFornecedor, atualizarFornecedor, excluirFornecedor, isLoading } = useFornecedores();

  const [busca, setBusca] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [formData, setFormData] = useState<{
    nome: string;
    cnpj_cpf: string;
    contato: string;
    email: string;
    telefone: string;
    banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
    chave_pix: string;
    tipo_pix: TipoPix | '';
    observacoes: string;
  }>({
    nome: '',
    cnpj_cpf: '',
    contato: '',
    email: '',
    telefone: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: '',
    chave_pix: '',
    tipo_pix: '',
    observacoes: '',
  });

  useEffect(() => {
    listarFornecedores();
  }, []);

  const podeGerenciar = user?.role === 'admin' || user?.role === 'atendente';

  const handleOpenDialog = (fornecedor?: any) => {
    if (fornecedor) {
      setEditando(fornecedor);
      setFormData(fornecedor);
    } else {
      setEditando(null);
      setFormData({
        nome: '',
        cnpj_cpf: '',
        contato: '',
        email: '',
        telefone: '',
        banco: '',
        agencia: '',
        conta: '',
        tipo_conta: '',
        chave_pix: '',
        tipo_pix: '',
        observacoes: '',
      });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    // Validar CNPJ/CPF se preenchido
    if (formData.cnpj_cpf && !validateCNPJCPF(formData.cnpj_cpf)) {
      toast.error('CNPJ/CPF inválido');
      return;
    }

    let result;
    
    // Preparar dados para envio (converter strings vazias para null)
    const dadosFornecedor = {
      ...formData,
      tipo_pix: formData.tipo_pix || null,
    };
    
    if (editando) {
      result = await atualizarFornecedor(editando.id, dadosFornecedor);
      if (result) {
        toast.success('Fornecedor atualizado!');
      }
    } else {
      result = await criarFornecedor(dadosFornecedor);
      if (result) {
        toast.success('Fornecedor criado!');
      }
    }

    if (result) {
      setShowDialog(false);
      listarFornecedores();
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      const result = await excluirFornecedor(id);
      if (result) {
        toast.success('Fornecedor excluído!');
        listarFornecedores();
      }
    }
  };

  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.cnpj_cpf?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground mt-1">
              {fornecedores.length} fornecedor(es) cadastrado(s)
            </p>
          </div>
          {podeGerenciar && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj_cpf">CNPJ/CPF</Label>
                        <Input
                          id="cnpj_cpf"
                          value={formData.cnpj_cpf}
                          onChange={(e) => setFormData({ ...formData, cnpj_cpf: maskCNPJCPF(e.target.value) })}
                          placeholder="00.000.000/0000-00 ou 000.000.000-00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contato">Contato</Label>
                        <Input
                          id="contato"
                          value={formData.contato}
                          onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">Dados Bancários</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="banco">Banco</Label>
                          <Input
                            id="banco"
                            value={formData.banco}
                            onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agencia">Agência</Label>
                          <Input
                            id="agencia"
                            value={formData.agencia}
                            onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="conta">Conta</Label>
                          <Input
                            id="conta"
                            value={formData.conta}
                            onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tipo_conta">Tipo</Label>
                          <Input
                            id="tipo_conta"
                            value={formData.tipo_conta}
                            onChange={(e) => setFormData({ ...formData, tipo_conta: e.target.value })}
                            placeholder="Corrente/Poupança"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">PIX</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tipo_pix">Tipo da Chave PIX</Label>
                          <select
                            id="tipo_pix"
                            value={formData.tipo_pix || ''}
                            onChange={(e) => setFormData({ ...formData, tipo_pix: e.target.value as TipoPix | '' })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Selecione...</option>
                            <option value="cpf">CPF</option>
                            <option value="cnpj">CNPJ</option>
                            <option value="email">E-mail</option>
                            <option value="telefone">Telefone</option>
                            <option value="aleatoria">Chave Aleatória</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="chave_pix">Chave PIX</Label>
                          <Input
                            id="chave_pix"
                            value={formData.chave_pix}
                            onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                            placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        rows={3}
                      />
                    </div>
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
          )}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : fornecedoresFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CNPJ/CPF</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    {podeGerenciar && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedoresFiltrados.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cnpj_cpf || '-'}</TableCell>
                      <TableCell>{fornecedor.contato || '-'}</TableCell>
                      <TableCell>{fornecedor.email || '-'}</TableCell>
                      <TableCell>{fornecedor.telefone || '-'}</TableCell>
                      {podeGerenciar && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(fornecedor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user?.role === 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExcluir(fornecedor.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
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
