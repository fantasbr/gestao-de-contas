# ============================================
# Dockerfile - Sistema de Contas a Pagar
# ============================================

FROM node:20-alpine
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação Next.js
RUN npm run build

# Expor porta
EXPOSE 3000

# Configurar variável de ambiente para Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar o Next.js
CMD ["npm", "start"]
