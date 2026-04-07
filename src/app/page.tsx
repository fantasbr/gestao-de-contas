'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const supabase = createClient();

  useEffect(() => {
    // Verificação rápida de sessão
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    };

    checkAuth();
  }, [supabase]);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Carregando...</p>
    </main>
  );
}
