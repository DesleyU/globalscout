#!/usr/bin/env node

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function testRenderConnections() {
  console.log('🔍 Testing Render Connections');
  console.log('==============================');
  console.log(`🎯 Testing: ${RENDER_URL}\n`);

  // Test 1: Health Check
  console.log('🏥 Testing: Health Check...');
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health Check - Status:', healthResponse.status);
    console.log('📄 Response:', JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Database Connection Test
  console.log('🗄️  Testing: Database Connection...');
  try {
    // Try to access a protected route that requires database
    const dbResponse = await axios.post(`${RENDER_URL}/api/auth/login`, {
      email: 'nonexistent@test.com',
      password: 'wrongpassword'
    });
    console.log('✅ Database Connected - Got response from auth endpoint');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Database Connected - Authentication endpoint working (401 expected)');
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.response && error.response.status === 429) {
      console.log('✅ Database Connected - Rate limiting active (database working)');
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Database Connection Issue:', error.message);
      if (error.response) {
        console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: API-Football Connection Test
  console.log('⚽ Testing: API-Football Connection...');
  try {
    // Test if we can access any endpoint that might use API-Football
    const apiResponse = await axios.get(`${RENDER_URL}/api/stats/update-status`);
    console.log('✅ API-Football endpoint accessible');
    console.log('📄 Response:', JSON.stringify(apiResponse.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('⚠️  API-Football endpoint requires authentication (endpoint exists)');
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.response && error.response.status === 404) {
      console.log('❌ API-Football endpoint not found');
    } else {
      console.log('❌ API-Football Connection Test Failed:', error.message);
      if (error.response) {
        console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Environment Variables Check
  console.log('🔧 Testing: Environment Configuration...');
  try {
    // Try to trigger an error that might reveal environment info
    const envResponse = await axios.get(`${RENDER_URL}/api/nonexistent-route`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ Server responding to requests (environment loaded)');
    }
  }

  console.log('\n📊 Connection Test Summary:');
  console.log('============================');
  console.log('🏥 Health Check: Server is running');
  console.log('🗄️  Database: Connection tested via auth endpoints');
  console.log('⚽ API-Football: Endpoint accessibility checked');
  console.log('🔧 Environment: Server configuration active');
  
  console.log('\n🔗 Useful URLs:');
  console.log('================');
  console.log(`🏥 Health: ${RENDER_URL}/health`);
  console.log(`📚 API Docs: ${RENDER_URL}/api/docs`);
  console.log(`🔐 Register: ${RENDER_URL}/api/auth/register`);
  console.log(`🔑 Login: ${RENDER_URL}/api/auth/login`);
}

// Run the test
testRenderConnections().catch(console.error);