# Próximos Passos - Sistema de Contas a Pagar

**Última atualização:** Janeiro 2025

---

## 1. ANTES DO DEPLOY (Crítico)

### 1.1 Executar Migrations no Supabase

```bash
# Acesse o Supabase SQL Editor e execute:

# 1. supabase/migrations/001_contas_pagar.sql
# 2. supabase/migrations/002_webhooks_log.sql
```

### 1.2 Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env.local
cp .env.example .env.local
```

Preencha com suas credenciais:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico

# AWS S3 (opcional para upload)
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nome-do-bucket

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 1.3 Criar Perfil do Primeiro Usuário

```sql
-- Após criar usuário no Supabase Auth, execute:
INSERT INTO public.perfis_usuarios (id, role, nome)
VALUES ('seu-user-uuid', 'admin', 'Nome do Admin');
```

### 1.4 Verificar Rota de Upload

```bash
# Verificar se existe: src/app/api/upload/route.ts
# Se não existir, criar manualmente:
# mkdir -p src/app/api/upload
```

---

## 2. CORREÇÕES CRÍTICAS

### 2.1 Corrigir Middleware de Autenticação

**Arquivo:** `middleware.ts`

```typescript
// Substituir o conteúdo por:

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Verificar se usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser();

  return response;
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Rotas protegidas
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/contas') ||
    pathname.startsWith('/fornecedores') ||
    pathname.startsWith('/categorias') ||
    pathname.startsWith('/empresas') ||
    pathname.startsWith('/configuracoes') ||
    pathname.startsWith('/relatorios');

  const isAuthRoute = pathname.startsWith('/login');

  // Proteger rotas
  if (isProtectedRoute && pathname !== '/login') {
    const { data: { user } } = await createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    ).auth.getUser();

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Redirecionar login para dashboard se já autenticado
  if (isAuthRoute) {
    const { data: { user } } = await createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    ).auth.getUser();

    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 2.2 Adicionar Validação de Data de Pagamento

**Arquivo:** `src/app/(dashboard)/contas/[id]/page.tsx`

No `handlePagar`, adicionar:

```typescript
const handlePagar = async () => {
  // Validar data não futura
  if (new Date(dataPagamento) > new Date()) {
    toast.error('Data de pagamento não pode ser futura');
    return;
  }
  
  // Validar data não muito antiga (opcional)
  const umAnoAtras = new Date();
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1);
  if (new Date(dataPagamento) < umAnoAtras) {
    toast.error('Data de pagamento muito antiga');
    return;
  }

  const result = await registrarPagamento(conta!.id, dataPagamento);
  // ...
};
```

---

## 3. MELHORIAS RECOMENDADAS (Pós-Deploy)

### 3.1 Adicionar Campos de Pix ao Fornecedor

```sql
-- Executar no Supabase:

ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS chave_pix VARCHAR(255),
ADD COLUMN IF NOT EXISTS tipo_pix VARCHAR(20);
-- 'cpf', 'cnpj', 'email', 'telefone', 'aleatoria'
```

### 3.2 Criar Trigger para Status Vencido

```sql
-- Executar no Supabase:

CREATE OR REPLACE FUNCTION public.atualizar_status_vencido()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Se status ainda está pendente e venceu
    IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
      NEW.status := 'vencido';
    END IF;
    -- Se estava vencido e foi pago
    IF NEW.status = 'pago' THEN
      NEW.data_pagamento := COALESCE(NEW.data_pagamento, CURRENT_DATE);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Se novo registro já venceu
    IF NEW.status = 'pendente' AND NEW.data_vencimento < CURRENT_DATE THEN
      NEW.status := 'vencido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_vencido
  BEFORE INSERT OR UPDATE ON public.contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_status_vencido();
```

### 3.3 Adicionar Índices Compostos

```sql
-- Executar no Supabase:

CREATE INDEX IF NOT EXISTS idx_contas_status_vencimento 
  ON public.contas_pagar(status, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_contas_fornecedor_status 
  ON public.contas_pagar(fornecedor_id, status);
```

---

## 4. CONFIGURAÇÕES DO SUPABASE

### 4.1 Autenticação

1. Acesse **Authentication** > **Providers**
2. Configure **Email** provider
3. Ative **Confirm email** (opcional)
4. Configure redirect URLs:
   - `https://seu-dominio.com/login-confirmed`

### 4.2 Storage (se usar Supabase Storage em vez de S3)

1. Crie bucket `contas`
2. Configure políticas de acesso
3. URLs públicas ou assinadas

### 4.3 Row Level Security

Certifique-se que RLS está habilitado nas tabelas:

```sql
-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 5. DEPLOY NO VERCEL

### 5.1 Configurar Vercel

```bash
# Login
npx vercel login

# Deploy
npx vercel

# Deploy em produção
npx vercel --prod
```

### 5.2 Variáveis de Ambiente na Vercel

Configure no Dashboard da Vercel:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço |
| `AWS_ACCESS_KEY_ID` | Chave AWS (se usar S3) |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS |
| `AWS_REGION` | Região do S3 |
| `AWS_S3_BUCKET` | Nome do bucket |
| `NEXT_PUBLIC_APP_URL` | URL de produção |

### 5.3 Configurar Domain (opcional)

1. Vercel Dashboard > Settings > Domains
2. Adicionar domínio customizado
3. Atualizar no Supabase:
   - Authentication > URL Configuration
   - Site URL
   - Redirect URLs

---

## 6. TESTES

### 6.1 Checklist de Testes

- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Logout funciona
- [ ] Acesso não autenticado redireciona
- [ ] CRUD de contas completo
- [ ] Upload de PDF
- [ ] Marcar como conferido
- [ ] Registrar pagamento
- [ ] Detecção de duplicatas
- [ ] CRUD de fornecedores
- [ ] CRUD de categorias
- [ ] Configurar webhooks
- [ ] Ver logs de webhooks
- [ ] Exportar CSV
- [ ] Permissões por role funcionando

### 6.2 Testar em Mobile

- [ ] Layout responsivo
- [ ] Navegação funcional
- [ ] Formulários usáveis

---

## 7. DOCUMENTAÇÃO COMPLEMENTAR

### 7.1 Para novos desenvolvedores

Criar arquivo `CONTRIBUTING.md`:

```markdown
# Contribuindo

## Setup Local

1. Clone o repositório
2. Copie `.env.example` para `.env.local`
3. Configure as variáveis
4. Execute `npm install`
5. Execute `npm run dev`

## Estrutura do Projeto

- `src/app` - Rotas (App Router)
- `src/components` - Componentes React
- `src/hooks` - Custom hooks
- `src/lib` - Bibliotecas
- `src/types` - Tipos TypeScript

## Convenções

- Commits: conventional commits
- Branches: feature/, fix/, hotfix/
- PRs: Required reviews
```

### 7.2 Para usuários finais

Criar arquivo `MANUAL.md` com:
- Como fazer login
- Como cadastrar conta
- Como marcar como pago
- Como configurar webhooks
- FAQ

---

## 8. CRONOGRAMA SUGERIDO

| Semana | Tarefas |
|--------|---------|
| **1** | Deploy inicial + Correções críticas |
| **2** | Testes + Ajustes de UX |
| **3** | Melhorias (gráficos, máscaras) |
| **4** | Polish + Documentação |

---

## 9. CONTATOS ÚTEIS

| Serviço | Link |
|---------|------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel | https://vercel.com |
| Docs Next.js | https://nextjs.org/docs |
| Docs Supabase | https://supabase.com/docs |

---

**Documento mantido por:** Desenvolvimento  
**Versão:** 1.0  
**Última revisão:** Janeiro 2025
