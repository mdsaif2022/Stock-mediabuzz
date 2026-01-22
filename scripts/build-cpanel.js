import { copyFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Check for .htaccess in public folder first, then root
const htaccessSource = existsSync(join(rootDir, 'public', '.htaccess'))
  ? join(rootDir, 'public', '.htaccess')
  : existsSync(join(rootDir, '.htaccess'))
  ? join(rootDir, '.htaccess')
  : null;
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

// Copy .htaccess to dist/spa if it exists
if (htaccessSource && existsSync(htaccessSource)) {
  try {
    copyFileSync(htaccessSource, htaccessDest);
    console.log('✅ .htaccess copied to dist/spa/');
  } catch (error) {
    console.error('❌ Error copying .htaccess:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️  .htaccess not found in public/ or root folder');
  console.warn('   Create .htaccess in public/ folder for React Router support');
}

// Generate sitemap.xml in dist/spa (includes media URLs if API reachable)
try {
  const { generateSitemap } = await import('./generate-sitemap.js');
  await generateSitemap();
} catch (error) {
  console.warn('⚠️  Sitemap generation skipped:', error.message || error);
}

console.log('\n📦 cPanel build complete!');
console.log('📁 Upload all files from dist/spa/ to public_html/ in cPanel');
console.log('\n⚠️  REMINDER: Backend API must be deployed separately!');
console.log('   Admin panel requires a backend API to function.');
console.log('   See CPANEL_VERIFICATION.md for testing checklist.\n');

