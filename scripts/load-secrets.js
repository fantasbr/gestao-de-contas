// ============================================
// Load Secrets - Carrega secrets de arquivos
// ============================================
// Este arquivo é executado antes do Next.js iniciar
// para carregar secrets de arquivos Docker Secrets

const fs = require('fs');
const path = require('path');

/**
 * Carrega um secret de um arquivo
 * @param {string} envVar - Nome da variável de ambiente para definir
 * @param {string} filePath - Caminho do arquivo contendo o secret
 */
function loadSecret(envVar, filePath) {
  if (process.env[envVar]) {
    // Se já está definido via env, não sobrescreve
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      const value = fs.readFileSync(filePath, 'utf8').trim();
      if (value) {
        process.env[envVar] = value;
        console.log(`✅ Loaded secret: ${envVar}`);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not load secret from ${filePath}: ${error.message}`);
  }
}

/**
 * Carrega todos os secrets configurados
 */
function loadSecrets() {
  console.log('🔐 Loading Docker Secrets...');

  // Supabase
  loadSecret('SUPABASE_SERVICE_ROLE_KEY', '/run/secrets/supabase_service_role_key');
  
  // AWS
  loadSecret('AWS_ACCESS_KEY_ID', '/run/secrets/aws_access_key_id');
  loadSecret('AWS_SECRET_ACCESS_KEY', '/run/secrets/aws_secret_access_key');

  console.log('🔐 Secrets loaded successfully!');
}

// Executar se chamado diretamente
if (require.main === module) {
  loadSecrets();
}

module.exports = { loadSecrets, loadSecret };
