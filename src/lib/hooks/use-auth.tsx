'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

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

              if (mounted && perfil) {
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
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
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
      setIsLoading(false);
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
