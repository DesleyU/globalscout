#!/usr/bin/env node

console.log('🔧 Fixing Supabase-Render Connection Issue');
console.log('==========================================');

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing the connection issue...');
console.log('');

console.log('📊 Current situation:');
console.log('- ✅ Local connection works perfectly');
console.log('- ❌ Render cannot reach Supabase database');
console.log('- 🔍 Error: "Can\'t reach database server"');
console.log('');

console.log('🚨 Possible causes:');
console.log('1. 🔒 Supabase IP whitelist blocking Render');
console.log('2. 🌐 SSL/TLS configuration mismatch');
console.log('3. 🔧 Connection pooling issues');
console.log('4. 📡 Network routing problems');
console.log('');

console.log('💡 Solutions to try:');
console.log('');

console.log('🎯 Solution 1: Check Supabase Network Settings');
console.log('- Go to Supabase Dashboard > Settings > Database');
console.log('- Check "Network restrictions" or "IP Allow List"');
console.log('- Ensure "Allow all IP addresses" is enabled for production');
console.log('- Or add Render\'s IP ranges if using IP restrictions');
console.log('');

console.log('🎯 Solution 2: Use Supabase Connection Pooler');
console.log('- Instead of direct database connection');
console.log('- Use Supabase\'s built-in connection pooler');
console.log('- Format: postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres');
console.log('- Port 6543 instead of 5432');
console.log('');

console.log('🎯 Solution 3: Alternative Database URL formats');

const alternatives = [
  {
    name: 'Connection Pooler (Port 6543)',
    url: 'postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:6543/postgres?sslmode=require'
  },
  {
    name: 'Session Mode',
    url: 'postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1'
  },
  {
    name: 'Transaction Mode',
    url: 'postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:6543/postgres?sslmode=require&pgbouncer=true'
  }
];

alternatives.forEach((alt, index) => {
  console.log(`${index + 1}. ${alt.name}:`);
  console.log(`   ${alt.url}`);
  console.log('');
});

console.log('🔧 Creating test configurations...');

// Create multiple render.yaml variants to test
const renderYamlPath = path.join(__dirname, 'render.yaml');
const originalContent = fs.readFileSync(renderYamlPath, 'utf8');

alternatives.forEach((alt, index) => {
  const testContent = originalContent.replace(
    /value: postgresql:\/\/.*$/m,
    `value: ${alt.url}`
  );
  
  const testFileName = `render-test-${index + 1}.yaml`;
  fs.writeFileSync(path.join(__dirname, testFileName), testContent);
  console.log(`✅ Created ${testFileName} - ${alt.name}`);
});

console.log('');
console.log('🚀 Recommended next steps:');
console.log('1. Try the Connection Pooler first (port 6543)');
console.log('2. Check Supabase dashboard for IP restrictions');
console.log('3. Test each configuration systematically');
console.log('');

console.log('📝 To test Connection Pooler:');
console.log('1. Copy render-test-1.yaml to render.yaml');
console.log('2. Commit and push');
console.log('3. Wait for Render redeploy');
console.log('4. Test /api/test-db endpoint');

// Create quick deployment script for connection pooler
const deployPoolerScript = `#!/bin/bash
echo "🔄 Testing Supabase Connection Pooler (Port 6543)..."
cp render-test-1.yaml render.yaml
git add render.yaml
git commit -m "Test Supabase connection pooler (port 6543)"
git push origin main
echo "✅ Deployed connection pooler test"
echo "⏳ Wait 2-3 minutes then test:"
echo "curl https://globalscout-backend-qbyh.onrender.com/api/test-db"
`;

fs.writeFileSync(path.join(__dirname, 'test-connection-pooler.sh'), deployPoolerScript);
fs.chmodSync(path.join(__dirname, 'test-connection-pooler.sh'), '755');

console.log('✅ Created test-connection-pooler.sh script');
console.log('');
console.log('🎯 Run: ./test-connection-pooler.sh to test the connection pooler');