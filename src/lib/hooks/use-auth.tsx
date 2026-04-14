'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PerfilUsuario } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'atendente' | 'motorista' | null;
  nome: string | null;
  perfil: PerfilUsuario | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // useRef garante referência estável ao cliente Supabase:
  // - Não recria o cliente a cada render (evita re-subscribe no onAuthStateChange)
  // - client.ts retorna null no servidor (build time) para evitar erros com envs vazias
  // - No browser, sempre retorna o cliente real
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    mountedRef.current = true;

    // Não inicia subscrição se executando no servidor durante build
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const authUser = session.user;
            
            // Set basic user state immediately from session
            setUser(prev => {
              if (prev?.id === authUser.id && prev?.perfil) return prev;
              return {
                id: authUser.id,
                email: authUser.email || '',
                role: authUser.user_metadata?.role || null,
                nome: authUser.user_metadata?.nome || authUser.email?.split('@')[0] || null,
                perfil: prev?.perfil || null,
              };
            });
            
            setIsLoading(false);

            // Fetch missing profile data
            try {
              const { data: perfil } = await supabase
                .from('perfis_usuarios')
                .select('*')
                .eq('id', authUser.id)
                .single();

              if (mountedRef.current && perfil) {
                setUser(prev => 
                  prev ? { 
                    ...prev, 
                    perfil, 
                    role: perfil.role || prev.role, 
                    nome: perfil.nome || prev.nome 
                  } : null
                );
              }
            } catch (error) {
              console.error('Erro ao buscar perfil do usuário:', error);
            }
          } else {
            setUser(null);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabase é singleton — array vazio é intencional

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: new Error('Cliente Supabase não disponível') };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    try {
      // scope:'global' invalida a sessão no servidor Supabase,
      // garantindo que o cookie SSR seja rejeitado mesmo antes de expirar
      await supabase.auth.signOut({ scope: 'global' });
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    } finally {
      setUser(null);
      // Limpa todo storage local para evitar estado residual
      // que causa sidebar travada em produção (standalone/Docker)
      try {
        if (typeof window !== 'undefined') {
          // Remove chaves do Supabase do localStorage
          Object.keys(localStorage)
            .filter((k) => k.startsWith('sb-'))
            .forEach((k) => localStorage.removeItem(k));
        }
      } catch {
        // Ignora se localStorage não estiver disponível
      }
    }
  };

  const refreshUser = async () => {
    if (!supabase || !user?.id) return;
    setIsLoading(true);
    try {
      const { data: perfil } = await supabase
        .from('perfis_usuarios')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (perfil) {
        setUser(prev => 
          prev ? { 
            ...prev, 
            perfil, 
            role: perfil.role || prev.role, 
            nome: perfil.nome || prev.nome 
          } : null
        );
      }
    } catch (error) {
      console.error('Erro ao recarregar perfil:', error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
