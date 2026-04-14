# Contas a Pagar

Sistema interno para controle e gestão de contas a pagar da empresa.

## Tecnologias

- **Frontend:** Next.js 16.2.1 (App Router + Turbopack)
- **React:** 19.1
- **Estilização:** Tailwind CSS v4 + shadcn/ui
- **Backend:** Supabase (Auth + Database)
- **Automação:** n8n
- **Armazenamento:** AWS S3

## Requisitos

- Node.js 20.9+ (Recomendado 22+)
- npm ou yarn
- Projeto Supabase configurado
- AWS S3 bucket (opcional, para armazenamento de arquivos)

## Instalação

### 1. Clone o repositório

```bash
git clone <repo-url>
cd contas
```

### 2. Copie o arquivo de variáveis de ambiente

```bash
cp .env.example .env.local
```

### 3. Configure as variáveis de ambiente

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# AWS S3 (opcional, para upload de arquivos)
AWS_ACCESS_KEY_ID=sua-access-key
AWS_SECRET_ACCESS_KEY=sua-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=nome-do-bucket

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada server-side; use apenas via secret do host/CI | Somente se o backend realmente consumir |
| `AWS_ACCESS_KEY_ID` | Chave de acesso AWS | Opcional |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS | Opcional |
| `AWS_REGION` | Região do S3 (ex: us-east-1) | Opcional |
| `AWS_S3_BUCKET` | Nome do bucket S3 | Opcional |
| `NEXT_PUBLIC_APP_URL` | URL da aplicação | ✅ |

### 4. Configure o banco de dados

Execute os scripts SQL do diretório `supabase/migrations` no seu Supabase.

### 5. Instale as dependências

```bash
npm install
```

### 6. Execute o servidor de desenvolvimento

```bash
npm run dev
```

### 7. Acesse a aplicação

Abra [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia o servidor de desenvolvimento

# Produção
npm run build        # Build da aplicação
npm run start        # Inicia o servidor de produção

# Qualidade de código
npm run lint         # Executa o linter ESLint
```

## Estrutura do Projeto

```
src/
├── app/                          # App Router (páginas e layouts)
│   ├── (auth)/                   # Rotas de autenticação
│   │   └── login/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # Rotas protegidas (dashboard)
│   │   ├── layout.tsx            # Layout com sidebar
│   │   ├── page.tsx             # Dashboard
│   │   ├── contas/              # CRUD de contas
│   │   ├── fornecedores/        # CRUD de fornecedores
│   │   ├── categorias/          # Gerenciamento de categorias
│   │   ├── empresas/             # Gerenciamento de empresas
│   │   ├── configuracoes/        # Configurações do sistema
│   │   └── relatorios/           # Relatórios
│   │
│   └── api/                     # API Routes
│       ├── contas/
│       ├── fornecedores/
│       ├── webhooks/
│       └── upload/
│
├── components/                   # Componentes React
│   ├── ui/                      # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── layout/                  # Layout components
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   │
│   └── shared/                  # Componentes compartilhados
│
├── lib/                         # Bibliotecas e utilitários
│   ├── supabase/                # Cliente Supabase
│   │   ├── client.ts           # Client-side
│   │   ├── server.ts           # Server-side
│   │   └── middleware.ts       # Middleware de autenticação
│   │
│   ├── utils.ts                 # Funções utilitárias
│   └── s3.ts                   # Cliente S3
│
├── hooks/                       # Custom Hooks
│   ├── use-auth.ts
│   └── use-contas.ts
│
└── types/                       # Definições de tipos
    ├── database.ts              # Tipos do banco
    └── auth.ts                  # Tipos de autenticação
```

## Documentação

- [PRD](./prd.md) - Especificação do produto
- [Revisão](./REVISAO.md) - Revisões e correções
- [Docker](./DOCKER.md) - Guia de implantação com Docker Swarm

## Implantação Docker

### Rápido

```bash
# 1. Configurar secrets
cd secrets
cp *.example *.txt
nano *.txt

# 2. Deploy
./scripts/deploy.sh
```

### Detalhes

Consulte [DOCKER.md](./DOCKER.md) para instruções completas de:
- Configuração de Docker Secrets
- Deploy em produção
- Traefik como proxy reverso
- Monitoring e troubleshooting

## Permissões por Role

| Funcionalidade | Admin | Atendente | Motorista |
|---------------|-------|-----------|-----------|
| Dashboard | ✅ | ✅ | ✅ |
| Contas a Pagar | ✅ | ✅ | ✅ |
| Fornecedores | ✅ | ✅ | ❌ |
| Categorias | ✅ | ❌ | ❌ |
| Empresas | ✅ | ✅ | ❌ |
| Webhooks | ✅ | ❌ | ❌ |
| Relatórios | ✅ | ✅ | ❌ |

## Fluxo de Desenvolvimento

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
3. Push para a branch: `git push origin feature/minha-feature`
4. Abra um Pull Request

## Licença

Privado - Uso interno.
