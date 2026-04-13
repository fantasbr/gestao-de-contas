'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na página de contas:', error);
  }, [error]);

  return (
    <>
      <Header />
      <div className="flex-1 p-6">
        <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/20">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Ops! Erro ao carregar contas</h2>
          <p className="text-muted-foreground max-w-[500px]">
            {error.message || 'Ocorreu um erro inesperado ao carregar as contas.'}
          </p>
          <div className="mt-4 flex gap-4">
            <Button onClick={() => reset()} variant="default">
              Tentar Novamente
            </Button>
            <Button asChild variant="outline">
              <Link href="/contas">Voltar para Contas</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
