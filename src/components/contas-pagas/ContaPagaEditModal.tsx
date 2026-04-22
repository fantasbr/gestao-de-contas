'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { atualizarContaPaga } from '@/actions/contas-pagas';
import type { ContaPaga } from '@/types/database';

const editSchema = z.object({
  beneficiario_nome: z.string().optional(),
  pagador_nome: z.string().optional(),
  data_vencimento: z.string().optional(),
  data_pagamento: z.string().optional(),
  valor_documento: z.coerce.number().optional(),
  juros_multa: z.coerce.number().optional(),
  desconto_abatimento: z.coerce.number().optional(),
  valor_pago: z.coerce.number().optional(),
  tipo: z.enum(['Fixo', 'Variável']).nullable().optional(),
  url_pdf: z.string().url('URL inválida').or(z.literal('')).optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface ContaPagaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  conta: ContaPaga;
}

export function ContaPagaEditModal({
  isOpen,
  onClose,
  conta,
}: ContaPagaEditModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      beneficiario_nome: conta.beneficiario_nome || '',
      pagador_nome: conta.pagador_nome || '',
      data_vencimento: conta.data_vencimento ? new Date(conta.data_vencimento).toISOString().split('T')[0] : '',
      data_pagamento: conta.data_pagamento ? new Date(conta.data_pagamento).toISOString().split('T')[0] : '',
      valor_documento: conta.valor_documento || 0,
      juros_multa: conta.juros_multa || 0,
      desconto_abatimento: conta.desconto_abatimento || 0,
      valor_pago: conta.valor_pago || 0,
      tipo: conta.tipo || undefined,
      url_pdf: conta.url_pdf || '',
    },
  });

  // Resetar o formulário quando os dados da conta mudam ou o modal abre
  useEffect(() => {
    if (isOpen) {
      form.reset({
        beneficiario_nome: conta.beneficiario_nome || '',
        pagador_nome: conta.pagador_nome || '',
        data_vencimento: conta.data_vencimento ? new Date(conta.data_vencimento).toISOString().split('T')[0] : '',
        data_pagamento: conta.data_pagamento ? new Date(conta.data_pagamento).toISOString().split('T')[0] : '',
        valor_documento: conta.valor_documento || 0,
        juros_multa: conta.juros_multa || 0,
        desconto_abatimento: conta.desconto_abatimento || 0,
        valor_pago: conta.valor_pago || 0,
        tipo: conta.tipo || undefined,
        url_pdf: conta.url_pdf || '',
      });
    }
  }, [isOpen, conta, form]);

  const onSubmit = async (data: EditFormData) => {
    setIsSubmitting(true);
    
    // Convert empty strings to null for optional logic
    const payload = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    const result = await atualizarContaPaga(conta.id, payload);

    setIsSubmitting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Conta atualizada com sucesso');
      router.refresh();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta Paga</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiario_nome">Beneficiário / Fornecedor</Label>
              <Input id="beneficiario_nome" {...form.register('beneficiario_nome')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pagador_nome">Pagador / Fonte</Label>
              <Input id="pagador_nome" {...form.register('pagador_nome')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data Vencimento</Label>
              <Input type="date" id="data_vencimento" {...form.register('data_vencimento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_pagamento">Data Pagamento</Label>
              <Input type="date" id="data_pagamento" {...form.register('data_pagamento')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_documento">Valor Documento</Label>
              <Input 
                type="number" 
                step="0.01" 
                id="valor_documento" 
                {...form.register('valor_documento')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_pago">Valor Pago</Label>
              <Input 
                type="number" 
                step="0.01" 
                id="valor_pago" 
                {...form.register('valor_pago')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="juros_multa">Juros/Multa</Label>
              <Input 
                type="number" 
                step="0.01" 
                id="juros_multa" 
                {...form.register('juros_multa')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desconto_abatimento">Desconto</Label>
              <Input 
                type="number" 
                step="0.01" 
                id="desconto_abatimento" 
                {...form.register('desconto_abatimento')} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Despesa</Label>
              <Select
                value={form.watch('tipo') || ''}
                onValueChange={(value) => form.setValue('tipo', value as 'Fixo' | 'Variável')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Variável">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="url_pdf">URL do PDF (Comprovante)</Label>
              <Input id="url_pdf" {...form.register('url_pdf')} placeholder="https://..." />
              {form.formState.errors.url_pdf && (
                <span className="text-sm text-destructive">{form.formState.errors.url_pdf.message}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
