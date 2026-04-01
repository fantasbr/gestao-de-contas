'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCategorias } from '@/hooks';
import { Plus, Edit, Trash2, Tags } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const coresPredefinidas = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#6B7280', '#14B8A6', '#0EA5E9',
];

export default function CategoriasPage() {
  const { categorias, listarCategorias, criarCategoria, atualizarCategoria, excluirCategoria, isLoading } = useCategorias();

  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#6B7280',
  });

  useEffect(() => {
    listarCategorias();
  }, []);

  const handleOpenDialog = (categoria?: any) => {
    if (categoria) {
      setEditando(categoria);
      setFormData(categoria);
    } else {
      setEditando(null);
      setFormData({ nome: '', cor: '#6B7280' });
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      toast.error('Nome é obrigatório');
      return;
    }

    let result;
    if (editando) {
      result = await atualizarCategoria(editando.id, formData);
      if (result) toast.success('Categoria atualizada!');
    } else {
      result = await criarCategoria(formData);
      if (result) toast.success('Categoria criada!');
    }

    if (result) {
      setShowDialog(false);
      listarCategorias();
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      const result = await excluirCategoria(id);
      if (result) {
        toast.success('Categoria excluída!');
        listarCategorias();
      }
    }
  };

  return (
    <>
      <Header />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Categorias</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as categorias de contas
            </p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editando ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
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
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {coresPredefinidas.map((cor) => (
                        <button
                          key={cor}
                          type="button"
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-all',
                            formData.cor === cor ? 'border-foreground scale-110' : 'border-transparent'
                          )}
                          style={{ backgroundColor: cor }}
                          onClick={() => setFormData({ ...formData, cor })}
                        />
                      ))}
                    </div>
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
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="p-8 text-center">Carregando...</div>
            ) : categorias.length === 0 ? (
              <div className="p-8 text-center">
                <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.cor || '#6B7280' }}
                      />
                      <span className="font-medium">{categoria.nome}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(categoria)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExcluir(categoria.id)}
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
      </div>
    </>
  );
}
