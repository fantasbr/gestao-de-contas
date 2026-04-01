-- =============================================================================
-- MIGRATION: 004_adicionar_indice_deleted_at
-- Descrição: Adiciona índice na coluna deleted_at para melhorar performance
-- =============================================================================

-- Índice para queries com soft delete (todas as tabelas)
CREATE INDEX IF NOT EXISTS idx_contas_deleted_at ON contas_pagar(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fornecedores_deleted_at ON fornecedores(deleted_at);
