// Tipos para autenticação
import type { PerfilUsuario } from './database';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'atendente' | 'motorista' | null;
  nome: string | null;
  perfil: PerfilUsuario | null;
}

export interface Session {
  user: User;
  expires_at: number;
}
