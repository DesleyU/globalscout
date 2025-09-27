#!/usr/bin/env node

/**
 * 🔍 Supabase Connectivity Test
 * 
 * Test verschillende aspecten van Supabase connectiviteit vanaf Render
 */

const https = require('https');
const { execSync } = require('child_process');

console.log('🔍 SUPABASE CONNECTIVITY TEST');
console.log('==============================\n');

// Test 1: DNS Resolution
console.log('1️⃣ DNS RESOLUTION TEST');
console.log('----------------------');
try {
  const dnsResult = execSync('nslookup db.pxiwcdsrkehxgguqyjur.supabase.co', { encoding: 'utf8' });
  console.log('✅ DNS resolution successful');
  console.log(dnsResult);
} catch (error) {
  console.log('❌ DNS resolution failed:', error.message);
}

// Test 2: Port connectivity
console.log('\n2️⃣ PORT CONNECTIVITY TEST');
console.log('---------------------------');

const testPorts = [5432, 6543, 443, 80];
for (const port of testPorts) {
  try {
    console.log(`Testing port ${port}...`);
    const result = execSync(`timeout 10 bash -c "echo >/dev/tcp/db.pxiwcdsrkehxgguqyjur.supabase.co/${port}" 2>/dev/null && echo "Port ${port}: OPEN" || echo "Port ${port}: CLOSED"`, { encoding: 'utf8' });
    console.log(result.trim());
  } catch (error) {
    console.log(`Port ${port}: FAILED - ${error.message}`);
  }
}

// Test 3: HTTPS connectivity to Supabase API
console.log('\n3️⃣ SUPABASE API CONNECTIVITY');
console.log('------------------------------');

const testHttpsConnectivity = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'pxiwcdsrkehxgguqyjur.supabase.co',
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'GlobalScout-Render-Test'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS connection successful - Status: ${res.statusCode}`);
      console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log(`❌ HTTPS connection failed: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ HTTPS connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Test 4: PostgreSQL connection test met verschillende SSL modes
console.log('\n4️⃣ POSTGRESQL CONNECTION MODES');
console.log('--------------------------------');

const connectionModes = [
  { mode: 'disable', desc: 'No SSL' },
  { mode: 'allow', desc: 'SSL if available' },
  { mode: 'prefer', desc: 'Prefer SSL' },
  { mode: 'require', desc: 'Require SSL' },
  { mode: 'verify-ca', desc: 'Verify CA' },
  { mode: 'verify-full', desc: 'Full verification' }
];

connectionModes.forEach(({ mode, desc }) => {
  console.log(`Testing sslmode=${mode} (${desc})`);
  const testUrl = `postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:5432/postgres?sslmode=${mode}`;
  console.log(`URL: ${testUrl.replace(':Globalscout!2025', ':***')}`);
});

// Test 5: Render IP detection
console.log('\n5️⃣ RENDER IP DETECTION');
console.log('-----------------------');

const detectRenderIP = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'httpbin.org',
      port: 443,
      path: '/ip',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const ipInfo = JSON.parse(data);
          console.log(`✅ Render IP detected: ${ipInfo.origin}`);
          resolve(ipInfo.origin);
        } catch (error) {
          console.log('❌ Failed to parse IP response');
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ IP detection failed: ${error.message}`);
      resolve(null);
    });

    req.end();
  });
};

// Run tests
(async () => {
  await testHttpsConnectivity();
  await detectRenderIP();
  
  console.log('\n📋 NEXT STEPS:');
  console.log('===============');
  console.log('1. Check welke poorten open zijn');
  console.log('2. Test verschillende SSL modes');
  console.log('3. Controleer of Supabase API bereikbaar is');
  console.log('4. Identificeer Render IP voor whitelisting');
  console.log('\n✅ Connectivity test completed!');
})();