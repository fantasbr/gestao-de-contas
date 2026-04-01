'use client';

import { AuthProvider } from '@/lib/hooks';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
