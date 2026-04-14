# ============================================
# Dockerfile - Sistema de Contas a Pagar
# ============================================

FROM node:22-alpine AS base

LABEL org.opencontainers.image.version="0.1.6"
LABEL org.opencontainers.image.source="https://github.com/fantasbr/gestao-de-contas"
LABEL org.opencontainers.image.description="Sistema de Gestão de Contas a Pagar"

# Dependências necessárias para builds de módulos nativos e otimização do Next.js
RUN apk add --no-cache libc6-compat

# ============================================
# Dependências
# ============================================
FROM base AS deps
WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro para melhor aproveitamento de cache
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Build
# ============================================
FROM base AS builder
WORKDIR /app

# NÃO copiar .env.production - as variáveis são passadas via BUILD ARG e ARG devem vir ANTES de ENV
# Copiar node_modules do stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Definir variáveis de ambiente com PLACEHOLDERS (serão substituídas pelo entrypoint.sh no runtime)
ENV NEXT_PUBLIC_SUPABASE_URL="NEXT_PUBLIC_SUPABASE_URL_PLACEHOLDER"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="NEXT_PUBLIC_SUPABASE_ANON_KEY_PLACEHOLDER"
ENV NEXT_PUBLIC_APP_URL="NEXT_PUBLIC_APP_URL_PLACEHOLDER"
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ============================================
# Runtime
# ============================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV NODE_OPTIONS="--max-old-space-size=256"

# Copiar script de entrypoint e garantir que seja executável
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Usa o entrypoint para fazer as substituições antes de subir o server
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
