// ============================================
// Load Secrets - Carrega secrets de arquivos
// ============================================
// Carrega secrets de arquivos Docker Secrets
// Útil para variáveis que precisam ser lidas em runtime

const fs = require('fs');

/**
 * Carrega um secret de um arquivo
 * @param {string} envVar - Nome da variável de ambiente para definir
 * @param {string} filePath - Caminho do arquivo contendo o secret
 */
function loadSecret(envVar, filePath) {
  if (process.env[envVar]) {
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

  // Supabase (variáveis públicas)
  loadSecret('NEXT_PUBLIC_SUPABASE_URL', '/run/secrets/supabase_url');
  loadSecret('NEXT_PUBLIC_SUPABASE_ANON_KEY', '/run/secrets/supabase_anon_key');
  
  // Supabase (variável privada)
  loadSecret('SUPABASE_SERVICE_ROLE_KEY', '/run/secrets/supabase_service_role_key');

  console.log('🔐 Secrets loaded successfully!');
}

if (require.main === module) {
  loadSecrets();
}

module.exports = { loadSecrets, loadSecret };
