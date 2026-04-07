# Docker - Sistema de Contas a Pagar

## 📋 Pré-requisitos

- Docker Engine 20.10+
- Docker Swarm inicializado (apenas para Produção)
- Traefik configurado na rede `BrancaNet` (apenas para Produção)
- Variáveis de ambiente configuradas no Supabase

## 🚀 Como Inicializar

A estrutura foi simplificada para dividir claramente **Desenvolvimento Local** e **Produção Swarm**.

### 💻 Desenvolvimento Local

Para rodar a aplicação localmente pelo Docker, utilizando `.env.local`:

1. Copie o arquivo de exemplo para o arquivo local:
   ```bash
   cp .env.example .env.local
   # Preencha suas chaves
   ```

2. Suba o ambiente (isso iniciará o build com as variáveis corretas):
   ```bash
   docker compose up -d --build
   ```

Acesse em: `http://localhost:3000`

---

### 🌐 Deploy de Produção (Docker Swarm)

Em produção, o sistema depende do proxy reverso global **Traefik**, alocado na rede externa `BrancaNet`.

**1. Configurar Secrets (Primeira Vez)**
```bash
# Entre na pasta secrets e crie os arquivos contendo os valores REAIS
cd secrets
echo "SuaChaveRole" > supabase_service_role_key.txt
echo "AWSId" > aws_access_key_id.txt
echo "AWSSecret" > aws_secret_access_key.txt
```

**2. Configure as Variáveis de Swarm**
Edite o arquivo `.env.swarm` ou as variáveis de sistema no host onde o Swarm Stack será executado.

**3. Faça o Deploy**
```bash
export IMAGE_TAG=latest # ou a tag específica
docker stack deploy -c docker-compose.prod.yml contas
```

Acesse em: `https://contas.brancaautoescola.com.br`

## 📁 Estrutura de Arquivos Otimizada

```text
├── Dockerfile                 # Build multi-stage otimizado para Next.js Standalone
├── docker-compose.yml         # Configuração exclusiva para Desenvolvimento Local
├── docker-compose.prod.yml    # Configuração de Deploy para o Swarm + Traefik
├── build-docker.ps1           # Script PowerShell autosemântico para compilar imagem
├── build-docker.bat           # Chama o arquivo .ps1 no Windows
└── secrets/                   # Arquivos txt lidos como segredos no Swarm (NÃO COMMITE)
```

## 🔐 Gerenciamento de Secrets no Swarm

Se você preferir não usar os arquivos da pasta `/secrets`, você pode criá-los manualmente:

```bash
echo "sua_chave_aqui" | docker secret create supabase_service_role_key -
# etc..
```
*Lembre-se de comentar a seção correspondente no `docker-compose.prod.yml` caso os utilize via CLI.*

## 🔨 Script de Build Automatizado

Criamos um wrapper para facilitar o build. Ele tentará ler seu `.env.local` e solicitará apenas a Tag da imagem!

**No Windows:**
```powershell
.\build-docker.ps1
```

Esse comando irá rodar o build otimizado injetando automaticamente:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## 📊 Comandos Úteis do Swarm

```bash
# Ver status do serviço
docker service ls | grep contas

# Ver logs do App
docker service logs contas_app -f

# Atualizando para uma nova versão
export IMAGE_TAG=0.1.2
docker service update --image angelomoreirafilho/gestao-contas:$IMAGE_TAG contas_app
```

## 🔒 Segurança Aplicada

- ✅ Novo estágio de build usando `.next/standalone` reduz a imagem e restringe arquivos acessíveis.
- ✅ Usuário não-root (`nextjs`) dentro do container rodando no PID 1001.
- ✅ Caching de pacotes otimizado no Dockerfile (`package-lock.json`).
- ✅ Secrets lidos apenas em memória via `_FILE` bindings no App.
- ✅ Remoção de dependências pesadas (`devDeps` não vão pra runtime).

