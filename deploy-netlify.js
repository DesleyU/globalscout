#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 NETLIFY DEPLOYMENT GUIDE');
console.log('===========================\n');

// Check if dist folder exists
const distPath = path.join(__dirname, 'frontend', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('❌ Frontend dist folder not found!');
  console.log('   Run: cd frontend && npm run build');
  process.exit(1);
}

console.log('✅ Frontend build found');
console.log('📁 Location:', distPath);

// Check build contents
const distContents = fs.readdirSync(distPath);
console.log('📦 Build contents:', distContents);

// Check if ZIP file exists
const zipPath = path.join(__dirname, 'netlify-deploy.zip');
const zipExists = fs.existsSync(zipPath);

console.log('\n🎯 DEPLOYMENT STATUS:');
console.log('=====================');
console.log('✅ Frontend built successfully');
console.log(`${zipExists ? '✅' : '❌'} ZIP file ready: ${zipExists ? 'netlify-deploy.zip' : 'Not found'}`);

console.log('\n📋 MANUAL DEPLOYMENT STEPS:');
console.log('============================');
console.log('1. Go to: https://app.netlify.com/sites/5300e60a-4511-41c0-a099-028048f113dd/deploys');
console.log('2. Click "Deploy manually"');
console.log('3. Drag the "netlify-deploy.zip" file to the deploy area');
console.log('4. Wait for deployment to complete');
console.log('5. Check: https://globalscout.eu');

console.log('\n🔗 USEFUL LINKS:');
console.log('================');
console.log('• Site Dashboard: https://app.netlify.com/sites/5300e60a-4511-41c0-a099-028048f113dd');
console.log('• Deploy Page: https://app.netlify.com/sites/5300e60a-4511-41c0-a099-028048f113dd/deploys');
console.log('• Domain Settings: https://app.netlify.com/sites/5300e60a-4511-41c0-a099-028048f113dd/settings/domain');
console.log('• Live Site: https://globalscout.eu');

console.log('\n💡 ALTERNATIVE: Drag & Drop');
console.log('============================');
console.log('You can also drag the entire "frontend/dist" folder directly');
console.log('to the Netlify deploy area instead of using the ZIP file.');

console.log('\n✅ Ready for deployment!');
console.log('Choose one of the options above to deploy your modernized frontend.');