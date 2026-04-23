// Tipos do banco de dados

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StatusConta = 'pendente' | 'pago' | 'vencido' | 'cancelado';
export type StatusProcessamento = 'pendente' | 'enviado' | 'processando' | 'processado' | 'erro';
export type RoleUsuario = 'admin' | 'atendente' | 'motorista';
export type TipoPix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
export type TipoDespesa = 'Fixo' | 'Variável';

// =============================================================================
// Tabelas do banco
// =============================================================================

export interface Database {
  public: {
    Tables: {
      perfis_usuarios: {
        Row: {
          id: string;
          role: RoleUsuario | null;
          nome: string | null;
        };
        Insert: {
          id: string;
          role?: RoleUsuario | null;
          nome?: string | null;
        };
        Update: {
          role?: RoleUsuario | null;
          nome?: string | null;
        };
        Relationships: [];
      };

      empresas: {
        Row: {
          id_empresa: number;
          nome: string;
          cnpj: string;
          created_at: string | null;
        };
        Insert: {
          nome: string;
          cnpj: string;
          created_at?: string | null;
        };
        Update: {
          nome?: string;
          cnpj?: string;
        };
        Relationships: [];
      };

      categorias: {
        Row: {
          id: string;
          nome: string;
          cor: string | null;
          created_at: string | null;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          cor?: string | null;
          created_at?: string | null;
          created_by?: string | null;
        };
        Update: {
          nome?: string;
          cor?: string | null;
        };
        Relationships: [];
      };

      fornecedores: {
        Row: {
          id: string;
          nome: string;
          cnpj_cpf: string | null;
          contato: string | null;
          email: string | null;
          telefone: string | null;
          banco: string | null;
          agencia: string | null;
          conta: string | null;
          tipo_conta: string | null;
          chave_pix: string | null;
          tipo_pix: TipoPix | null;
          observacoes: string | null;
          created_at: string | null;
          created_by: string | null;
          updated_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj_cpf?: string | null;
          contato?: string | null;
          email?: string | null;
          telefone?: string | null;
          banco?: string | null;
          agencia?: string | null;
          conta?: string | null;
          tipo_conta?: string | null;
          chave_pix?: string | null;
          tipo_pix?: TipoPix | null;
          observacoes?: string | null;
          created_by?: string | null;
        };
        Update: {
          nome?: string;
          cnpj_cpf?: string | null;
          contato?: string | null;
          email?: string | null;
          telefone?: string | null;
          banco?: string | null;
          agencia?: string | null;
          conta?: string | null;
          tipo_conta?: string | null;
          chave_pix?: string | null;
          tipo_pix?: TipoPix | null;
          observacoes?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };

      fornecedores_log: {
        Row: {
          id: string;
          fornecedor_id: string;
          acao: string;
          dados_anteriores: Json | null;
          dados_novos: Json | null;
          realizado_por: string | null;
          realizado_em: string | null;
        };
        Insert: {
          id?: string;
          fornecedor_id: string;
          acao: string;
          dados_anteriores?: Json | null;
          dados_novos?: Json | null;
          realizado_por?: string | null;
        };
        Update: {};
        Relationships: [];
      };

      contas_pagar: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          descricao: string;
          valor: number;
          data_vencimento: string;
          data_pagamento: string | null;
          status: StatusConta;
          status_processamento: StatusProcessamento;
          mensagem_erro: string | null;
          fornecedor_id: string | null;
          categoria_id: string | null;
          empresa_pagadora_id: number | null;
          conferido: boolean;
          conferido_por: string | null;
          conferido_em: string | null;
          observacao_conferido: string | null;
          created_by: string | null;
          url_pdf_original: string | null;
          url_comprovante_pagamento: string | null;
          numero_documento: string | null;
          linha_digitavel: string | null;
          codigo_barras: string | null;
          favorecido_nome: string | null;
          favorecido_cnpj_cpf: string | null;
          pagador_nome: string | null;
          pagador_cnpj_cpf: string | null;
          data_documento: string | null;
          data_vencimento_original: string | null;
          observacoes: string | null;
          webhook_enviado_em: string | null;
          webhook_confirmado_em: string | null;
          webhook_id_envio: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          descricao: string;
          valor: number;
          data_vencimento: string;
          status?: StatusConta;
          status_processamento?: StatusProcessamento;
          fornecedor_id?: string | null;
          categoria_id?: string | null;
          empresa_pagadora_id?: number | null;
          created_by?: string | null;
          url_pdf_original?: string | null;
          numero_documento?: string | null;
          linha_digitavel?: string | null;
          codigo_barras?: string | null;
          favorecido_nome?: string | null;
          favorecido_cnpj_cpf?: string | null;
          pagador_nome?: string | null;
          pagador_cnpj_cpf?: string | null;
          data_documento?: string | null;
          data_vencimento_original?: string | null;
          observacoes?: string | null;
        };
        Update: {
          descricao?: string;
          valor?: number;
          data_vencimento?: string;
          data_pagamento?: string | null;
          status?: StatusConta;
          status_processamento?: StatusProcessamento;
          mensagem_erro?: string | null;
          fornecedor_id?: string | null;
          categoria_id?: string | null;
          empresa_pagadora_id?: number | null;
          conferido?: boolean;
          conferido_por?: string | null;
          conferido_em?: string | null;
          observacao_conferido?: string | null;
          url_pdf_original?: string | null;
          url_comprovante_pagamento?: string | null;
          numero_documento?: string | null;
          linha_digitavel?: string | null;
          codigo_barras?: string | null;
          favorecido_nome?: string | null;
          favorecido_cnpj_cpf?: string | null;
          pagador_nome?: string | null;
          pagador_cnpj_cpf?: string | null;
          data_documento?: string | null;
          data_vencimento_original?: string | null;
          observacoes?: string | null;
          webhook_enviado_em?: string | null;
          webhook_confirmado_em?: string | null;
          webhook_id_envio?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };

      contaspagas: {
        Row: {
          id: number;
          beneficiario_nome: string | null;
          pagador_nome: string | null;
          data_vencimento: string | null;
          data_pagamento: string | null;
          valor_documento: number | null;
          juros_multa: number | null;
          desconto_abatimento: number | null;
          valor_pago: number | null;
          url_pdf: string | null;
          n8n: string | null;
          created_at: string | null;
          tipo: TipoDespesa | null;
          identificador: string | null;
          descricao: string | null;
        };

        Insert: {
          id?: number;
          beneficiario_nome?: string | null;
          pagador_nome?: string | null;
          data_vencimento?: string | null;
          data_pagamento?: string | null;
          valor_documento?: number | null;
          juros_multa?: number | null;
          desconto_abatimento?: number | null;
          valor_pago?: number | null;
          url_pdf?: string | null;
          n8n?: string | null;
          created_at?: string | null;
          tipo?: TipoDespesa | null;
          identificador?: string | null;
          descricao?: string | null;
        };
        Update: {
          id?: number;
          beneficiario_nome?: string | null;
          pagador_nome?: string | null;
          data_vencimento?: string | null;
          data_pagamento?: string | null;
          valor_documento?: number | null;
          juros_multa?: number | null;
          desconto_abatimento?: number | null;
          valor_pago?: number | null;
          url_pdf?: string | null;
          n8n?: string | null;
          created_at?: string | null;
          tipo?: TipoDespesa | null;
          identificador?: string | null;
          descricao?: string | null;
        };
        Relationships: [];
      };

      app_webhooks: {
        Row: {
          id: string;
          nome_evento: string;
          url_webhook: string;
          ativo: boolean | null;
          descricao: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome_evento: string;
          url_webhook: string;
          ativo?: boolean | null;
          descricao?: string | null;
        };
        Update: {
          nome_evento?: string;
          url_webhook?: string;
          ativo?: boolean | null;
          descricao?: string | null;
        };
        Relationships: [];
      };

      api_configuracoes: {
        Row: {
          id: number;
          api_token: string | null;
        };
        Insert: {
          id?: number;
          api_token?: string | null;
        };
        Update: {
          api_token?: string | null;
        };
        Relationships: [];
      };

      webhooks_log: {
        Row: {
          id: string;
          webhook_id: string | null;
          conta_id: string | null;
          tipo: string | null;
          payload: Json | null;
          resposta: Json | null;
          status: string | null;
          codigo_http: number | null;
          tempo_resposta_ms: number | null;
          tentativa: number;
          criado_em: string | null;
        };
        Insert: {
          id?: string;
          webhook_id?: string | null;
          conta_id?: string | null;
          tipo?: string | null;
          payload?: Json | null;
          resposta?: Json | null;
          status?: string | null;
          codigo_http?: number | null;
          tempo_resposta_ms?: number | null;
          tentativa?: number;
        };
        Update: {
          payload?: Json | null;
          resposta?: Json | null;
          status?: string | null;
          codigo_http?: number | null;
          tempo_resposta_ms?: number | null;
          tentativa?: number;
        };
        Relationships: [];
      };

      contas_log: {
        Row: {
          id: string;
          conta_id: string;
          acao: string;
          dados_anteriores: Json | null;
          dados_novos: Json | null;
          realizado_por: string | null;
          realizado_em: string | null;
        };
        Insert: {
          id?: string;
          conta_id: string;
          acao: string;
          dados_anteriores?: Json | null;
          dados_novos?: Json | null;
          realizado_por?: string | null;
        };
        Update: {};
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// =============================================================================
// Tipos auxiliares para uso no frontend
// =============================================================================

export type PerfilUsuario = Database['public']['Tables']['perfis_usuarios']['Row'];
export type Empresa = Database['public']['Tables']['empresas']['Row'];
export type Categoria = Database['public']['Tables']['categorias']['Row'];
export type Fornecedor = Database['public']['Tables']['fornecedores']['Row'];
export type FornecedorLog = Database['public']['Tables']['fornecedores_log']['Row'];
export type ContaPagar = Database['public']['Tables']['contas_pagar']['Row'];
export type AppWebhook = Database['public']['Tables']['app_webhooks']['Row'];
export type ApiConfiguracao = Database['public']['Tables']['api_configuracoes']['Row'];
export type WebhookLog = Database['public']['Tables']['webhooks_log']['Row'];
export type ContaLog = Database['public']['Tables']['contas_log']['Row'];
export type ContaPaga = Database['public']['Tables']['contaspagas']['Row'];

// =============================================================================
// Tipos com relações (para selects mais completos)
// =============================================================================

export interface ContaPagarComRelacionamentos extends ContaPagar {
  fornecedor?: Fornecedor | null;
  categoria?: Categoria | null;
  empresa?: Empresa | null;
  perfil_conferido?: PerfilUsuario | null;
  perfil_criado?: PerfilUsuario | null;
}

export interface FornecedorComContas extends Fornecedor {
  contas?: ContaPagar[];
  _count?: {
    contas: number;
  };
}
