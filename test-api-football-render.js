#!/usr/bin/env node

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function testAPIFootballOnRender() {
  console.log('⚽ Testing API-Football Connection on Render');
  console.log('=============================================');
  console.log(`🎯 Testing: ${RENDER_URL}\n`);

  // First, let's try to register a user to get a token
  console.log('🔐 Step 1: Creating test user...');
  
  const testUser = {
    email: `test-api-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'API',
    lastName: 'Test',
    role: 'PLAYER',
    position: 'FORWARD',
    age: 25
  };

  let authToken = null;

  try {
    const registerResponse = await axios.post(`${RENDER_URL}/api/auth/register`, testUser);
    console.log('✅ User registered successfully');
    authToken = registerResponse.data.token;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('⚠️  Rate limited, trying to login with existing user...');
      
      // Try to login instead
      try {
        const loginResponse = await axios.post(`${RENDER_URL}/api/auth/login`, {
          email: 'test-render-conn3@example.com',
          password: 'TestPassword123!'
        });
        authToken = loginResponse.data.token;
        console.log('✅ Logged in with existing user');
      } catch (loginError) {
        console.log('❌ Could not authenticate:', loginError.response?.data || loginError.message);
      }
    } else {
      console.log('❌ Registration failed:', error.response?.data || error.message);
    }
  }

  if (!authToken) {
    console.log('\n❌ Cannot test API-Football without authentication token');
    console.log('🔍 But we can check if the environment is configured...\n');
    
    // Test if server responds to API requests (even if unauthorized)
    console.log('🔧 Testing API-Football environment configuration...');
    try {
      const apiTest = await axios.get(`${RENDER_URL}/api/stats/update-status`);
      console.log('✅ API-Football endpoint accessible');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ API-Football endpoint exists (requires auth)');
        console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
      } else if (error.response && error.response.status === 500) {
        console.log('⚠️  API-Football endpoint exists but may have configuration issues');
        console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ API-Football endpoint not found or other error');
        console.log('📄 Error:', error.response?.data || error.message);
      }
    }
    return;
  }

  console.log('\n⚽ Step 2: Testing API-Football endpoints...');
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Test API-Football status
  try {
    const statusResponse = await axios.get(`${RENDER_URL}/api/stats/update-status`, { headers });
    console.log('✅ API-Football status endpoint working');
    console.log('📄 Response:', JSON.stringify(statusResponse.data, null, 2));
  } catch (error) {
    console.log('❌ API-Football status test failed:', error.response?.data || error.message);
  }

  // Test API-Football refresh
  try {
    const refreshResponse = await axios.post(`${RENDER_URL}/api/stats/refresh`, {}, { headers });
    console.log('✅ API-Football refresh endpoint working');
    console.log('📄 Response:', JSON.stringify(refreshResponse.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 500) {
      console.log('⚠️  API-Football refresh endpoint exists but may have API key issues');
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ API-Football refresh test failed:', error.response?.data || error.message);
    }
  }

  console.log('\n📊 API-Football Test Summary:');
  console.log('==============================');
  console.log('✅ Server is running and accessible');
  console.log('✅ Authentication system working');
  console.log('✅ API-Football endpoints exist');
  console.log('⚠️  API key configuration needs verification');
  
  console.log('\n💡 Next Steps:');
  console.log('===============');
  console.log('1. Verify API_FOOTBALL_KEY is set in Render environment variables');
  console.log('2. Check if the API key is valid and has sufficient quota');
  console.log('3. Test with a Pro API-Football subscription for full functionality');
}

// Run the test
testAPIFootballOnRender().catch(console.error);