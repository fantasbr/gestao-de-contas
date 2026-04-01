# Docker Swarm - Sistema de Contas a Pagar

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Swarm inicializado
- Secrets configurados

## 🚀 Instalação Rápida

### 1. Configurar Secrets

```bash
# Copiar arquivos de exemplo
cd secrets
cp supabase_service_role_key.txt.example supabase_service_role_key.txt
cp aws_access_key_id.txt.example aws_access_key_id.txt
cp aws_secret_access_key.txt.example aws_secret_access_key.txt

# Editar com seus valores reais
nano supabase_service_role_key.txt
nano aws_access_key_id.txt
nano aws_secret_access_key.txt
```

### 2. Configurar Variáveis de Ambiente

```bash
# Editar arquivo de variáveis
nano .env.swarm
```

### 3. Inicializar Swarm (se necessário)

```bash
docker swarm init
```

### 4. Deploy

```bash
# Deploy desenvolvimento
./scripts/deploy.sh

# Deploy produção
./scripts/deploy.sh producao
```

## 📁 Estrutura de Arquivos

```
├── Dockerfile                 # Build da imagem
├── docker-compose.yml         # Configuração Swarm (desenvolvimento)
├── docker-compose.prod.yml    # Configuração Swarm (produção)
├── .env.swarm                 # Variáveis de ambiente
├── secrets/                   # Secrets Docker
│   ├── README.md
│   ├── supabase_service_role_key.txt
│   ├── aws_access_key_id.txt
│   └── aws_secret_access_key.txt
├── scripts/
│   ├── deploy.sh              # Script de deploy
│   └── backup.sh               # Script de backup
└── nginx/
    └── nginx.conf              # Configuração proxy reverso
```

## 🔐 Secrets

### Criar Secrets Manualmente (alternativa aos arquivos)

```bash
# Criar secret a partir de string
echo "sua_chave_aqui" | docker secret create supabase_service_role_key -

# Criar secret a partir de arquivo
docker secret create aws_access_key_id aws_access_key_id.txt
```

### Usar Secrets via CLI

```bash
# Listar secrets
docker secret ls

# Remover secret
docker secret rm supabase_service_role_key
```

## 📊 Comandos Úteis

```bash
# Ver status dos serviços
docker service ls | grep contas

# Ver réplicas
docker service ps contas_app

# Ver logs
docker service logs contas_app -f

# Escalar serviços
docker service scale contas_app=5

# Atualizar imagem
docker build -t contas-app:latest .
docker service update --image contas-app:latest contas_app

# Rollback
docker service rollback contas_app

# Remover stack
docker stack rm contas
```

## 🌐 Acesso

- **Desenvolvimento:** http://localhost:3000
- **Produção (com Nginx):** http://localhost:80

## 🔧 Troubleshooting

### Serviço não inicia

```bash
# Verificar logs
docker service logs contas_app --since 5m

# Verificar saúde
docker service ls
docker service ps contas_app
```

### Secrets não carregam

```bash
# Verificar se secrets existem
docker secret ls

# Inspecionar secret
docker secret inspect supabase_service_role_key
```

### Problemas de rede

```bash
# Ver redes
docker network ls | grep contas

# Inspecionar rede
docker network inspect contas_backend
```

## 🔒 Segurança

- ✅ Usuário não-root no container
- ✅ Secrets via Docker Secrets
- ✅ Healthchecks configurados
- ✅ Rate limiting no Nginx
- ✅ Headers de segurança

## 📈 Monitoramento

```bash
# Stats em tempo real
docker stats $(docker service ls -q)

# Ver consumo de recursos
docker service ls
docker service inspect --pretty contas_app
```

## 💾 Backup

```bash
# Criar backup
./scripts/backup.sh

# Restore
docker load < backups/contas_image_YYYYMMDD_HHMMSS.tar.gz
```

## 🔄 Atualização

```bash
# 1. Fazer build da nova imagem
docker build -t contas-app:latest .

# 2. Deploy com rolling update
docker service update --image contas-app:latest contas_app

# Ou usar script
./scripts/deploy.sh producao
```

## 📝 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `SUPABASE_URL` | URL do projeto Supabase | Sim |
| `SUPABASE_ANON_KEY` | Chave pública Supabase | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (secret) | Sim |
| `AWS_ACCESS_KEY_ID` | ID da chave AWS | Sim |
| `AWS_SECRET_ACCESS_KEY` | Chave secreta AWS | Sim |
| `AWS_REGION` | Região AWS | Sim |
| `AWS_S3_BUCKET` | Bucket S3 | Sim |
| `APP_URL` | URL da aplicação | Não |

## 🐛 Debug

```bash
# Entrar no container
docker exec -it $(docker ps -q -f name=contas_app) sh

# Ver variáveis de ambiente
docker exec $(docker ps -q -f name=contas_app) env | grep -E "SUPABASE|AWS"

# Testar healthcheck
curl http://localhost:3000/health
```
