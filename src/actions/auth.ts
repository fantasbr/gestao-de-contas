/**
 * Server Actions para autenticação
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  nome: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
  needsConfirmation?: boolean;
}

/**
 * Login com email e senha
 */
export async function login(input: LoginInput): Promise<ActionResult> {
  const { email, password } = input;

  if (!email || !password) {
    return { success: false, error: 'Email e senha são obrigatórios' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Erro no login:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');

  return { success: true };
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Registrar novo usuário (se enabled)
 */
export async function register(input: RegisterInput): Promise<ActionResult> {
  const { email, password, nome } = input;

  if (!email || !password || !nome) {
    return { success: false, error: 'Todos os campos são obrigatórios' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
      },
    },
  });

  if (error) {
    console.error('Erro no registro:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    needsConfirmation: true,
  };
}

/**
 * Verificar sessão atual (para Server Components)
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

/**
 * Verificar usuário atual
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: perfil } = await supabase.from('perfis_usuarios').select('*').eq('id', user.id).single();

  return {
    ...user,
    perfil,
  };
}
