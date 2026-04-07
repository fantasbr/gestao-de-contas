'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
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
  const supabase = createClient();
  const perfilLoadedRef = useRef(false);

  // Função para carregar usuário de forma otimizada
  const loadUser = useCallback(async (skipPerfil = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setUser(null);
        return;
      }

      const authUser = session.user;

      let perfil: PerfilUsuario | null = null;
      
      if (!skipPerfil) {
        const { data } = await supabase
          .from('perfis_usuarios')
          .select('*')
          .eq('id', authUser.id)
          .single();
        perfil = data;
        perfilLoadedRef.current = true;
      }

      setUser((prev) => {
        // Evita atualizações desnecessárias se os dados não mudaram
        if (prev?.id === authUser.id && (skipPerfil || prev?.perfil)) {
            // Apenas atualiza se o perfil foi carregado e não tínhamos antes
            if (!skipPerfil && !prev.perfil && perfil) {
                 return { ...prev, perfil };
            }
            return prev;
        }

        return {
          id: authUser.id,
          email: authUser.email || '',
          role: perfil?.role || authUser.user_metadata?.role || null,
          nome: perfil?.nome || authUser.user_metadata?.nome || authUser.email?.split('@')[0] || null,
          perfil,
        };
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Inicialização apenas na montagem para evitar loop infinito
  useEffect(() => {
    let mounted = true;

    const inicializar = async () => {
      if (!mounted) return;
      await loadUser(true); // Carga rápida sem perfil
      
      if (mounted) {
        // Busca o perfil em segundo plano após a renderização inicial
        setTimeout(() => {
          if (mounted) loadUser(false);
        }, 500);
      }
    };

    inicializar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const { data: perfil } = await supabase
            .from('perfis_usuarios')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: perfil?.role || session.user.user_metadata?.role || null,
            nome: perfil?.nome || session.user.user_metadata?.nome || null,
            perfil,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    setIsLoading(true);
    await loadUser(false);
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
