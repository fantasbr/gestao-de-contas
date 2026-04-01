-- =============================================================================
-- MIGRATION: 001_contas_pagar
-- Descrição: Cria a tabela de controle de contas a pagar
-- =============================================================================

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) UNIQUE NOT NULL,
  cor VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj_cpf VARCHAR(20),
  contato VARCHAR(100),
  email VARCHAR(255),
  telefone VARCHAR(20),
  banco VARCHAR(50),
  agencia VARCHAR(20),
  conta VARCHAR(30),
  tipo_conta VARCHAR(20),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabela principal de contas a pagar
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados principais
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  
  -- Status do processamento via webhook
  status_processamento VARCHAR(30) DEFAULT 'pendente',
  mensagem_erro TEXT,
  
  -- Relacionamentos
  fornecedor_id UUID REFERENCES fornecedores(id),
  categoria_id UUID REFERENCES categorias(id),
  empresa_pagadora_id BIGINT REFERENCES empresas(id_empresa),
  
  -- Validação do usuário
  conferido BOOLEAN DEFAULT false,
  conferido_por UUID REFERENCES auth.users(id),
  conferido_em TIMESTAMP WITH TIME ZONE,
  observacao_conferido TEXT,
  
  -- Controle de acesso
  created_by UUID REFERENCES auth.users(id),
  
  -- Arquivos (S3)
  url_pdf_original VARCHAR(500),
  url_comprovante_pagamento VARCHAR(500),
  
  -- Dados do boleto (extraídos pelo n8n via OCR)
  numero_documento VARCHAR(50),
  linha_digitavel VARCHAR(50),
  codigo_barras VARCHAR(50),
  
  -- Dados do favorecido
  favorecido_nome VARCHAR(255),
  favorecido_cnpj_cpf VARCHAR(20),
  
  -- Dados do pagador
  pagador_nome VARCHAR(255),
  pagador_cnpj_cpf VARCHAR(20),
  
  -- Datas do boleto
  data_documento DATE,
  data_vencimento_original DATE,
  
  -- Observações
  observacoes TEXT,
  
  -- Controle de webhook
  webhook_enviado_em TIMESTAMP,
  webhook_confirmado_em TIMESTAMP,
  webhook_id_envio UUID,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Constraints
ALTER TABLE contas_pagar ADD CONSTRAINT status_contas_check 
  CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado'));

ALTER TABLE contas_pagar ADD CONSTRAINT status_processamento_check 
  CHECK (status_processamento IN ('pendente', 'enviado', 'processando', 'processado', 'erro'));

-- Índices
CREATE INDEX IF NOT EXISTS idx_contas_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_status_processamento ON contas_pagar(status_processamento);
CREATE INDEX IF NOT EXISTS idx_contas_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_created_by ON contas_pagar(created_by);
CREATE INDEX IF NOT EXISTS idx_contas_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_contas_empresa ON contas_pagar(empresa_pagadora_id);
CREATE INDEX IF NOT EXISTS idx_contas_codigo_barras ON contas_pagar(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_contas_linha_digitavel ON contas_pagar(linha_digitavel);
CREATE INDEX IF NOT EXISTS idx_contas_conferido ON contas_pagar(conferido);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON fornecedores(cnpj_cpf);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Habilitar RLS
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Políticas para contas_pagar
CREATE POLICY "Todos podem ver contas ativas" ON contas_pagar
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Usuários autenticados podem criar" ON contas_pagar
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin e atendente podem atualizar" ON contas_pagar
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role IN ('admin', 'atendente'))
  );

CREATE POLICY "Admin pode deletar" ON contas_pagar
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para categorias
CREATE POLICY "Todos veem categorias" ON categorias
  FOR SELECT USING (true);

CREATE POLICY "Admin gerencia categorias" ON categorias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para fornecedores
CREATE POLICY "Todos veem fornecedores ativos" ON fornecedores
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Admin e atendente gerenciam" ON fornecedores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role IN ('admin', 'atendente'))
  );

-- =============================================================================
-- SEED: Categorias padrão
-- =============================================================================

INSERT INTO public.categorias (nome, cor) VALUES
  ('Luz', '#F59E0B'),
  ('Água', '#3B82F6'),
  ('Telefone/Internet', '#8B5CF6'),
  ('Aluguel', '#10B981'),
  ('Fornecedores', '#EF4444'),
  ('Impostos', '#6366F1'),
  ('Funcionários', '#EC4899'),
  ('Serviços', '#14B8A6'),
  ('Outros', '#6B7280')
ON CONFLICT (nome) DO NOTHING;
