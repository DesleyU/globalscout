#!/usr/bin/env node

const https = require('https');
const http = require('http');

console.log('🧪 Testing Render Deployment');
console.log('='.repeat(30));

// Get Render URL from user
const renderUrl = process.argv[2];

if (!renderUrl) {
  console.log('❌ Please provide your Render URL as an argument');
  console.log('Usage: node test-render-deployment.js https://your-app.onrender.com');
  process.exit(1);
}

// Clean URL
const baseUrl = renderUrl.replace(/\/$/, '');

// Test function
async function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Globalscout-Test/1.0'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log(`🎯 Testing: ${baseUrl}\n`);

  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/health`,
      expectedStatus: 200
    },
    {
      name: 'API Documentation',
      url: `${baseUrl}/api/docs`,
      expectedStatus: 200
    },
    {
      name: 'User Registration',
      url: `${baseUrl}/api/auth/register`,
      method: 'POST',
      data: {
        email: `test-${Date.now()}@render.com`,
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'User',
        role: 'PLAYER',
        position: 'MIDFIELDER',
        age: 25
      },
      expectedStatus: 201
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}...`);
      
      const result = await testEndpoint(
        test.url, 
        test.method || 'GET', 
        test.data
      );

      const passed = result.status === test.expectedStatus;
      
      if (passed) {
        console.log(`✅ ${test.name} - Status: ${result.status}`);
        if (test.name === 'User Registration' && result.data.token) {
          console.log(`   📝 Registration successful - Token received`);
        }
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - Expected: ${test.expectedStatus}, Got: ${result.status}`);
        if (result.data) {
          console.log(`   📄 Response:`, JSON.stringify(result.data, null, 2));
        }
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your deployment is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }

  // Additional info
  console.log('\n📋 Useful URLs:');
  console.log(`🏥 Health Check: ${baseUrl}/health`);
  console.log(`📚 API Docs: ${baseUrl}/api/docs`);
  console.log(`🔐 Register: ${baseUrl}/api/auth/register`);
  console.log(`🔑 Login: ${baseUrl}/api/auth/login`);
}

runTests().catch(console.error);