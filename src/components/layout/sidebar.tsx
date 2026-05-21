'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  BadgeCheck,
  Users,
  Tags,
  Building2,
  Settings,
  FileBarChart,
  LogOut,
  ArrowLeftRight,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'atendente'],
    group: 'Visão Geral',
  },
  {
    title: 'Contas a Pagar',
    href: '/contas',
    icon: Receipt,
    roles: ['admin', 'atendente'],
    group: 'Gestão',
  },
  {
    title: 'Contas Pagas',
    href: '/contas-pagas',
    icon: BadgeCheck,
    roles: ['admin', 'atendente'],
    group: 'Gestão',
  },
  {
    title: 'Conciliação',
    href: '/conciliacao',
    icon: ArrowLeftRight,
    roles: ['admin', 'atendente'],
    group: 'Gestão',
  },
  {
    title: 'Fornecedores',
    href: '/fornecedores',
    icon: Users,
    roles: ['admin', 'atendente'],
    group: 'Gestão',
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: Tags,
    roles: ['admin'],
    group: 'Sistema',
  },
  {
    title: 'Empresas',
    href: '/empresas',
    icon: Building2,
    roles: ['admin', 'atendente'],
    group: 'Sistema',
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: FileBarChart,
    roles: ['admin', 'atendente'],
    group: 'Sistema',
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['admin'],
    group: 'Sistema',
  },
];

const menuGroups = ['Visão Geral', 'Gestão', 'Sistema'];

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut, refreshUser } = useAuth();

  const userRole = user?.role || '';
  const userName = user?.nome || user?.email || '';

  useEffect(() => {
    if (user && !user.role) {
      refreshUser();
    }
  }, [user?.id, user?.role, refreshUser]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="flex flex-col w-52 h-screen bg-card border-r">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <Receipt className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-foreground">Contas a Pagar</span>
          <span className="text-xs text-muted-foreground">Gestão Financeira</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {menuGroups.map((groupName, groupIndex) => {
          const groupItems = menuItems.filter(
            (item) => item.group === groupName && item.roles.includes(userRole)
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={groupName}>
              {groupIndex > 0 && (
                <div className="my-3 border-t border-border/50" />
              )}
              <p className="px-3 mb-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                {groupName}
              </p>
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <div key={item.href} className="relative">
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
                      )}
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150',
                          isActive
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isActive && 'text-primary'
                          )}
                        />
                        {item.title}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors duration-150">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate leading-none">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {userRole || '...'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
