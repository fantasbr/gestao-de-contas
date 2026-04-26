-- =============================================================================
-- MIGRATION: 006_conciliacao
-- Descrição: Adiciona campos de rastreabilidade para conciliação financeira
--            entre contas_pagar e contaspagas
-- =============================================================================

-- 1. Adicionar referência em contas_pagar → contaspagas
ALTER TABLE contas_pagar
  ADD COLUMN IF NOT EXISTS conta_paga_id INTEGER REFERENCES contaspagas(id);

-- 2. Adicionar campos de conciliação em contaspagas
ALTER TABLE contaspagas
  ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES contas_pagar(id);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_contas_pagar_conta_paga_id ON contas_pagar(conta_paga_id);
CREATE INDEX IF NOT EXISTS idx_contaspagas_conciliado       ON contaspagas(conciliado);
