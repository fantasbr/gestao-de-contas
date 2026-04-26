-- =============================================================================
-- MIGRATION: 005_fix_rls_soft_delete
-- Descrição: Corrige políticas RLS que bloqueavam soft-delete na contas_pagar
--
-- Causa do erro "new row violates row-level security policy":
--   Quando o UPDATE seta deleted_at, o PostgreSQL valida a linha resultante
--   usando a cláusula USING (quando WITH CHECK não é definida explicitamente).
--   Isso faz a política de SELECT (deleted_at IS NULL) conflitar com o UPDATE.
--
-- Solução: Recriar as políticas com WITH CHECK explícito e separar a política
--   de SELECT em dois níveis (usuários normais / admin+atendente).
-- =============================================================================

-- 1. Remover políticas antigas de contas_pagar
DROP POLICY IF EXISTS "Todos podem ver contas ativas" ON contas_pagar;
DROP POLICY IF EXISTS "Usuários autenticados podem criar" ON contas_pagar;
DROP POLICY IF EXISTS "Admin e atendente podem atualizar" ON contas_pagar;
DROP POLICY IF EXISTS "Admin pode deletar" ON contas_pagar;

-- 2. SELECT: usuários comuns só veem contas ativas
CREATE POLICY "Usuários veem contas ativas" ON contas_pagar
  FOR SELECT USING (deleted_at IS NULL);

-- 3. SELECT: admin e atendente veem todas (incluindo excluídas)
CREATE POLICY "Admin e atendente veem todas as contas" ON contas_pagar
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM perfis_usuarios
      WHERE id = auth.uid() AND role IN ('admin', 'atendente')
    )
  );

-- 4. INSERT: qualquer usuário autenticado pode criar
CREATE POLICY "Usuários autenticados podem criar" ON contas_pagar
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. UPDATE: admin e atendente podem atualizar qualquer linha (incluindo soft-delete)
--    WITH CHECK explícito garante que a nova linha não seja rejeitada pelo PostgreSQL
CREATE POLICY "Admin e atendente podem atualizar" ON contas_pagar
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis_usuarios
      WHERE id = auth.uid() AND role IN ('admin', 'atendente')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis_usuarios
      WHERE id = auth.uid() AND role IN ('admin', 'atendente')
    )
  );

-- 6. DELETE (hard delete): apenas admin
CREATE POLICY "Admin pode deletar" ON contas_pagar
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM perfis_usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
