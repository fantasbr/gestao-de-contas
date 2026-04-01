#!/bin/bash
# ============================================
# Script de Deploy - Docker Swarm
# ============================================
# Uso: ./scripts/deploy.sh [producao|desenvolvimento]

set -e

ENV=${1:-desenvolvimento}
PROJECT_NAME="contas"

echo "🚀 Deploying $PROJECT_NAME - Environment: $ENV"

# Verificar se está no modo Swarm
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo "⚠️  Docker Swarm não está ativo. Inicializando..."
    docker swarm init
fi

# Build da imagem
echo "📦 Building Docker image..."
docker build -t contas-app:latest .

# Se for produção, marcar a imagem com tag
if [ "$ENV" = "producao" ]; then
    docker tag contas-app:latest contas-app:prod
fi

# Deploy do stack
echo "🚀 Deploying stack..."
if [ "$ENV" = "producao" ]; then
    docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml $PROJECT_NAME
else
    docker stack deploy -c docker-compose.yml $PROJECT_NAME
fi

# Aguardar deploy
echo "⏳ Aguardando serviços..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker service ls | grep $PROJECT_NAME

echo ""
echo "✅ Deploy concluído!"
echo "   Acesse: http://localhost:3000"
echo ""
echo "📝 Comandos úteis:"
echo "   docker service ls | grep $PROJECT_NAME  - Ver status"
echo "   docker service logs ${PROJECT_NAME}_app       - Ver logs"
echo "   docker stack rm $PROJECT_NAME             - Remover stack"
