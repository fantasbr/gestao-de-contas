# Plano de Acao - Sistema de Contas a Pagar

## Status Atual

**Data da revisao:** 2026-05-03
**Versao do app:** 0.1.20
**Status geral:** Em uso/desenvolvimento, com modulos principais implementados e pendencias criticas de seguranca e consistencia de APIs.

Este documento foi atualizado para refletir o codigo atual do repositorio. Ele substitui o plano historico anterior, que estava desatualizado em relacao ao desenvolvimento real.

---

## Stack Real Do Projeto

- **Framework:** Next.js 16.2.1 com App Router
- **React:** 19.1
- **Runtime Docker:** Node.js 22 Alpine
- **Estilizacao:** Tailwind CSS 3.4.19 com shadcn/ui
- **Banco/Auth:** Supabase Auth + Supabase Database
- **Storage/documentos:** fluxo atual via n8n/S3 e bucket Supabase `documentos_contas` existente nas migrations
- **Automacao:** n8n via webhooks configuraveis
- **Deploy:** Docker/Swarm com Traefik, compose local/prod

Observacoes importantes:

- O codigo ainda usa `middleware.ts`. Nao existe migracao efetiva para `proxy.ts` neste repositorio.
- Tailwind esta na versao 3, nao na 4.
- O fluxo atual de upload envia arquivo em `base64` para o n8n. O app nao faz upload direto para S3 nessa rota.
- Endpoints externos de webhook/callback devem ser publicos, mas protegidos pelo API Token existente.
- Documentos financeiros podem continuar publicos; o controle de acesso fica a cargo do S3 ou Storage Supabase configurado.
- A role `motorista` nao deve ter acesso a nenhum modulo neste projeto.

---

## Modulos Implementados No Codigo

### Autenticacao e Layout

- Login com Supabase Auth.
- AuthProvider/hook `useAuth`.
- Sidebar com menu filtrado por role.
- Logout presente na Sidebar.
- Middleware protegendo rotas de pagina do dashboard.

### Dashboard

- Cards de metricas principais.
- KPIs adicionais de performance mensal.
- Pagina principal `/dashboard` renderizando `DashboardClient`.

### Contas a Pagar

- Listagem com filtros e paginacao.
- Criacao manual via Server Action.
- Upload de boleto para processamento via n8n.
- Detalhe da conta.
- Edicao no detalhe.
- Marcar como conferida.
- Registrar pagamento.
- Upload de comprovante via n8n.
- Exclusao logica para admin.
- Restauracao via Server Action existente.

### Fornecedores

- Listagem.
- Criacao, edicao e exclusao logica.
- Mascara/validacao de CNPJ/CPF.
- Campos PIX.
- Pagina de detalhe do fornecedor implementada.
- Listagem de contas vinculadas ao fornecedor.

### Categorias

- CRUD via interface.
- Restricao visual/Server Action para admin.

### Empresas

- Pagina de listagem implementada.
- Server Actions existem para criar, atualizar e excluir.
- Interface ainda e somente leitura; o CRUD completo pela UI nao esta entregue.

### Contas Pagas

- Modulo implementado, embora nao estivesse no plano antigo.
- Listagem com filtros.
- Detalhe.
- Edicao/exclusao via actions.
- Estatisticas de contas pagas.

### Conciliacao

- Modulo implementado, embora nao estivesse no plano antigo.
- Tela de conciliacao entre `contas_pagar` e `contaspagas`.
- Vincular/desvincular conciliacao via Server Actions.
- Score/sugestoes no frontend.

### Relatorios

- Relatorio por periodo/fornecedor.
- Exportacao CSV.
- Exportacao Excel ainda pendente.

### Configuracoes

- Pagina de configuracoes.
- Aba de webhooks.
- Aba de token API.
- Logs de webhooks.
- Gerenciamento de usuarios ainda pendente.

---

## Divergencias Encontradas Entre Plano Antigo E Codigo

### 1. Middleware/Proxy

O plano antigo dizia que `middleware.ts` havia migrado para `proxy.ts`. O codigo atual ainda usa `middleware.ts`.

**Acao:** manter documentacao e revisoes apontando para `middleware.ts` ate que uma migracao real seja feita.

### 2. Tailwind

O plano antigo dizia Tailwind v4.1. O `package.json` usa Tailwind 3.4.19.

**Acao:** considerar Tailwind v3 como estado real. So planejar v4 se for uma tarefa explicita de upgrade.

### 3. Webhooks

O plano antigo dizia:

- `POST /api/webhooks` para criar.
- `PATCH /api/webhooks/[id]` para editar.
- Apenas admin.

O codigo atual tem:

- `GET /api/webhooks`.
- `POST /api/webhooks/create`.
- `PUT /api/webhooks/[id]`.
- `DELETE /api/webhooks/[id]`.
- UI chama `POST/PATCH /api/webhooks`, o que nao bate com os handlers existentes.
- Handlers nao validam usuario/role explicitamente.

**Risco:** criacao/edicao de webhooks pode falhar e ha risco de seguranca se RLS permitir acesso.

### 4. Upload

O plano antigo dizia upload para AWS S3 e retorno de URL publica. O codigo atual converte o arquivo para `base64` e envia para o n8n.

**Acao:** documentar o fluxo real como: usuario -> `/api/upload` -> n8n -> S3/processamento -> callback para app.

### 5. RLS e Seguranca

O plano antigo dizia que as policies eram por role. O codigo SQL atual ainda possui leituras publicas/anÃ´nimas em algumas policies, como contas ativas, categorias e fornecedores.

**Risco:** dados financeiros e cadastrais podem ser lidos com a anon key se as policies estiverem aplicadas como nos arquivos.

### 6. Escopo Real

O plano antigo nao contemplava adequadamente:

- Contas Pagas.
- Conciliacao.
- Pagina de detalhe de fornecedor ja implementada.
- KPIs mensais no dashboard.

**Acao:** tratar esses modulos como parte oficial do sistema daqui em diante.

---

## Pendencias Criticas De Correcao

### Prioridade 0 - Seguranca

1. **Adicionar autenticacao explicita nas APIs usadas pela UI**
   - Criar helper server-side para `requireUser()`.
   - Criar helper para `requireRole()`.
   - Aplicar em APIs de contas, fornecedores, lookup, estatisticas, upload, configuracoes e webhooks.
   - Nao depender apenas do middleware, pois `/api/*` esta em grande parte fora do matcher.
   - **Status em 2026-05-03:** implementado no codigo para as APIs principais ja mapeadas. Ainda falta validar manualmente todos os fluxos da UI e revisar endpoints novos que possam ser criados.

2. **Aplicar autenticacao por API Token para webhooks/callbacks**
   - Endpoints externos do n8n devem permanecer publicos no roteamento.
   - Toda chamada externa deve exigir o token existente em `api_configuracoes.api_token`.
   - Validar `Authorization: Bearer <token>`.
   - A rotacao continua sendo feita pela aba existente "API Token".
   - Nao usar sessao Supabase de usuario para chamadas do n8n.
   - **Status em 2026-05-03:** implementado em `POST /api/contas` e `PATCH /api/contas/[id]/pagamento`.

3. **Corrigir RLS do Supabase**
   - Exigir `auth.uid() IS NOT NULL` em leituras sensiveis.
   - Revisar `contas_pagar`, `fornecedores`, `categorias`, `app_webhooks`, `api_configuracoes`, `webhooks_log`, `contas_log` e `contaspagas`.
   - Garantir que admin e atendente tenham exatamente os acessos esperados.
   - Garantir que motorista nao tenha acesso a nenhum modulo.

4. **Proteger configuracoes e webhooks por role admin**
   - `GET/PATCH /api/config` somente admin.
   - CRUD de webhooks somente admin.
   - Logs de webhooks somente admin.
   - **Status em 2026-05-03:** implementado nas APIs de configuracoes/webhooks e na pagina `/configuracoes`.

5. **Remover mass assignment**
   - Substituir `.insert(body)` e `.update(body)` por allowlists.
   - Bloquear campos internos como `created_by`, `deleted_at`, `created_at`, `updated_at`, `conferido_por`, `pago_por` e campos de auditoria.
   - Usar Zod ou validadores equivalentes nas rotas criticas.

6. **Reduzir dados sensiveis em logs**
   - Nao persistir `arquivo_base64` em `webhooks_log`.
   - Limitar corpo de resposta externa.
   - Redigir tokens, dados bancarios e payloads sensiveis quando possivel.

---

## Pendencias Altas De Execucao

1. **Corrigir contrato das rotas de webhooks**
   - Escolher um padrao:
     - `POST /api/webhooks` para criar e `PATCH /api/webhooks/[id]` para editar; ou
     - manter `POST /api/webhooks/create` e `PUT /api/webhooks/[id]`, ajustando a UI.
   - Recomendacao: usar REST convencional:
     - `GET /api/webhooks`
     - `POST /api/webhooks`
     - `GET /api/webhooks/[id]`
     - `PATCH /api/webhooks/[id]`
     - `DELETE /api/webhooks/[id]`

2. **Definir contrato n8n**
   - Payload de `conta_cadastro`.
   - Payload de `conta_pagamento`.
   - Endpoint de callback para criar conta.
   - Endpoint de callback para registrar pagamento.
   - Token esperado em `api_configuracoes.api_token`.
   - O API Token autoriza todos os eventos externos.
   - Header padrao: `Authorization: Bearer <token>`.

3. **Validar fluxo de iframe/CRM**
   - O middleware usa `frame-ancestors *` em redirects.
   - `next.config.mjs` restringe para `https://crm.brancaautoescola.com.br`.
   - Unificar CSP para evitar clickjacking sem quebrar o CRM.

4. **Revisar storage/documentos**
   - Bucket `documentos_contas` foi criado como publico na migration.
   - Documentos podem continuar publicos.
   - O controle de acesso deve ser feito pela configuracao do S3 ou Storage Supabase.
   - Nao planejar signed URLs neste momento.

5. **Alinhar Server Actions e APIs duplicadas**
   - Hoje existem operacoes feitas tanto por Server Actions quanto por API routes.
   - Recomendacao: usar Server Actions para mutations iniciadas pela UI autenticada.
   - Recomendacao: usar API routes para integracoes externas, callbacks n8n e upload multipart/base64.
   - Evitar duas implementacoes com regras de permissao divergentes.

---

## Melhorias Funcionais Pendentes

### Alta Prioridade

- CRUD completo de empresas na interface.
- Reenvio de webhook pela tela de logs.
- Gerenciamento de usuarios em `/configuracoes/usuarios`.
- Historico/timeline de alteracoes da conta.
- Testes manuais documentados para roles admin e atendente.
- Teste especifico garantindo que motorista nao acessa nenhum modulo.

### Media Prioridade

- Exportacao Excel (`xlsx`) em relatorios.
- Graficos no dashboard por categoria e tendencia mensal.
- Sidebar colapsavel/mobile.
- Paginacao configuravel: 10, 25, 50, 100.
- Empty states mais informativos.
- Melhorias de loading/skeleton em telas pesadas.

### Baixa Prioridade

- Favicon definitivo.
- Open Graph.
- Lazy loading de componentes especificos.
- Refinos de copy e consistencia visual.

---

## Melhorias Tecnicas Pendentes

1. **Testes automatizados**
   - Testes unitarios para validadores e helpers de seguranca.
   - Testes de integracao para APIs criticas.
   - Testes de permissao por role.

2. **Rate limiting**
   - Especialmente para `/api/upload`, callbacks do n8n, login e webhooks.

3. **Validacao de URL de webhook**
   - Aceitar apenas `https` em producao.
   - Bloquear localhost, IPs privados e metadata endpoints em producao para reduzir SSRF.
   - Permitir excecoes controladas em desenvolvimento.

4. **Observabilidade**
   - Logs estruturados.
   - IDs de correlacao para chamadas n8n.
   - Melhor separacao entre erro operacional e erro de seguranca.

5. **Indices e performance**
   - Avaliar indices compostos para filtros frequentes.
   - Revisar queries com `range` e filtros por data/status/fornecedor.
   - Evitar carregar listas muito grandes em Server Components sem paginacao.

6. **Tipagem e consistencia**
   - Atualizar `src/types/database.ts` sempre que migrations mudarem.
   - Evitar `any` em payloads criticos.
   - Corrigir encoding/mojibake dos arquivos que exibem caracteres quebrados.

---

## Riscos De Regressao Ao Corrigir Seguranca

1. **n8n pode parar de funcionar**
   - Se `/api/contas` ou `/api/contas/[id]/pagamento` passarem a exigir sessao de usuario.
   - Mitigacao: manter endpoints externos publicos e exigir o API Token existente.

2. **CRM pode parar de abrir o app em iframe**
   - Se CSP for endurecida sem incluir o dominio correto.

3. **Telas podem ficar sem dados apos RLS mais restrita**
   - Especialmente lookup, dashboard, relatorios e configuracoes.

4. **Documentos podem deixar de abrir**
   - Baixo risco neste momento, pois a decisao e manter documentos publicos.
   - Ainda e necessario garantir que S3/Supabase Storage esteja configurado corretamente.

5. **Payloads do n8n podem ser rejeitados**
   - Se validacao Zod for rigida demais e nao aceitar strings numericas, campos opcionais ou formatos atuais.

6. **Logs podem perder utilidade operacional**
   - Se dados sensiveis forem removidos sem criar campos redigidos suficientes para debug.

---

## Plano De Execucao Recomendado

### Fase 1 - Estabilizar Contratos

- Mapear endpoints chamados pela UI.
- Mapear endpoints chamados pelo n8n.
- Corrigir rotas de webhooks para bater com a UI ou ajustar a UI para bater com as rotas.
- Documentar payloads esperados do n8n.
- Confirmar lista de endpoints externos publicos que exigirao token.

### Fase 2 - Camada De Autorizacao

- Criar helpers de auth/role para API routes.
- Aplicar em rotas internas da UI.
- Aplicar validacao por `Authorization: Bearer` com o API Token existente nos endpoints externos do n8n.
- Garantir que configuracoes, webhooks, API Token e logs sejam apenas admin.
- Remover qualquer acesso da role motorista.
- Garantir respostas padronizadas `401`, `403`, `400` e `500`.

### Fase 3 - Validacao E Allowlists

- Validar payloads de contas, fornecedores, webhooks, config e upload.
- Remover updates/inserts diretos de `body`.
- Adicionar testes manuais para payloads reais do n8n.

### Fase 4 - RLS E Storage

- Criar migration de correcao das policies.
- Testar com admin, atendente, motorista e anon.
- Garantir que motorista nao leia nem escreva dados.
- Manter documentos publicos conforme decisao atual.
- Revisar policies do bucket/storage apenas para confirmar que refletem a decisao operacional.

### Fase 5 - Logs, Headers E Hardening

- Redigir logs sensiveis.
- Unificar CSP e iframe.
- Adicionar headers de seguranca adicionais.
- Avaliar rate limiting.

### Fase 6 - Funcionalidades Pendentes

- CRUD completo de empresas.
- Reenvio de webhook.
- Gerenciamento de usuarios.
- Timeline de auditoria.
- Exportacao Excel.
- Graficos.

---

## Checklist De Validacao

### Build E Dependencias

- [ ] `npm run build`
- [ ] `npm audit --audit-level=moderate`
- [ ] Build Docker local
- [ ] Start Docker local

### Autenticacao

- [ ] Login valido
- [ ] Login invalido
- [ ] Logout
- [ ] Sessao expirada
- [ ] Acesso anonimo bloqueado em paginas protegidas
- [ ] Acesso anonimo bloqueado em APIs internas

### Roles

- [ ] Admin acessa configuracoes, webhooks, categorias e exclusoes
- [ ] Atendente acessa rotinas operacionais sem configuracoes criticas
- [ ] Motorista nao acessa nenhum modulo
- [ ] Usuario anonimo nao le dados sensiveis via API/Supabase

### Contas

- [ ] Criar conta manual
- [ ] Criar conta via upload/n8n
- [ ] Listar com filtros
- [ ] Editar
- [ ] Conferir
- [ ] Registrar pagamento
- [ ] Upload de comprovante
- [ ] Excluir/restaurar quando permitido

### Fornecedores/Categorias/Empresas

- [ ] CRUD fornecedores
- [ ] Detalhe fornecedor
- [ ] CRUD categorias admin
- [ ] Empresas listagem
- [ ] Empresas CRUD quando implementado

### Webhooks/N8N

- [ ] Criar webhook
- [ ] Editar webhook
- [ ] Excluir webhook
- [ ] Rejeitar chamada externa sem token
- [ ] Rejeitar chamada externa com API Token invalido
- [ ] Enviar boleto para processamento
- [ ] Receber callback de criacao de conta
- [ ] Enviar comprovante
- [ ] Receber callback de pagamento
- [ ] Consultar logs sem expor payload sensivel

### Relatorios E Conciliacao

- [ ] Relatorios por periodo
- [ ] Relatorios por fornecedor
- [ ] Exportacao CSV
- [ ] Conciliar conta
- [ ] Desvincular conciliacao
- [ ] Contas pagas listagem/detalhe

### CRM/Iframe

- [ ] App abre no dominio CRM permitido
- [ ] Login funciona dentro do iframe
- [ ] Cookies Supabase funcionam com `sameSite=none` e `secure=true`
- [ ] CSP nao permite dominios nao autorizados em producao

---

## Decisoes Tomadas

1. Endpoints externos de webhook/callback devem ser publicos, protegidos pelo API Token existente em `api_configuracoes.api_token`.
2. Documentos financeiros podem continuar publicos; o controle fica no S3 ou Storage Supabase.
3. A role motorista nao tera acesso a nenhum modulo neste projeto.
4. Logs de webhook serao visiveis apenas para admin.
5. Padrao recomendado para mutations:
   - Server Actions para fluxos iniciados pela UI autenticada.
   - API routes para integracoes externas, callbacks n8n, upload e endpoints que precisam contrato HTTP publico.
   - Quando existir duplicidade, consolidar regra de permissao/validacao em helpers compartilhados.
6. Tailwind permanece na v3, sem expectativa de upgrade para v4.
7. O API Token existente autoriza todos os eventos externos.
8. O header padrao para o token sera `Authorization: Bearer <token>`.
9. Atendente nao visualiza nenhuma configuracao.

---

## Proximas Acoes Imediatas

1. Criar migration para endurecer RLS mantendo compatibilidade com endpoints externos por API Token.
2. Remover mass assignment nas rotas criticas.
3. Redigir payloads sensiveis em logs, especialmente `arquivo_base64`.
4. Validar fluxo completo com admin, atendente, motorista sem acesso, anonimo sem token e n8n com API Token.
5. Documentar payloads reais esperados pelo n8n para criacao de conta e registro de pagamento.
6. Avaliar rate limiting nos endpoints externos e upload.

## Implementado Em 2026-05-03

1. Contrato REST de webhooks ajustado:
   - `POST /api/webhooks`
   - `PATCH /api/webhooks/[id]`
   - UI de configuracoes apontando para os endpoints corretos.
2. API Token existente aplicado aos callbacks principais do n8n:
   - `POST /api/contas`
   - `PATCH /api/contas/[id]/pagamento`
   - Header esperado: `Authorization: Bearer <token>`.
3. Protecao admin adicionada para configuracoes sensiveis:
   - `/api/config`
   - `/api/webhooks`
   - `/api/webhooks/create`
   - `/api/webhooks/[id]`
   - `/api/webhooks/logs`
4. Protecao server-side adicionada em `/configuracoes` para redirecionar usuarios nao-admin.
5. Helper compartilhado de autorizacao por role criado para APIs internas.
6. APIs internas principais protegidas por sessao e role:
   - contas, fornecedores, lookup, estatisticas, upload e forward de webhooks.
7. Role `motorista` removida do menu operacional e bloqueada no middleware para rotas protegidas.
8. Rota `/conciliacao` incluida na protecao do middleware.
9. Validacao TypeScript executada com sucesso:
   - `npx tsc --noEmit`
