'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'atendente', 'motorista'],
  },
  {
    title: 'Contas a Pagar',
    href: '/contas',
    icon: Receipt,
    roles: ['admin', 'atendente', 'motorista'],
  },
  {
    title: 'Contas Pagas',
    href: '/contas-pagas',
    icon: BadgeCheck,
    roles: ['admin', 'atendente'],
  },
  {
    title: 'Conciliação',
    href: '/conciliacao',
    icon: ArrowLeftRight,
    roles: ['admin', 'atendente'],
  },
  {
    title: 'Fornecedores',
    href: '/fornecedores',
    icon: Users,
    roles: ['admin', 'atendente'],
  },
  {
    title: 'Categorias',
    href: '/categorias',
    icon: Tags,
    roles: ['admin'],
  },
  {
    title: 'Empresas',
    href: '/empresas',
    icon: Building2,
    roles: ['admin', 'atendente'],
  },
  {
    title: 'Relatórios',
    href: '/relatorios',
    icon: FileBarChart,
    roles: ['admin', 'atendente'],
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, refreshUser } = useAuth();

  const userRole = user?.role || '';
  const userName = user?.nome || user?.email || '';

  useEffect(() => {
    if (user && !user.role) {
      refreshUser();
    }
  }, [user?.id, user?.role, refreshUser]);

  const filteredMenu = menuItems.filter(
    (item) => item.roles.includes(userRole)
  );

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <aside className="flex flex-col w-64 h-screen bg-card border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-xl font-bold text-primary">Contas a Pagar</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {userRole || 'Carregando...'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </aside>
  );
}

