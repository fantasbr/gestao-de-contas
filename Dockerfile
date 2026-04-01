# ============================================
# Dockerfile - Sistema de Contas a Pagar
# ============================================
# Multi-stage build para otimizar o tamanho da imagem

# Stage 1: Dependências
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependências do sistema necessárias para módulos nativos
RUN apk add --no-cache libc6-compat

# Copiar package files
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Usar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Configurar variável de ambiente para Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Copiar arquivos necessários do stage de build
COPY --from=builder /app/public ./public

# Copiar o código compilado e arquivos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Trocar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Comando para iniciar o Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
