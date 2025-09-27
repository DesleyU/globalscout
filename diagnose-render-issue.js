#!/usr/bin/env node

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function diagnoseRenderIssue() {
  console.log('🔍 Diagnose Render Issues');
  console.log('==========================');
  console.log(`🎯 Testing: ${RENDER_URL}`);
  console.log('');

  // Test 1: Health Check
  console.log('🏥 Test 1: Health Check...');
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health Check OK - Status:', healthResponse.status);
    console.log('📄 Response:', JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📄 Error Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
  console.log('');

  // Test 2: API Docs
  console.log('📚 Test 2: API Documentation...');
  try {
    const docsResponse = await axios.get(`${RENDER_URL}/api/docs`);
    console.log('✅ API Docs OK - Status:', docsResponse.status);
  } catch (error) {
    console.log('⚠️  API Docs Status:', error.response?.status || error.message);
    if (error.response?.status === 301 || error.response?.status === 302) {
      console.log('📄 Redirect detected (normal for docs)');
    }
  }
  console.log('');

  // Test 3: Registration with minimal data
  console.log('🔐 Test 3: Registration Test (minimal data)...');
  try {
    const regResponse = await axios.post(`${RENDER_URL}/api/auth/register`, {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User'
    });
    console.log('✅ Registration OK - Status:', regResponse.status);
    console.log('📄 Response:', JSON.stringify(regResponse.data, null, 2));
  } catch (error) {
    console.log('⚠️  Registration Status:', error.response?.status || error.message);
    console.log('📄 Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.log('💡 Validation error - this is normal, means database is working');
    } else if (error.response?.status === 429) {
      console.log('💡 Rate limited - this is normal, means server is working');
    } else if (error.response?.status === 500) {
      console.log('🚨 Internal server error - this indicates a problem');
    }
  }
  console.log('');

  // Test 4: Registration with complete data
  console.log('🔐 Test 4: Registration Test (complete data)...');
  try {
    const regResponse = await axios.post(`${RENDER_URL}/api/auth/register`, {
      email: `test-complete-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      role: 'PLAYER',
      position: 'FORWARD',
      age: 25
    });
    console.log('✅ Complete Registration OK - Status:', regResponse.status);
    console.log('📄 Response:', JSON.stringify(regResponse.data, null, 2));
  } catch (error) {
    console.log('⚠️  Complete Registration Status:', error.response?.status || error.message);
    console.log('📄 Error Response:', JSON.stringify(error.response?.data, null, 2));
  }
  console.log('');

  // Test 5: Stats endpoint
  console.log('📊 Test 5: Stats Endpoint...');
  try {
    const statsResponse = await axios.get(`${RENDER_URL}/api/stats/update-status`);
    console.log('✅ Stats Endpoint OK - Status:', statsResponse.status);
    console.log('📄 Response:', JSON.stringify(statsResponse.data, null, 2));
  } catch (error) {
    console.log('⚠️  Stats Endpoint Status:', error.response?.status || error.message);
    console.log('📄 Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 401) {
      console.log('💡 Authentication required - this is normal');
    } else if (error.response?.status === 500) {
      console.log('🚨 Internal server error - this indicates a problem');
    }
  }
  console.log('');

  // Test 6: Environment check via a simple endpoint
  console.log('🔧 Test 6: Environment Variables Check...');
  try {
    // Try to access a route that might give us environment info
    const envResponse = await axios.get(`${RENDER_URL}/api/health`);
    console.log('✅ Environment accessible via health endpoint');
  } catch (error) {
    console.log('⚠️  Environment check failed:', error.response?.status || error.message);
  }
  console.log('');

  console.log('🎯 Diagnose Summary:');
  console.log('====================');
  console.log('');
  console.log('🔍 Mogelijke problemen:');
  console.log('1. Database connection issues');
  console.log('2. Missing environment variables');
  console.log('3. API key not properly set');
  console.log('4. Prisma schema issues');
  console.log('5. Rate limiting active');
  console.log('');
  console.log('💡 Volgende stappen:');
  console.log('1. Check Render logs voor specifieke errors');
  console.log('2. Verifieer environment variables in Render dashboard');
  console.log('3. Test database connection direct');
  console.log('4. Check of alle dependencies correct zijn gedeployed');
  console.log('');
}

diagnoseRenderIssue().catch(console.error);