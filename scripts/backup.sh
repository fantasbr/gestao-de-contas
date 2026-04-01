#!/bin/bash
# ============================================
# Script de Backup - Docker Swarm
# ============================================

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME="contas"

echo "📦 Criando backup do projeto $PROJECT_NAME..."

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup da imagem Docker
echo "💾 Fazendo backup da imagem Docker..."
docker save contas-app:latest | gzip > $BACKUP_DIR/${PROJECT_NAME}_image_${DATE}.tar.gz

# Backup dos secrets (criptografados seria melhor)
echo "🔐 Fazendo backup dos secrets (arquivos de exemplo)..."
tar -czf $BACKUP_DIR/${PROJECT_NAME}_secrets_${DATE}.tar.gz \
    secrets/*.example 2>/dev/null || echo "   Nenhum secret para fazer backup"

# Backup das configurações
echo "⚙️  Fazendo backup das configurações..."
tar -czf $BACKUP_DIR/${PROJECT_NAME}_config_${DATE}.tar.gz \
    docker-compose.yml \
    docker-compose.prod.yml \
    Dockerfile \
    nginx/nginx.conf \
    .env.swarm 2>/dev/null || true

# Listar backups
echo ""
echo "✅ Backup concluído! Arquivos em $BACKUP_DIR:"
ls -lh $BACKUP_DIR

echo ""
echo "📝 Para restaurar:"
echo "   docker load < ${PROJECT_NAME}_image_${DATE}.tar.gz"
