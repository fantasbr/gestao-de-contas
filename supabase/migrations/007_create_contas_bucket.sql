-- =============================================================
-- MIGRATION 007: Criar bucket de storage para contas
-- =============================================================

-- Criar bucket público para armazenar arquivos de contas (NFs, boletos, etc)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos_contas',
  'documentos_contas',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Policy para permitir upload de arquivos (usuários autenticados)
CREATE POLICY "Permitir upload de arquivos de contas para usuários autenticados"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos_contas');

-- Policy para permitir leitura de arquivos (público)
CREATE POLICY "Permitir leitura pública de arquivos de contas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documentos_contas');

-- Policy para permitir atualização de arquivos (apenas owner)
CREATE POLICY "Permitir atualização de arquivos de contas apenas pelo proprietário"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos_contas' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy para permitir exclusão de arquivos (apenas owner)
CREATE POLICY "Permitir exclusão de arquivos de contas apenas pelo proprietário"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documentos_contas' AND auth.uid()::text = (storage.foldername(name))[1]);
