#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Frontend Production Deployment...\n');

// Configuration
const RENDER_BACKEND_URL = 'https://globalscout-backend.onrender.com';
const FRONTEND_DIR = path.join(__dirname, 'frontend');

async function deployFrontend() {
  try {
    console.log('📋 Step 1: Creating production environment configuration...');
    
    // Create .env.production file for frontend
    const envContent = `# Production Environment Configuration
VITE_API_URL=${RENDER_BACKEND_URL}
VITE_APP_NAME=Globalscout
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
`;

    const envPath = path.join(FRONTEND_DIR, '.env.production');
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.production file');
    console.log(`   Backend URL: ${RENDER_BACKEND_URL}`);

    console.log('\n📦 Step 2: Installing frontend dependencies...');
    execSync('npm install', { 
      cwd: FRONTEND_DIR, 
      stdio: 'inherit' 
    });

    console.log('\n🔨 Step 3: Building frontend for production...');
    execSync('npm run build', { 
      cwd: FRONTEND_DIR, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });

    console.log('\n📊 Step 4: Analyzing build output...');
    const distPath = path.join(FRONTEND_DIR, 'dist');
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log('✅ Build successful! Generated files:');
      files.forEach(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`   📄 ${file} (${size} KB)`);
      });
    }

    console.log('\n🌐 Step 5: Deployment Options');
    console.log('Choose your deployment method:');
    console.log('');
    console.log('🔵 Option A: Netlify (Recommended)');
    console.log('   1. Install Netlify CLI: npm install -g netlify-cli');
    console.log('   2. Login: netlify login');
    console.log('   3. Deploy: netlify deploy --prod --dir=frontend/dist');
    console.log('');
    console.log('🟢 Option B: Vercel');
    console.log('   1. Install Vercel CLI: npm install -g vercel');
    console.log('   2. Login: vercel login');
    console.log('   3. Deploy: cd frontend && vercel --prod');
    console.log('');
    console.log('🟡 Option C: Manual Upload');
    console.log('   Upload the contents of frontend/dist/ to your hosting provider');

    console.log('\n📝 Step 6: Testing deployment readiness...');
    
    // Test if build works with production API
    console.log('🔍 Checking if Render backend is accessible...');
    try {
      const { execSync } = require('child_process');
      const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${RENDER_BACKEND_URL}/health`, { encoding: 'utf8' });
      if (response.trim() === '200') {
        console.log('✅ Render backend is accessible and healthy');
      } else {
        console.log(`⚠️  Backend returned status: ${response.trim()}`);
      }
    } catch (error) {
      console.log('⚠️  Could not test backend connectivity');
    }

    console.log('\n🎉 Frontend is ready for production deployment!');
    console.log('\n📋 Next Steps:');
    console.log('1. Choose a deployment method above');
    console.log('2. Deploy the frontend');
    console.log('3. Test the live application');
    console.log('4. Configure custom domain (optional)');

    console.log('\n📁 Build artifacts location:');
    console.log(`   ${distPath}`);

    console.log('\n🔗 Backend URL configured:');
    console.log(`   ${RENDER_BACKEND_URL}`);

  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

// Auto-deploy to Netlify if CLI is available
async function autoDeployNetlify() {
  try {
    console.log('\n🤖 Attempting automatic Netlify deployment...');
    
    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { stdio: 'pipe' });
      console.log('✅ Netlify CLI found');
    } catch {
      console.log('⚠️  Netlify CLI not found. Install with: npm install -g netlify-cli');
      return false;
    }

    // Check if user is logged in
    try {
      execSync('netlify status', { stdio: 'pipe' });
      console.log('✅ Netlify authentication verified');
    } catch {
      console.log('⚠️  Please login to Netlify: netlify login');
      return false;
    }

    console.log('🚀 Deploying to Netlify...');
    execSync('netlify deploy --prod --dir=frontend/dist', { 
      stdio: 'inherit',
      cwd: __dirname 
    });

    console.log('🎉 Netlify deployment completed!');
    return true;

  } catch (error) {
    console.log('❌ Automatic Netlify deployment failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  await deployFrontend();
  
  // Ask user if they want to try automatic deployment
  console.log('\n❓ Would you like to attempt automatic Netlify deployment?');
  console.log('   (Make sure you have netlify-cli installed and are logged in)');
  
  // For now, just prepare - user can run manual deployment
  console.log('\n✅ Frontend deployment preparation complete!');
  console.log('Run this script and follow the deployment options above.');
}

if (require.main === module) {
  main();
}

module.exports = { deployFrontend, autoDeployNetlify };