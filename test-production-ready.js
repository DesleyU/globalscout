#!/usr/bin/env node

/**
 * Production Readiness Test for GlobalScout
 * Verifies all components are ready for deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 GlobalScout Production Readiness Test');
console.log('=========================================\n');

let passed = 0;
let failed = 0;

function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}: ${message}`);
    failed++;
  }
}

// Test 1: Check if all deployment files exist
console.log('📁 Deployment Files Check:');
test('Railway config', fs.existsSync('railway.json'), 'railway.json not found');
test('Render config', fs.existsSync('render.yaml'), 'render.yaml not found');
test('Vercel config', fs.existsSync('vercel.json'), 'vercel.json not found');
test('Netlify config', fs.existsSync('netlify.toml'), 'netlify.toml not found');
test('Dockerfile', fs.existsSync('Dockerfile'), 'Dockerfile not found');
test('Docker Compose', fs.existsSync('docker-compose.yml'), 'docker-compose.yml not found');
test('GitHub Actions', fs.existsSync('.github/workflows/deploy.yml'), 'GitHub Actions workflow not found');

console.log('');

// Test 2: Check backend structure
console.log('🔧 Backend Structure Check:');
test('Backend directory', fs.existsSync('backend'), 'backend directory not found');
test('Backend package.json', fs.existsSync('backend/package.json'), 'backend/package.json not found');
test('Prisma schema', fs.existsSync('backend/prisma/schema.prisma'), 'Prisma schema not found');
test('Production schema', fs.existsSync('backend/prisma/schema.production.prisma'), 'Production schema not found');
test('Backend .env template', fs.existsSync('backend/.env.production.configured'), 'Backend .env template not found');
test('Server file', fs.existsSync('backend/src/server.js'), 'Server file not found');

console.log('');

// Test 3: Check frontend structure
console.log('🎨 Frontend Structure Check:');
test('Frontend directory', fs.existsSync('frontend'), 'frontend directory not found');
test('Frontend package.json', fs.existsSync('frontend/package.json'), 'frontend/package.json not found');
test('Frontend .env template', fs.existsSync('frontend/.env.production'), 'Frontend .env template not found');
test('Vite config', fs.existsSync('frontend/vite.config.js'), 'Vite config not found');
test('Main entry point', fs.existsSync('frontend/src/main.jsx'), 'Main entry point not found');
test('Index HTML', fs.existsSync('frontend/index.html'), 'Index HTML not found');

console.log('');

// Test 4: Check if frontend builds successfully
console.log('🏗️  Frontend Build Check:');
const frontendDistExists = fs.existsSync('frontend/dist');
test('Frontend build exists', frontendDistExists, 'Run: cd frontend && npm run build');

if (frontendDistExists) {
  const indexExists = fs.existsSync('frontend/dist/index.html');
  const assetsExists = fs.existsSync('frontend/dist/assets');
  test('Build index.html', indexExists, 'Build incomplete - missing index.html');
  test('Build assets', assetsExists, 'Build incomplete - missing assets directory');
}

console.log('');

// Test 5: Check documentation
console.log('📚 Documentation Check:');
test('Main README', fs.existsSync('README.md'), 'README.md not found');
test('Deployment checklist', fs.existsSync('PRODUCTION-DEPLOYMENT-CHECKLIST.md'), 'Deployment checklist not found');
test('Production guide', fs.existsSync('PRODUCTION-DEPLOYMENT-GUIDE.md'), 'Production guide not found');
test('Backend deployment guide', fs.existsSync('BACKEND-DEPLOYMENT.md'), 'Backend deployment guide not found');
test('Frontend deployment guide', fs.existsSync('FRONTEND-DEPLOYMENT.md'), 'Frontend deployment guide not found');

console.log('');

// Test 6: Check setup scripts
console.log('🔧 Setup Scripts Check:');
test('PostgreSQL setup', fs.existsSync('setup-postgres.js'), 'PostgreSQL setup script not found');
test('Production setup', fs.existsSync('setup-production.js'), 'Production setup script not found');
test('SSL setup', fs.existsSync('setup-ssl.js'), 'SSL setup script not found');
test('CDN setup', fs.existsSync('setup-cdn.js'), 'CDN setup script not found');
test('Supabase setup', fs.existsSync('setup-supabase.js'), 'Supabase setup script not found');
test('Main deployment script', fs.existsSync('deploy.sh'), 'Main deployment script not found');

console.log('');

// Test 7: Check environment templates
console.log('🔐 Environment Templates Check:');
test('Supabase config template', fs.existsSync('supabase-config-template.env'), 'Supabase config template not found');

// Check if environment files have required variables
if (fs.existsSync('backend/.env.production.configured')) {
  const backendEnv = fs.readFileSync('backend/.env.production.configured', 'utf8');
  test('Backend DATABASE_URL', backendEnv.includes('DATABASE_URL'), 'DATABASE_URL not in backend env');
  test('Backend JWT_SECRET', backendEnv.includes('JWT_SECRET'), 'JWT_SECRET not in backend env');
  test('Backend STRIPE keys', backendEnv.includes('STRIPE_SECRET_KEY'), 'Stripe keys not in backend env');
}

if (fs.existsSync('frontend/.env.production')) {
  const frontendEnv = fs.readFileSync('frontend/.env.production', 'utf8');
  test('Frontend API_URL', frontendEnv.includes('VITE_API_URL'), 'VITE_API_URL not in frontend env');
  test('Frontend Stripe key', frontendEnv.includes('VITE_STRIPE_PUBLISHABLE_KEY'), 'Stripe key not in frontend env');
}

console.log('');

// Summary
console.log('📊 Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

console.log('');

if (failed === 0) {
  console.log('🎉 PRODUCTION READY!');
  console.log('🚀 Your application is ready for deployment.');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Set up Supabase database: node setup-supabase.js');
  console.log('2. Deploy backend: railway login && railway up');
  console.log('3. Deploy frontend: cd frontend && vercel');
  console.log('4. Configure environment variables');
  console.log('5. Test production deployment');
  console.log('');
  console.log('📚 Read PRODUCTION-DEPLOYMENT-GUIDE.md for detailed instructions');
} else {
  console.log('⚠️  ISSUES FOUND');
  console.log('Please fix the failed tests before deploying to production.');
  console.log('');
  console.log('🔧 Common fixes:');
  console.log('- Run: npm run build (in frontend directory)');
  console.log('- Check file paths and permissions');
  console.log('- Ensure all setup scripts have been run');
}

console.log('');
console.log('🔗 Useful Resources:');
console.log('- Railway: https://railway.app');
console.log('- Vercel: https://vercel.com');
console.log('- Supabase: https://supabase.com');
console.log('- Documentation: ./PRODUCTION-DEPLOYMENT-GUIDE.md');