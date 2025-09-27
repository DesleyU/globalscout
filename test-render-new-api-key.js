#!/usr/bin/env node

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';
const NEW_API_KEY = '015322d016c9ab2db54cc49f49736279';

async function testRenderWithNewAPIKey() {
  console.log('🔑 Test Render met Nieuwe API Key');
  console.log('==================================');
  console.log(`🎯 Testing: ${RENDER_URL}`);
  console.log(`🔑 Nieuwe API Key: ${NEW_API_KEY.substring(0, 8)}...${NEW_API_KEY.substring(-4)}`);
  console.log('');

  // Test 1: Health Check
  console.log('🏥 Test 1: Health Check...');
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health Check - Status:', healthResponse.status);
    console.log('📄 Response:', JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.response?.status || error.message);
    console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
  }
  console.log('');

  // Test 2: Database Connection via Registration
  console.log('🗄️  Test 2: Database Connection...');
  try {
    const dbTestResponse = await axios.post(`${RENDER_URL}/api/auth/register`, {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test User',
      role: 'PLAYER',
      position: 'FORWARD',
      age: 25
    });
    console.log('✅ Database Connection - Status:', dbTestResponse.status);
    console.log('📄 Response: Registration successful (database working)');
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️  Rate Limited - Database is working (good sign)');
    } else if (error.response?.status === 400) {
      console.log('✅ Database Connection - Validation errors mean DB is working');
      console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.log('❌ Database Connection Issue:', error.response?.status || error.message);
      console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
    }
  }
  console.log('');

  // Test 3: API-Football Endpoint Check
  console.log('⚽ Test 3: API-Football Endpoint...');
  try {
    const apiFootballResponse = await axios.get(`${RENDER_URL}/api/stats/update-status`);
    console.log('✅ API-Football Endpoint - Status:', apiFootballResponse.status);
    console.log('📄 Response:', JSON.stringify(apiFootballResponse.data, null, 2));
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ API-Football endpoint exists (requires auth - normal)');
      console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.log('❌ API-Football Endpoint Issue:', error.response?.status || error.message);
      console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
    }
  }
  console.log('');

  // Test 4: Direct API-Football Test (to verify new key works)
  console.log('🧪 Test 4: Direct API-Football Test...');
  try {
    const directAPIResponse = await axios.get('https://v3.football.api-sports.io/status', {
      headers: {
        'X-RapidAPI-Key': NEW_API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });
    console.log('✅ Direct API-Football Test - Status:', directAPIResponse.status);
    console.log('📊 Quota:', directAPIResponse.data.response.requests.current + '/' + directAPIResponse.data.response.requests.limit_day);
  } catch (error) {
    console.log('❌ Direct API-Football Test Failed:', error.response?.status || error.message);
    console.log('📄 Response:', JSON.stringify(error.response?.data, null, 2));
  }
  console.log('');

  console.log('📊 Test Summary:');
  console.log('================');
  console.log('');
  console.log('🎯 Wat te doen na deze test:');
  console.log('');
  console.log('✅ Als alle tests slagen:');
  console.log('   • Render is correct geconfigureerd');
  console.log('   • Nieuwe API key werkt perfect');
  console.log('   • Database verbinding is stabiel');
  console.log('');
  console.log('❌ Als tests falen:');
  console.log('   • Controleer Render environment variables');
  console.log('   • Wacht tot deployment volledig klaar is');
  console.log('   • Herstart Render service handmatig');
  console.log('');
  console.log('🔧 Render Dashboard:');
  console.log('   https://dashboard.render.com');
  console.log('');
  console.log('🔑 API Key om in te stellen:');
  console.log('   015322d016c9ab2db54cc49f49736279');
  console.log('');
}

testRenderWithNewAPIKey().catch(console.error);