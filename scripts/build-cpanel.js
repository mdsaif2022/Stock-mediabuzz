import { copyFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const htaccessSource = join(rootDir, 'public', '.htaccess');
const htaccessDest = join(rootDir, 'dist', 'spa', '.htaccess');

// Check for environment variables
const envProdPath = join(rootDir, '.env.production');
const hasEnvProd = existsSync(envProdPath);

if (!hasEnvProd) {
  console.warn('\n⚠️  WARNING: .env.production file not found!');
  console.warn('   Your build may not have the correct API URL and admin email.');
  console.warn('   Create .env.production with:');
  console.warn('   VITE_API_BASE_URL=https://your-backend.onrender.com');
  console.warn('   VITE_ADMIN_EMAIL=admin@yourdomain.com\n');
} else {
  const envContent = readFileSync(envProdPath, 'utf-8');
  const hasApiUrl = envContent.includes('VITE_API_BASE_URL');
  const hasAdminEmail = envContent.includes('VITE_ADMIN_EMAIL');
  
  if (!hasApiUrl || !hasAdminEmail) {
    console.warn('\n⚠️  WARNING: .env.production may be missing required variables!');
    console.warn('   Ensure it contains:');
    console.warn('   VITE_API_BASE_URL=https://your-backend.onrender.com');
    console.warn('   VITE_ADMIN_EMAIL=admin@yourdomain.com\n');
  } else {
    console.log('✅ Environment variables found in .env.production');
  }
}

// Copy .htaccess to dist/spa if it doesn't exist
if (existsSync(htaccessSource)) {
  try {
    copyFileSync(htaccessSource, htaccessDest);
    console.log('✅ .htaccess copied to dist/spa/');
  } catch (error) {
    console.error('❌ Error copying .htaccess:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️  .htaccess not found in public folder');
}

console.log('\n📦 cPanel build complete!');
console.log('📁 Upload all files from dist/spa/ to public_html/ in cPanel');
console.log('\n⚠️  REMINDER: Backend API must be deployed separately!');
console.log('   Admin panel requires a backend API to function.');
console.log('   See CPANEL_VERIFICATION.md for testing checklist.\n');

