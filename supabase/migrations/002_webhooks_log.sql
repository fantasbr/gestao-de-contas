-- =============================================================================
-- MIGRATION: 002_webhooks_log
-- Descrição: Cria tabelas de log de webhooks e auditoria
-- =============================================================================

-- Tabela de log de webhooks
CREATE TABLE IF NOT EXISTS public.webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES app_webhooks(id),
  conta_id UUID REFERENCES contas_pagar(id),
  tipo VARCHAR(50),
  payload JSONB,
  resposta JSONB,
  status VARCHAR(20),
  codigo_http INTEGER,
  tempo_resposta_ms INTEGER,
  tentativa INT DEFAULT 1,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_log_status ON webhooks_log(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_criado ON webhooks_log(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_webhooks_log_conta ON webhooks_log(conta_id);

-- Tabela de log de auditoria das contas
CREATE TABLE IF NOT EXISTS public.contas_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID REFERENCES contas_pagar(id) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  realizado_por UUID REFERENCES auth.users(id),
  realizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contas_log_conta ON contas_log(conta_id);
CREATE INDEX IF NOT EXISTS idx_contas_log_acao ON contas_log(acao);
CREATE INDEX IF NOT EXISTS idx_contas_log_data ON contas_log(realizado_em DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Habilitar RLS
ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_log ENABLE ROW LEVEL SECURITY;

-- Políticas para webhooks_log
CREATE POLICY "Admin acessa logs" ON webhooks_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Sistema insere logs" ON webhooks_log
  FOR INSERT WITH CHECK (true);

-- Políticas para contas_log
CREATE POLICY "Admin e atendente veem logs" ON contas_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role IN ('admin', 'atendente'))
  );

CREATE POLICY "Sistema insere logs" ON contas_log
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para contas_pagar
DROP TRIGGER IF EXISTS update_contas_pagar_updated_at ON contas_pagar;
CREATE TRIGGER update_contas_pagar_updated_at
  BEFORE UPDATE ON contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para fornecedores
DROP TRIGGER IF EXISTS update_fornecedores_updated_at ON fornecedores;
CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- SEED: Webhooks padrão
-- =============================================================================

INSERT INTO public.app_webhooks (nome_evento, url_webhook, ativo, descricao) VALUES
  ('conta_cadastro', 'https://seu-n8n.exemplo.com/webhook/conta-cadastro', true, 'Webhook para processar novos cadastros de conta (OCR)')
ON CONFLICT (nome_evento) DO NOTHING;

INSERT INTO public.app_webhooks (nome_evento, url_webhook, ativo, descricao) VALUES
  ('conta_pagamento', 'https://seu-n8n.exemplo.com/webhook/conta-pagamento', true, 'Webhook para processar pagamentos')
ON CONFLICT (nome_evento) DO NOTHING;

INSERT INTO public.app_webhooks (nome_evento, url_webhook, ativo, descricao) VALUES
  ('notificacao', 'https://seu-n8n.exemplo.com/webhook/notificacao', true, 'Webhook para enviar notificações via WhatsApp')
ON CONFLICT (nome_evento) DO NOTHING;

-- =============================================================================
-- SEED: Configuração API (token)
-- =============================================================================

INSERT INTO public.api_configuracoes (id, api_token) VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;
