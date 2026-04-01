-- =============================================================================
-- MIGRATION: 003_adicionar_pix_fornecedores
-- Descrição: Adiciona campos de PIX aos fornecedores
-- =============================================================================

-- Adicionar colunas de PIX na tabela fornecedores
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(100),
ADD COLUMN IF NOT EXISTS tipo_pix VARCHAR(20) DEFAULT NULL;

-- Tipo pode ser: 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria'

-- Adicionar constraint para validar tipo_pix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fornecedores_tipo_pix_check'
  ) THEN
    ALTER TABLE public.fornecedores
    ADD CONSTRAINT fornecedores_tipo_pix_check
    CHECK (tipo_pix IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria') OR tipo_pix IS NULL);
  END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN public.fornecedores.chave_pix IS 'Chave PIX do fornecedor (CPF, CNPJ, email, telefone ou chave aleatória)';
COMMENT ON COLUMN public.fornecedores.tipo_pix IS 'Tipo da chave PIX: cpf, cnpj, email, telefone ou aleatoria';

-- =============================================================================
-- SEED: Fornecedor de exemplo com PIX
-- =============================================================================
-- Descomente para adicionar um fornecedor de exemplo
-- INSERT INTO public.fornecedores (nome, cnpj_cpf, email, chave_pix, tipo_pix)
-- VALUES ('Fornecedor Exemplo', '12.345.678/0001-90', 'contato@exemplo.com', 'contato@exemplo.com', 'email');
