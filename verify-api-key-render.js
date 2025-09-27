#!/usr/bin/env node

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function verifyAPIKeyOnRender() {
  console.log('🔑 API-Football Key Verificatie op Render');
  console.log('==========================================');
  console.log(`🎯 Testing: ${RENDER_URL}\n`);

  // Method 1: Direct API test via health endpoint
  console.log('📋 Methode 1: Health Check met API info');
  console.log('----------------------------------------');
  try {
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  console.log('\n📋 Methode 2: Test API-Football direct');
  console.log('---------------------------------------');
  
  // Method 2: Test API-Football directly through a public endpoint
  try {
    // Create a simple test endpoint call
    const apiTestResponse = await axios.get(`${RENDER_URL}/api/test-api-football`, {
      timeout: 10000
    });
    console.log('✅ API-Football Test Response:');
    console.log(JSON.stringify(apiTestResponse.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('⚠️  API-Football Test Response (Error):');
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 404) {
        console.log('💡 Endpoint niet gevonden - dit is normaal als de route niet bestaat');
      } else if (error.response.status === 500) {
        console.log('⚠️  Server error - mogelijk API key probleem');
      }
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('\n📋 Methode 3: Environment Variable Check');
  console.log('------------------------------------------');
  
  // Method 3: Try to trigger an error that might reveal environment info
  try {
    const envTestResponse = await axios.post(`${RENDER_URL}/api/debug/env-check`, {
      checkApiKey: true
    });
    console.log('✅ Environment Check Response:');
    console.log(JSON.stringify(envTestResponse.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('💡 Debug endpoint niet beschikbaar (normaal in productie)');
    } else if (error.response) {
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n🔧 Handmatige Verificatie Stappen:');
  console.log('===================================');
  console.log('1. 🌐 Ga naar Render Dashboard: https://dashboard.render.com');
  console.log('2. 🔍 Zoek je GlobalScout service');
  console.log('3. ⚙️  Klik op "Environment" tab');
  console.log('4. 🔑 Controleer of "API_FOOTBALL_KEY" bestaat');
  console.log('5. 👁️  Klik op "Show" om de waarde te zien');
  console.log('6. ✅ Verifieer dat de key begint met een geldige API key format');

  console.log('\n📝 API Key Formaat Check:');
  console.log('==========================');
  console.log('✅ Geldige API key moet:');
  console.log('   - 32-64 karakters lang zijn');
  console.log('   - Alleen letters en cijfers bevatten');
  console.log('   - Geen spaties of speciale tekens hebben');
  console.log('   - Beginnen met een letter of cijfer');

  console.log('\n🧪 Test je API key lokaal:');
  console.log('============================');
  console.log('1. 📁 Open .env.render bestand');
  console.log('2. 🔑 Kopieer de API_FOOTBALL_KEY waarde');
  console.log('3. 🧪 Run: node test-api-key.js');
  console.log('4. ✅ Controleer of de key werkt');

  console.log('\n🔄 Als API key niet werkt:');
  console.log('===========================');
  console.log('1. 🌐 Ga naar: https://www.api-football.com/');
  console.log('2. 🔑 Log in op je account');
  console.log('3. 📊 Controleer je quota (gratis = 100 calls/dag)');
  console.log('4. 🔄 Genereer nieuwe key indien nodig');
  console.log('5. 📝 Update in Render Environment Variables');
  console.log('6. 🔄 Herstart je Render service');

  console.log('\n💰 Voor Pro functionaliteit:');
  console.log('==============================');
  console.log('1. 💳 Upgrade naar Pro plan ($39/maand)');
  console.log('2. 🔑 Krijg nieuwe Pro API key');
  console.log('3. 📝 Update API_FOOTBALL_KEY in Render');
  console.log('4. ✅ Test seizoen 2025/2026 functionaliteit');

  console.log('\n🎯 Quick Test Commands:');
  console.log('========================');
  console.log('# Test lokaal:');
  console.log('node test-api-key.js');
  console.log('');
  console.log('# Test Render deployment:');
  console.log('node test-render-connections.js');
  console.log('');
  console.log('# Test API-Football specifiek:');
  console.log('node test-api-football-render.js');
}

// Run the verification
verifyAPIKeyOnRender().catch(console.error);