'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks';

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Visão geral das contas' },
  '/contas': { title: 'Contas a Pagar' },
  '/contas/nova': { title: 'Nova Conta', subtitle: 'Contas a Pagar' },
  '/contas-pagas': { title: 'Contas Pagas' },
  '/conciliacao': { title: 'Conciliação Financeira' },
  '/fornecedores': { title: 'Fornecedores' },
  '/categorias': { title: 'Categorias' },
  '/empresas': { title: 'Empresas' },
  '/relatorios': { title: 'Relatórios' },
  '/configuracoes': { title: 'Configurações' },
};

function getPageInfo(path: string) {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  for (const [route, info] of Object.entries(PAGE_TITLES)) {
    if (path.startsWith(route + '/')) return info;
  }
  return { title: 'Dashboard' };
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pageInfo = getPageInfo(pathname);
  const displayName = user?.nome?.split(' ')[0] || user?.email || '';
  const initials = getInitials(user?.nome || user?.email || '');

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
      <div>
        <h2 className="text-base font-semibold text-foreground leading-none">
          {pageInfo.title}
        </h2>
        {pageInfo.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{pageInfo.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
          {initials}
        </div>
        {displayName && (
          <span className="text-sm text-muted-foreground hidden sm:block">
            {displayName}
          </span>
        )}
      </div>
    </header>
  );
}
