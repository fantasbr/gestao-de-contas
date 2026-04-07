import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
        <FileQuestion className="h-10 w-10 text-slate-500 dark:text-slate-400" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight">Página não encontrada</h2>
      <p className="text-muted-foreground max-w-[500px]">
        Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido movida ou não existe mais.
      </p>
      <div className="mt-4 flex gap-4">
        <Button asChild>
          <Link href="/dashboard">
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  );
}
