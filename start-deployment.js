#!/usr/bin/env node

/**
 * Interactive GlobalScout Deployment Helper
 * Guides you through the complete deployment process
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

function runCommand(command, description) {
  console.log(`\n🔧 ${description}`);
  console.log(`💻 Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    console.log('✅ Success!');
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 GlobalScout Interactive Deployment');
  console.log('=====================================\n');

  // Step 1: Supabase Setup
  console.log('📋 STAP 1: Supabase Database Setup');
  console.log('-----------------------------------');
  
  const hasSupabase = await ask('Heb je al een Supabase project aangemaakt? (y/n): ');
  
  if (hasSupabase.toLowerCase() !== 'y') {
    console.log('\n📝 Ga naar: https://supabase.com');
    console.log('1. Maak een account aan of log in');
    console.log('2. Klik "New Project"');
    console.log('3. Project naam: globalscout-production');
    console.log('4. Kies een regio (bijv. West Europe)');
    console.log('5. Stel een sterk database wachtwoord in');
    console.log('6. Wacht tot het project klaar is (2-3 minuten)');
    
    await ask('\nDruk Enter als je Supabase project klaar is...');
  }

  // Get Supabase credentials
  console.log('\n🔑 Supabase Credentials');
  console.log('Ga naar je Supabase project > Settings > API');
  
  const projectUrl = await ask('Project URL (https://xxx.supabase.co): ');
  const anonKey = await ask('Anon Key (eyJ...): ');
  
  console.log('\nGa naar Settings > Database voor:');
  const dbPassword = await ask('Database Password: ');
  
  // Extract project ref from URL
  const projectRef = projectUrl.replace('https://', '').replace('.supabase.co', '');
  const databaseUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  
  // Update backend .env
  console.log('\n🔧 Backend Environment Configureren...');
  const backendEnv = `DATABASE_URL="${databaseUrl}"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="*"
FRONTEND_URL="http://localhost:5173"
`;

  fs.writeFileSync('backend/.env', backendEnv);
  console.log('✅ Backend .env updated');

  // Setup database
  console.log('\n🗄️ Database Schema Setup...');
  process.chdir('backend');
  
  if (runCommand('npx prisma db push', 'Pushing database schema')) {
    runCommand('npx prisma generate', 'Generating Prisma client');
    runCommand('npm run seed', 'Seeding database');
  }
  
  process.chdir('..');

  // Step 2: Railway Backend Deployment
  console.log('\n📋 STAP 2: Backend Deployment (Railway)');
  console.log('---------------------------------------');
  
  const hasRailwayAccount = await ask('Heb je een Railway account? (y/n): ');
  
  if (hasRailwayAccount.toLowerCase() !== 'y') {
    console.log('\n📝 Ga naar: https://railway.app');
    console.log('1. Maak een account aan met GitHub/Google');
    console.log('2. Verifieer je email');
    
    await ask('\nDruk Enter als je Railway account klaar is...');
  }

  console.log('\n🔐 Railway Login...');
  runCommand('railway login', 'Logging into Railway');

  console.log('\n🚀 Railway Project Setup...');
  runCommand('railway init', 'Initializing Railway project');

  // Set environment variables
  console.log('\n🔧 Environment Variables instellen...');
  runCommand(`railway variables set DATABASE_URL="${databaseUrl}"`, 'Setting DATABASE_URL');
  runCommand('railway variables set JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"', 'Setting JWT_SECRET');
  runCommand('railway variables set NODE_ENV="production"', 'Setting NODE_ENV');
  runCommand('railway variables set PORT="3000"', 'Setting PORT');

  // Deploy backend
  console.log('\n🚀 Backend Deployment...');
  runCommand('railway up', 'Deploying backend to Railway');

  // Get backend URL
  const backendUrl = await ask('\nWat is je Railway backend URL? (https://xxx.up.railway.app): ');

  // Step 3: Frontend Deployment
  console.log('\n📋 STAP 3: Frontend Deployment (Vercel)');
  console.log('---------------------------------------');

  // Update frontend environment
  console.log('\n🔧 Frontend Environment Configureren...');
  const frontendEnv = `VITE_API_URL="${backendUrl}"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
VITE_APP_NAME="GlobalScout"
VITE_APP_VERSION="1.0.0"
`;

  fs.writeFileSync('frontend/.env.production', frontendEnv);
  console.log('✅ Frontend .env.production updated');

  // Build frontend
  console.log('\n🏗️ Frontend Build...');
  process.chdir('frontend');
  runCommand('npm run build', 'Building frontend for production');

  // Deploy to Vercel
  console.log('\n🚀 Vercel Deployment...');
  runCommand('npx vercel', 'Deploying to Vercel');

  const frontendUrl = await ask('\nWat is je Vercel frontend URL? (https://xxx.vercel.app): ');

  // Update CORS
  console.log('\n🔧 CORS Configuratie...');
  process.chdir('..');
  runCommand(`railway variables set FRONTEND_URL="${frontendUrl}"`, 'Setting frontend URL');
  runCommand(`railway variables set CORS_ORIGIN="${frontendUrl}"`, 'Setting CORS origin');
  runCommand('railway up', 'Redeploying backend with CORS');

  // Final steps
  console.log('\n🎉 DEPLOYMENT VOLTOOID!');
  console.log('========================');
  console.log(`\n🌐 Frontend: ${frontendUrl}`);
  console.log(`🔧 Backend: ${backendUrl}`);
  console.log(`🗄️ Database: ${projectUrl}`);
  
  console.log('\n📋 Test je deployment:');
  console.log(`1. Ga naar: ${frontendUrl}`);
  console.log('2. Test registratie en login');
  console.log('3. Controleer dashboard functionaliteit');
  
  console.log('\n🔧 Handige commando\'s:');
  console.log('- Backend logs: railway logs');
  console.log('- Frontend redeploy: cd frontend && npx vercel --prod');
  console.log('- Database management: cd backend && npx prisma studio');

  rl.close();
}

main().catch(console.error);