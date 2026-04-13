'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { criarCategoria, atualizarCategoria, excluirCategoria } from '@/actions/categorias';
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
  '#EC4899', '#F43F5E', '#6B7280',
];

interface Categoria {
  id: string;
  nome: string;
  cor?: string;
}

interface CategoriasClientProps {
  initialCategorias: Categoria[];
  isAdmin: boolean;
}

export function CategoriasClient({
  initialCategorias,
  isAdmin,
}: CategoriasClientProps) {
  const router = useRouter();
  const [categorias] = useState(initialCategorias);
  const [showDialog, setShowDialog] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#6B7280',
  });

  const handleOpenDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditando(categoria);
      setFormData({ nome: categoria.nome, cor: categoria.cor || '#6B7280' });
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

    setIsSubmitting(true);

    try {
      let result;

      if (editando) {
        result = await atualizarCategoria(editando.id, {
          nome: formData.nome,
          cor: formData.cor,
        });
      } else {
        const formDataToSend = new FormData();
        formDataToSend.append('nome', formData.nome);
        formDataToSend.append('cor', formData.cor);
        result = await criarCategoria(formDataToSend);
      }

      if (result.success) {
        toast.success(editando ? 'Categoria atualizada!' : 'Categoria criada!');
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao salvar categoria');
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
      const result = await excluirCategoria(id);
      if (result.success) {
        toast.success('Categoria excluída!');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao excluir categoria');
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
            <p className="text-muted-foreground mt-1">Gerencie as categorias de contas</p>
          </div>
          {isAdmin && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editando ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
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
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardContent className="p-6">
            {categorias.length === 0 ? (
              <div className="p-8 text-center">
                <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorias.map((categoria) => (
                  <div key={categoria.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: categoria.cor || '#6B7280' }}
                      />
                      <span className="font-medium">{categoria.nome}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(categoria)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleExcluir(categoria.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
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
