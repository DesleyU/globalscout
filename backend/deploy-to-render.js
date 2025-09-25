#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Globalscout Backend - Automated Render Deployment Helper');
console.log('='.repeat(60));

// Check if we're ready for deployment
function checkDeploymentReadiness() {
  console.log('\n📋 Checking deployment readiness...');
  
  const checks = [
    {
      name: 'Prisma schema (PostgreSQL)',
      check: () => {
        const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
        return schema.includes('provider = "postgresql"');
      }
    },
    {
      name: '.env.render configuration',
      check: () => fs.existsSync('.env.render')
    },
    {
      name: 'Package.json exists',
      check: () => fs.existsSync('package.json')
    },
    {
      name: 'Supabase DATABASE_URL configured',
      check: () => {
        const envRender = fs.readFileSync('.env.render', 'utf8');
        return envRender.includes('postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co');
      }
    }
  ];

  let allPassed = true;
  checks.forEach(check => {
    const passed = check.check();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) allPassed = false;
  });

  return allPassed;
}

// Display environment variables for Render
function displayRenderConfig() {
  console.log('\n🔧 Environment Variables for Render Dashboard:');
  console.log('='.repeat(50));
  
  if (!fs.existsSync('.env.render')) {
    console.log('❌ .env.render file not found!');
    return;
  }

  const envContent = fs.readFileSync('.env.render', 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('\n📝 Copy these to your Render Dashboard:');
  console.log('-'.repeat(40));
  
  lines.forEach(line => {
    if (line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      console.log(`${key}=${value}`);
    }
  });
}

// Instructions for manual deployment
function displayDeploymentInstructions() {
  console.log('\n📖 Render Deployment Instructions:');
  console.log('='.repeat(40));
  console.log('1. Go to https://render.com and log in');
  console.log('2. Find your backend service in the dashboard');
  console.log('3. Go to "Environment" tab');
  console.log('4. Delete all existing environment variables');
  console.log('5. Add the variables shown above');
  console.log('6. Click "Save" to trigger deployment');
  console.log('7. Wait for deployment to complete');
  console.log('\n⚠️  Important: Do NOT add a PORT variable - Render handles this automatically');
}

// Test endpoints after deployment
function displayTestInstructions() {
  console.log('\n🧪 After Deployment - Test These Endpoints:');
  console.log('='.repeat(45));
  console.log('Replace YOUR_RENDER_URL with your actual Render URL:');
  console.log('');
  console.log('Health Check:');
  console.log('curl https://YOUR_RENDER_URL/health');
  console.log('');
  console.log('API Documentation:');
  console.log('https://YOUR_RENDER_URL/api/docs');
  console.log('');
  console.log('Test Registration:');
  console.log(`curl -X POST https://YOUR_RENDER_URL/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@render.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User",
    "role": "PLAYER",
    "position": "MIDFIELDER",
    "age": 25
  }'`);
}

// Main execution
async function main() {
  try {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      console.log('❌ Please run this script from the backend directory');
      process.exit(1);
    }

    // Check deployment readiness
    const ready = checkDeploymentReadiness();
    
    if (!ready) {
      console.log('\n❌ Deployment not ready. Please fix the issues above.');
      process.exit(1);
    }

    console.log('\n✅ All checks passed! Ready for deployment.');

    // Display configuration
    displayRenderConfig();
    
    // Display instructions
    displayDeploymentInstructions();
    
    // Display test instructions
    displayTestInstructions();

    console.log('\n🎉 Deployment helper completed!');
    console.log('💡 After deployment, run: node test-render-deployment.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();