import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StatusConta, StatusProcessamento } from '@/types/database';

interface StatusBadgeProps {
  status: StatusConta;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<StatusConta, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }> = {
    pendente: { label: 'Pendente', variant: 'warning' },
    pago: { label: 'Pago', variant: 'success' },
    vencido: { label: 'Vencido', variant: 'destructive' },
    cancelado: { label: 'Cancelado', variant: 'secondary' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return (
    <Badge variant={config.variant} className={cn('capitalize', className)}>
      {config.label}
    </Badge>
  );
}

interface ProcessamentoBadgeProps {
  status: StatusProcessamento;
  className?: string;
}

export function ProcessamentoBadge({ status, className }: ProcessamentoBadgeProps) {
  const statusConfig: Record<StatusProcessamento, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' }> = {
    pendente: { label: 'Pendente', variant: 'secondary' },
    enviado: { label: 'Enviado', variant: 'default' },
    processando: { label: 'Processando', variant: 'warning' },
    processado: { label: 'Processado', variant: 'success' },
    erro: { label: 'Erro', variant: 'destructive' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' as const };

  return (
    <Badge variant={config.variant} className={cn('capitalize text-xs', className)}>
      {config.label}
    </Badge>
  );
}
