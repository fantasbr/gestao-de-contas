#!/bin/sh

# ============================================
# Entrypoint Script - Gestão Contas
# ============================================
# Este script roda ao iniciar o container.
# Ele procura os PLACEHOLDERS estáticos no HTML/JS
# gerados pelo Next.js e os substitui pelas 
# variáveis de ambiente configuradas no runtime (.env / Docker Compose).

echo "🔄 [ENTRYPOINT] Iniciando injeção de variáveis de ambiente..."

# Lista de arquivos a processar (.js e .html dentro da pasta compilada)
# No standalone mode, os estáticos e chunks estão em .next
FILES_TO_PROCESS=$(find /app/.next -type f \( -name "*.js" -o -name "*.html" \))

# REPLACE NEXT_PUBLIC_SUPABASE_URL
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "  > Injetando NEXT_PUBLIC_SUPABASE_URL..."
    # Sed processa todos os arquivos de uma vez substituindo as strings. O separador é | para evitar pular barras (/) da URL.
    find /app/.next -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|NEXT_PUBLIC_SUPABASE_URL_PLACEHOLDER|${NEXT_PUBLIC_SUPABASE_URL}|g" {} +
fi

# REPLACE NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "  > Injetando NEXT_PUBLIC_SUPABASE_ANON_KEY..."
    find /app/.next -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|NEXT_PUBLIC_SUPABASE_ANON_KEY_PLACEHOLDER|${NEXT_PUBLIC_SUPABASE_ANON_KEY}|g" {} +
fi

# REPLACE NEXT_PUBLIC_APP_URL
if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
    echo "  > Injetando NEXT_PUBLIC_APP_URL..."
    find /app/.next -type f \( -name "*.js" -o -name "*.html" \) -exec sed -i "s|NEXT_PUBLIC_APP_URL_PLACEHOLDER|${NEXT_PUBLIC_APP_URL}|g" {} +
fi

echo "✅ [ENTRYPOINT] Injeção concluída. Iniciando a aplicação..."

# Executa o comando CMD original do Dockerfile (node server.js)
exec "$@"
