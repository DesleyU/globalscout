#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Netlify Deployment Helper');
console.log('============================\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('❌ Frontend dist folder not found!');
  console.log('   Run: npm run build first');
  process.exit(1);
}

console.log('✅ Frontend build found');
console.log('📁 Location:', distPath);

// Check build contents
const distContents = fs.readdirSync(distPath);
console.log('📦 Build contents:', distContents);

console.log('\n🌐 NETLIFY DEPLOYMENT OPTIONS:');
console.log('===============================');

console.log('\n📋 OPTION 1: Manual Drag & Drop');
console.log('1. Go to: https://app.netlify.com/sites/globalscout-app/deploys');
console.log('2. Drag the entire "frontend/dist" folder to the deploy area');
console.log('3. Wait for deployment to complete');

console.log('\n📋 OPTION 2: ZIP Upload');
console.log('1. Go to: https://app.netlify.com/sites/globalscout-app/deploys');
console.log('2. Upload the netlify-deploy.zip file');
console.log('3. Wait for deployment to complete');

console.log('\n📋 OPTION 3: GitHub Integration');
console.log('1. Push your changes to GitHub');
console.log('2. Connect the repository to Netlify');
console.log('3. Enable auto-deploy from main branch');

console.log('\n🔗 USEFUL LINKS:');
console.log('================');
console.log('• Site Dashboard: https://app.netlify.com/sites/globalscout-app');
console.log('• Deploy Page: https://app.netlify.com/sites/globalscout-app/deploys');
console.log('• Domain Settings: https://app.netlify.com/sites/globalscout-app/settings/domain');
console.log('• Live Site: https://globalscout-app.netlify.app');

console.log('\n✅ Ready for deployment!');
console.log('Choose one of the options above to deploy your frontend.');