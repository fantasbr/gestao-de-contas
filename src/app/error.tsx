'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aqui você pode logar o erro para um serviço como o Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-red-100 p-6 dark:bg-red-900/20">
        <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight">Ops! Algo deu errado</h2>
      <p className="text-muted-foreground max-w-[500px]">
        Ocorreu um erro inesperado na aplicação. Já fomos notificados, mas você pode tentar novamente.
      </p>
      <div className="mt-4 flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Tentar Novamente
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
