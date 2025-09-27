#!/usr/bin/env node

const https = require('https');

console.log('🔍 Debugging Render Deployment Issue');
console.log('====================================');

// Test different endpoints to isolate the issue
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    expected: 200
  },
  {
    name: 'API Base Route',
    method: 'GET', 
    path: '/api',
    expected: 404 // Should return 404 but not 500
  },
  {
    name: 'Auth Route Check',
    method: 'GET',
    path: '/api/auth',
    expected: 404 // Should return 404 but not 500
  },
  {
    name: 'Login with Valid Data',
    method: 'POST',
    path: '/api/auth/login',
    data: JSON.stringify({
      email: 'desley_u@hotmail.com',
      password: 'desley123'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    expected: 200
  },
  {
    name: 'Login with Invalid Data',
    method: 'POST', 
    path: '/api/auth/login',
    data: JSON.stringify({
      email: 'invalid@test.com',
      password: 'wrongpassword'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    expected: 401
  }
];

const baseUrl = 'globalscout-backend-qbyh.onrender.com';

function makeRequest(test) {
  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl,
      port: 443,
      path: test.path,
      method: test.method,
      headers: test.headers || {},
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        error: error.message,
        statusCode: 0
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        error: 'Request timeout',
        statusCode: 0
      });
    });

    if (test.data) {
      req.write(test.data);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log(`🧪 Running ${tests.length} diagnostic tests...\n`);
  
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`${i + 1}. ${test.name}`);
    console.log(`   ${test.method} ${test.path}`);
    
    const result = await makeRequest(test);
    
    if (result.error) {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else {
      const statusMatch = result.statusCode === test.expected;
      const statusIcon = statusMatch ? '✅' : '⚠️';
      
      console.log(`   ${statusIcon} Status: ${result.statusCode} (expected: ${test.expected})`);
      
      if (result.data) {
        try {
          const jsonData = JSON.parse(result.data);
          console.log(`   📄 Response: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`   📄 Response: ${result.data.substring(0, 100)}...`);
        }
      }
      
      // Special analysis for 500 errors
      if (result.statusCode === 500) {
        console.log(`   🚨 INTERNAL SERVER ERROR DETECTED`);
        console.log(`   💡 This suggests a backend code or database issue`);
      }
    }
    
    console.log('');
  }
  
  console.log('🔍 Analysis Summary:');
  console.log('===================');
  console.log('If you see 500 errors on login but 200 on health:');
  console.log('- ✅ Server is running and accessible');
  console.log('- ❌ Database connection or authentication logic has issues');
  console.log('- 🔧 Possible fixes:');
  console.log('  1. Check DATABASE_URL format in Render environment');
  console.log('  2. Verify Prisma client generation in production');
  console.log('  3. Check if Supabase allows connections from Render IPs');
  console.log('  4. Verify JWT_SECRET and other auth environment variables');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check Render logs for specific error messages');
  console.log('2. Test database connection directly from Render');
  console.log('3. Verify all environment variables are set correctly');
}

runTests().catch(console.error);