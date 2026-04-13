# PRD - Sistema de Controle de Contas a Pagar

## 1. Visão Geral

**Objetivo:** Sistema interno para controle e gestão de contas a pagar da empresa  
**Público:** Funcionários internos (admin, atendentes, motoristas)  
**Stack:** Next.js 16 (Turbopack) + React 19 + Tailwind CSS v4 + Supabase + n8n + AWS S3

---

## 2. Arquitetura do Sistema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Usuário   │────▶│   Next.js   │────▶│  Supabase   │
│  (Browser)  │◀────│   (Frontend)│◀────│  (Database)│
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           │ Webhook
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │     n8n     │────▶│  AWS S3     │
                    │(Automação)  │     │(Arquivos)   │
                    └──────┬──────┘     └─────────────┘
                           │
                           │ Notificação
                           ▼
                    ┌─────────────┐
                    │  WhatsApp   │
                    │   (API)     │
                    └─────────────┘
```

---

## 3. Estrutura do Database

### 3.1 Tabela `perfis_usuarios` (existente)

```sql
create table public.perfis_usuarios (
  id uuid not null,
  role character varying(20) null,
  nome character varying(100) null,
  constraint perfis_usuarios_pkey primary key (id),
  constraint perfis_usuarios_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint perfis_usuarios_role_check check (
    role in ('admin', 'atendente', 'motorista')
  )
);
```

### 3.2 Tabela `empresas` (existente)

```sql
create table public.empresas (
  id_empresa bigint generated always as identity not null,
  nome character varying(255) not null,
  cnpj character varying(18) not null,
  created_at timestamp with time zone null default now(),
  constraint empresas_pkey primary key (id_empresa),
  constraint empresas_cnpj_key unique (cnpj)
) TABLESPACE pg_default;
```
> **Uso:** Armazena os 3 CNPJs da empresa e dos sócios para identificar o pagador do boleto.

### 3.3 Tabela `contas_pagar`

```sql
CREATE TABLE public.contas_pagar (
  -- Identificação
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
  -- 'pendente' → Enviado para n8n
  -- 'processando' → n8n processando
  -- 'processado' → Cadastrado com sucesso
  -- 'erro' → Falha no processamento
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
  
  -- Dados do favorecido (quem recebe o pagamento)
  favorecido_nome VARCHAR(255),
  favorecido_cnpj_cpf VARCHAR(20),
  
  -- Dados do pagador (empresa/sócio que vai pagar)
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
CREATE INDEX idx_contas_status ON contas_pagar(status);
CREATE INDEX idx_contas_status_processamento ON contas_pagar(status_processamento);
CREATE INDEX idx_contas_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX idx_contas_created_by ON contas_pagar(created_by);
CREATE INDEX idx_contas_fornecedor ON contas_pagar(fornecedor_id);
CREATE INDEX idx_contas_empresa ON contas_pagar(empresa_pagadora_id);
CREATE INDEX idx_contas_codigo_barras ON contas_pagar(codigo_barras);
CREATE INDEX idx_contas_linha_digitavel ON contas_pagar(linha_digitavel);
CREATE INDEX idx_contas_conferido ON contas_pagar(conferido);

-- Row Level Security
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

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
```

### 3.4 Tabela `categorias`

```sql
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) UNIQUE NOT NULL,
  cor VARCHAR(7) DEFAULT '#6B7280',
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem categorias" ON categorias
  FOR SELECT USING (true);

CREATE POLICY "Admin gerencia categorias" ON categorias
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role = 'admin')
  );
```

### 3.5 Tabela `fornecedores`

```sql
CREATE TABLE public.fornecedores (
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
  -- 'corrente', 'poupanca'
  chave_pix VARCHAR(100),      -- Chave PIX (CPF, CNPJ, email, telefone, aleatória)
  tipo_pix VARCHAR(20),        -- 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria'
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj_cpf);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem fornecedores ativos" ON fornecedores
  FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Admin e atendente gerenciam" ON fornecedores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role IN ('admin', 'atendente'))
  );
```

### 3.6 Tabela `app_webhooks` (existente)

```sql
create table public.app_webhooks (
  id uuid not null default gen_random_uuid (),
  nome_evento character varying(100) not null,
  url_webhook text not null,
  ativo boolean null default true,
  descricao text null,
  created_at timestamp with time zone null default now(),
  constraint app_webhooks_pkey primary key (id),
  constraint app_webhooks_nome_evento_key unique (nome_evento)
) TABLESPACE pg_default;
```
> **Uso:** Cadastrar URLs dos webhooks para integração com n8n (ex: `conta_cadastro`, `conta_pagamento`, `notificacao`).

### 3.7 Tabela `api_configuracoes` (existente)

```sql
create table public.api_configuracoes (
  id integer not null default 1,
  api_token text null,
  constraint api_configuracoes_pkey primary key (id)
) TABLESPACE pg_default;
```
> **Uso:** Armazenar o token de autenticação para comunicação com o n8n.

### 3.8 Tabela `webhooks_log`

```sql
CREATE TABLE public.webhooks_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES app_webhooks(id),
  conta_id UUID REFERENCES contas_pagar(id),
  tipo VARCHAR(50),
  -- 'envio_n8n', 'retorno_n8n', 'notificacao'
  payload JSONB,
  resposta JSONB,
  status VARCHAR(20),
  -- 'pendente', 'sucesso', 'erro', 'timeout'
  codigo_http INTEGER,
  tempo_resposta_ms INTEGER,
  tentativa INT DEFAULT 1,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_log_status ON webhooks_log(status);
CREATE INDEX idx_webhooks_log_criado ON webhooks_log(criado_em DESC);
CREATE INDEX idx_webhooks_log_conta ON webhooks_log(conta_id);

ALTER TABLE webhooks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin acessa logs" ON webhooks_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Sistema insere logs" ON webhooks_log
  FOR INSERT WITH CHECK (true);
```

### 3.8 Tabela `contas_log` (Auditoria)

```sql
CREATE TABLE public.contas_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conta_id UUID REFERENCES contas_pagar(id) NOT NULL,
  acao VARCHAR(50) NOT NULL,
  -- 'criado', 'editado', 'conferido', 'pago', 'cancelado', 'enviado_n8n', 'recebido_n8n'
  dados_anteriores JSONB,
  dados_novos JSONB,
  realizado_por UUID REFERENCES auth.users(id),
  realizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contas_log_conta ON contas_log(conta_id);
CREATE INDEX idx_contas_log_acao ON contas_log(acao);
CREATE INDEX idx_contas_log_data ON contas_log(realizado_em DESC);

ALTER TABLE contas_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e atendente veem logs" ON contas_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM perfis_usuarios WHERE id = auth.uid() AND role IN ('admin', 'atendente'))
  );

CREATE POLICY "Sistema insere logs" ON contas_log
  FOR INSERT WITH CHECK (true);
```

---

## 4. Permissões por Role

| Funcionalidade | Admin | Atendente | Motorista |
|---------------|-------|-----------|-----------|
| **Dashboard** | ✅ | ✅ | ✅ |
| **Contas a Pagar** | | | |
| Listar Contas | ✅ | ✅ | ✅ |
| Upload PDF (cadastro) | ✅ | ✅ | ✅ |
| Ver Detalhes | ✅ | ✅ | ✅ |
| Editar Conta | ✅ | ✅ | ❌ |
| Marcar como Paga | ✅ | ✅ | ❌ |
| Upload Comprovante | ✅ | ✅ | ❌ |
| Excluir Conta | ✅ | ❌ | ❌ |
| Conferir Conta | ✅ | ✅ | ❌ |
| **Fornecedores** | | | |
| Listar/Ver | ✅ | ✅ | ❌ |
| Criar/Editar | ✅ | ✅ | ❌ |
| Excluir | ✅ | ❌ | ❌ |
| **Categorias** | | | |
| CRUD Completo | ✅ | ❌ | ❌ |
| **Webhooks** | | | |
| CRUD Configurações | ✅ | ❌ | ❌ |
| Ver Logs | ✅ | ❌ | ❌ |
| Reenviar Webhook | ✅ | ❌ | ❌ |
| **Relatórios** | | | |
| Ver Relatórios | ✅ | ✅ | ❌ |
| Exportar Dados | ✅ | ✅ | ❌ |
| **Sistema** | | | |
| Gerenciar Usuários | ✅ | ❌ | ❌ |
| Configurações Gerais | ✅ | ❌ | ❌ |

---

## 5. Fluxos do Sistema

### 5.1 Fluxo: Cadastro de Nova Conta

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │     │   /api/upload │     │     n8n      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Upload PDF      │                    │
       │───────────────────►│                    │
       │                    │ 2. base64          │
       │                    │ 3. POST webhook    │
       │                    │───────────────────►│
       │                    │                    │ 4. OCR/Extract
       │                    │                    │ 5. Upload S3
       │                    │                    │ 6. POST /api/contas
       │◄────────────────────│◄───────────────────│
       │                    │                    │
       │ 7. "Enviado para   │                    │
       │    processamento!"  │                    │
       │                    │                    │
       │ (Admin/Atendente    │                    │
       │  confere dados)     │                    │
       │                    │                    │
       │ 8. Marca conferido  │                    │
       │───────────────────►│                    │
       │                    │ 9. Status: conferido│
       │                    └────────────────────┘
       │
       │ 10. Confirmação via WhatsApp
       │     (n8n → WhatsApp API)
       │
```

**Nota:** O arquivo é enviado em base64 via webhook. O n8n processa e faz upload no S3.

### 5.2 Fluxo: Registro de Pagamento

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuário    │     │   /api/upload │     │     n8n      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Seleciona conta │                    │
       │ 2. Upload comprov.  │                    │
       │───────────────────►│                    │
       │                    │ 3. base64          │
       │                    │ 4. POST webhook    │
       │                    │───────────────────►│
       │                    │                    │ 5. Upload S3
       │                    │                    │ 6. PATCH /pagamento
       │                    │                    │   (URL + data)
       │◄────────────────────│◄───────────────────│
       │                    │                    │
       │ 7. Status: pago    │                    │
       │                    │                    │
       │ 8. Notificação     │                    │
       │     WhatsApp       │                    │
       │◄────────────────────│                    │
       │                    │                    │
```

**Nota:** Tipos de arquivo aceitos para comprovante: PDF, JPEG, PNG (máx 10MB).

### 5.3 Fluxo: Detecção de Duplicata

```
n8n antes de cadastrar:

1. Verifica se já existe conta com:
   - mesmo fornecedor (ou CNPJ favorecido)
   - mesmo valor
   - mesma data de vencimento
   - mesmo código de barras (se disponível)

2. Se duplicata:
   - Marca como 'duplicata' 
   - Envia notificação para admin
   - NÃO cadastra automaticamente

3. Se não duplicata:
   - Cadastra normalmente
   - Status: 'processado'
```

---

## 6. API Endpoints

### 6.1 Contas

```
POST   /api/contas
  - Criar conta (via n8n após OCR)
  - Body: { descricao, valor, data_vencimento, fornecedor_id?, 
            categoria_id?, empresa_pagadora_id?, url_pdf_original,
            linha_digitavel?, codigo_barras?, favorecido_nome?,
            favorecido_cnpj_cpf?, pagador_nome?, pagador_cnpj_cpf?,
            data_documento?, data_vencimento_original? }
  - Retorno: { id, status_processamento: 'processado' }

GET    /api/contas
  - Listar contas com filtros
  - Query: ?status=&processamento=&conferido=&fornecedor=&categoria=
            &empresa=&data_inicio=&data_fim=&page=&limit=
  - Retorno: { data: [...], total, page, limit }

GET    /api/contas/[id]
  - Detalhe da conta

PATCH  /api/contas/[id]
  - Atualizar conta (Admin/Atendente)
  - Body: { descricao?, valor?, data_vencimento?, fornecedor_id?,
            categoria_id?, observacoes?, ... }

PATCH  /api/contas/[id]/conferir
  - Marcar como conferido
  - Body: { conferido: true, observacao_conferido? }

PATCH  /api/contas/[id]/pagamento
  - Registrar pagamento (via n8n)
  - Body: { data_pagamento, url_comprovante_pagamento }

DELETE /api/contas/[id]
  - Soft delete (Admin)
```

### 6.2 Fornecedores

```
GET    /api/fornecedores
  - Listar fornecedores
  - Query: ?search=&page=&limit=

POST   /api/fornecedores
  - Criar fornecedor

GET    /api/fornecedores/[id]
  - Detalhe do fornecedor

PATCH  /api/fornecedores/[id]
  - Atualizar fornecedor

DELETE /api/fornecedores/[id]
  - Soft delete (Admin)
```

### 6.3 Categorias

```
GET    /api/categorias
  - Listar categorias

POST   /api/categorias
  - Criar categoria (Admin)

PATCH  /api/categorias/[id]
  - Atualizar categoria (Admin)

DELETE /api/categorias/[id]
  - Deletar categoria (Admin)
```

### 6.4 Empresas

```
GET    /api/empresas
  - Listar empresas (pagadores)

POST   /api/empresas
  - Criar empresa (Admin)

PATCH  /api/empresas/[id]
  - Atualizar empresa (Admin)

DELETE /api/empresas/[id]
  - Deletar empresa (Admin)
```

### 6.5 Webhooks (usa `app_webhooks`)

```
GET    /api/webhooks
  - Listar webhooks cadastrados
  - Retorna: { id, nome_evento, url_webhook, ativo, descricao }

POST   /api/webhooks
  - Criar webhook (Admin)
  - Body: { nome_evento, url_webhook, ativo?, descricao? }

GET    /api/webhooks/[id]
  - Detalhe do webhook

PATCH  /api/webhooks/[id]
  - Atualizar webhook (Admin)

DELETE /api/webhooks/[id]
  - Deletar webhook (Admin)

POST   /api/webhooks/forward
  - Encaminhar arquivo para n8n
  - Busca URL em app_webhooks pelo nome_evento
  - Usa api_token de api_configuracoes para autenticação
  - Body: { nome_evento, arquivo_base64?, mime_type?, conta_id? }

GET    /api/webhooks/logs
  - Listar logs de webhooks
  - Query: ?webhook_id=&status=&data_inicio=&data_fim=

POST   /api/webhooks/resend/[log_id]
  - Reenviar webhook (Admin)
```

### 6.6 Upload

```
POST   /api/upload
  - Upload de arquivo (PDF, imagem)
  - Body: FormData com arquivo
  - Retorno: { url, filename }
```

### 6.7 Configurações (usa `api_configuracoes`)

```
GET    /api/config
  - Obter token API configurado (Admin)
  - Retorna: { api_token: "***" }

PATCH  /api/config
  - Atualizar token API (Admin)
  - Body: { api_token }
```

---

## 7. Estrutura de Pastas

```
contas/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   │
│   │   │   ├── contas/
│   │   │   │   ├── page.tsx                # Lista de contas
│   │   │   │   ├── nova/page.tsx           # Upload PDF (nova conta)
│   │   │   │   ├── [id]/page.tsx            # Detalhe da conta
│   │   │   │   └── [id]/pagar/page.tsx     # Registrar pagamento
│   │   │   │
│   │   │   ├── fornecedores/
│   │   │   │   ├── page.tsx                # Lista de fornecedores
│   │   │   │   ├── novo/page.tsx            # Novo fornecedor
│   │   │   │   └── [id]/page.tsx            # Detalhe do fornecedor
│   │   │   │
│   │   │   ├── categorias/
│   │   │   │   └── page.tsx                # Gerenciar categorias
│   │   │   │
│   │   │   ├── empresas/
│   │   │   │   ├── page.tsx                # Lista de empresas
│   │   │   │   └── [id]/page.tsx           # Detalhe da empresa
│   │   │   │
│   │   │   ├── configuracoes/
│   │   │   │   ├── page.tsx                # Configurações gerais + Token API
│   │   │   │   ├── webhooks/page.tsx       # Gerenciar webhooks (app_webhooks)
│   │   │   │   ├── logs/page.tsx           # Logs de webhooks
│   │   │   │   └── usuarios/page.tsx       # Gerenciar usuários
│   │   │   │
│   │   │   └── relatorios/
│   │   │       └── page.tsx                # Relatórios
│   │   │
│   │   ├── api/
│   │   │   ├── contas/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── conferir/
│   │   │   │       │   └── route.ts
│   │   │   │       └── pagamento/
│   │   │   │           └── route.ts
│   │   │   ├── fornecedores/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── categorias/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── empresas/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── forward/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logs/
│   │   │   │   │   └── route.ts
│   │   │   │   └── resend/
│   │   │   │       └── [log_id]/
│   │   │   │           └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── stats-card.tsx
│   │   │   ├── chart-gastos.tsx
│   │   │   └── recent-accounts.tsx
│   │   │
│   │   ├── contas/
│   │   │   ├── account-form.tsx
│   │   │   ├── account-list.tsx
│   │   │   ├── account-filters.tsx
│   │   │   ├── account-detail.tsx
│   │   │   ├── upload-pdf.tsx
│   │   │   └── status-badge.tsx
│   │   │
│   │   ├── fornecedores/
│   │   │   ├── fornecedor-form.tsx
│   │   │   ├── fornecedor-list.tsx
│   │   │   └── fornecedor-detail.tsx
│   │   │
│   │   ├── webhooks/
│   │   │   ├── webhook-form.tsx
│   │   │   ├── webhook-list.tsx
│   │   │   └── webhook-logs.tsx
│   │   │
│   │   └── shared/
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       ├── empty-state.tsx
│   │       ├── confirm-dialog.tsx
│   │       └── file-upload.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Client-side Supabase
│   │   │   ├── server.ts          # Server-side Supabase
│   │   │   └── middleware.ts      # Auth middleware
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts          # API client
│   │   │   ├── contas.ts
│   │   │   ├── fornecedores.ts
│   │   │   ├── webhooks.ts
│   │   │   └── upload.ts
│   │   │
│   │   ├── s3.ts                  # AWS S3 client
│   │   ├── utils.ts               # Utilitários
│   │   └── validators/
│   │       ├── contas.ts
│   │       └── fornecedores.ts
│   │
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-contas.ts
│   │   ├── use-fornecedores.ts
│   │   └── use-webhooks.ts
│   │
│   ├── types/
│   │   ├── database.ts            # Tipos do banco
│   │   ├── contas.ts
│   │   ├── fornecedores.ts
│   │   ├── webhooks.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── middleware.ts                  # Proteção de rotas
├── .env.local                     # Variáveis de ambiente
├── next.config.js
├── tailwind.config.ts
├── components.json                # shadcn/ui config
└── package.json
```

---

## 8. Variáveis de Ambiente

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# AWS S3
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nome-do-bucket

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Nota:** O `api_token` para autenticação no n8n é armazenado na tabela `api_configuracoes`, não em variáveis de ambiente.

---

## 9. Funcionalidades por Fase

### Fase 1: Setup e Autenticação
- [ ] Criar projeto Next.js 14+ (App Router)
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Configurar Supabase Client (client + server)
- [ ] Implementar autenticação (login/logout)
- [ ] Criar middleware de proteção de rotas
- [ ] Criar layout base com sidebar
- [ ] **Criar todas as tabelas no Supabase com RLS**
- [ ] Seed inicial de categorias padrão

### Fase 2: Core - Dashboard e Contas
- [ ] Dashboard com métricas
- [ ] Listar contas com filtros
- [ ] Detalhe da conta
- [ ] Upload de PDF para nova conta
- [ ] Endpoint POST /api/contas (recebe do n8n)
- [ ] Marcar conta como conferida
- [ ] Editar conta

### Fase 3: Core - Pagamentos
- [ ] Registrar pagamento de conta
- [ ] Upload de comprovante
- [ ] Endpoint PATCH /api/contas/[id]/pagamento
- [ ] Listar contas pagas

### Fase 4: Fornecedores e Empresas
- [ ] CRUD de fornecedores
- [ ] CRUD de empresas (pagadores)
- [ ] Vincular conta a fornecedor/empresa

### Fase 5: Webhooks e Integração n8n
- [ ] CRUD de configurações de webhook
- [ ] Endpoint POST /api/webhooks/forward
- [ ] Endpoint POST /api/upload
- [ ] Endpoint GET /api/webhooks/logs
- [ ] Tela de logs de webhooks
- [ ] Botão para reenviar webhook
- [ ] Tabela de auditoria (contas_log)

### Fase 6: Relatórios
- [ ] Relatório mensal
- [ ] Relatório por período
- [ ] Relatório por fornecedor
- [ ] Exportar para CSV
- [ ] Gráficos de tendência

### Fase 7: Configurações
- [ ] CRUD de categorias
- [ ] CRUD de webhooks
- [ ] Gerenciamento de usuários
- [ ] Configurações gerais

### Fase 8: Deploy e Extras
- [ ] Deploy no Vercel
- [ ] Notificações de erro
- [ ] Documentação
- [ ] Testes básicos

---

## 10. Decisões de Negócio

| Item | Decisão |
|------|---------|
| Cadastro de conta | Automático via n8n (OCR) |
| Validação | Campo "conferido" para usuário marcar |
| Duplicatas | Verifica: fornecedor + valor + vencimento + pagador |
| Notificações | Via webhook → n8n → WhatsApp API |
| Integração bancária | Não haverá |
| Armazenamento | AWS S3 para PDFs e comprovantes |
| Auditoria | Tabela `contas_log` registra todas alterações |
| Webhooks | Usa tabela `app_webhooks` existente |
| Token n8n | Armazenado na tabela `api_configuracoes` |

---

## 11. Glossário

| Termo | Descrição |
|-------|-----------|
| **Fornecedor** | Empresa/sócio favorecido do pagamento (credor) |
| **Pagador** | Empresa/sócio que está pagando (empresa do grupo) |
| **Linha Digitável** | Sequência numérica do boleto (47-48 dígitos) |
| **Código de Barras** | Código do boleto (44 dígitos) |
| **Conferido** | Marca se o usuário validou os dados extraídos pelo OCR |
| **app_webhooks** | Tabela com URLs dos webhooks (nome_evento, url_webhook, ativo) |
| **api_configuracoes** | Tabela com token de autenticação do n8n |
| **arquivo_base64** | Arquivo codificado em base64 para envio via webhook |

---

## 12. CHANGELOG

### Versão 1.3 (Janeiro 2025)
- ✅ Configuração Docker Swarm com Secrets
- ✅ Dockerfile multi-stage otimizado
- ✅ Scripts de deploy e backup
- ✅ Proxy reverso Traefik com rate limiting
- ✅ Healthchecks e auto-scaling configurado

### Versão 1.2 (Janeiro 2025)
- ✅ Adicionadas máscaras de formatação e validação de CNPJ/CPF
- ✅ Adicionado tratamento de erros nos logs de auditoria
- ✅ Corrigido exibição de quem conferiu a conta
- ✅ Adicionados campos PIX na tabela de fornecedores

### Versão 1.1 (Janeiro 2025)
- ✅ Corrigido fluxo de upload: agora envia base64 para n8n (não mais URL)
- ✅ Adicionado validação de data de pagamento (não pode ser futura)
- ✅ Implementado upload de comprovante de pagamento
- ✅ Corrigido middleware de autenticação

### Versão 1.0 (Janeiro 2025)
- Versão inicial do documento
- Autor: Desenvolvimento Interno

---

**Versão:** 1.3  
**Data:** Janeiro 2025  
**Última Atualização:** Janeiro 2025  
**Autor:** Desenvolvimento Interno
