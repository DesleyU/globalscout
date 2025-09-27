#!/usr/bin/env node

const axios = require('axios');

// Test de API key direct via API-Football
async function testAPIKeyDirect() {
  console.log('🔑 Direct API-Football Key Test');
  console.log('================================');
  
  const API_KEY = '6eb7b76c1b1c2aa43745df9c0b4923c3';
  
  console.log(`🔍 Testing API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(-4)}`);
  console.log('📡 Direct call naar API-Football...\n');

  try {
    // Test 1: Basic API call
    console.log('📋 Test 1: Basic API Status');
    const statusResponse = await axios.get('https://v3.football.api-sports.io/status', {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });
    
    console.log('✅ API Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // Test 2: Try to get leagues
    console.log('\n📋 Test 2: Leagues Test');
    const leaguesResponse = await axios.get('https://v3.football.api-sports.io/leagues', {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      },
      params: {
        current: true
      }
    });
    
    console.log('✅ Leagues Response (first 3):');
    const leagues = leaguesResponse.data.response.slice(0, 3);
    console.log(JSON.stringify(leagues, null, 2));
    
  } catch (error) {
    console.log('❌ API Test Failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n🚨 PROBLEEM: API Key is ongeldig of verlopen');
        console.log('💡 OPLOSSING:');
        console.log('1. Ga naar https://www.api-football.com/');
        console.log('2. Log in op je account');
        console.log('3. Controleer je API key');
        console.log('4. Genereer nieuwe key indien nodig');
      } else if (error.response.status === 429) {
        console.log('\n⚠️  QUOTA BEREIKT: Te veel requests');
        console.log('💡 OPLOSSING:');
        console.log('1. Wacht tot quota reset (dagelijks)');
        console.log('2. Upgrade naar Pro plan voor meer quota');
      }
    } else {
      console.log('Network Error:', error.message);
    }
  }

  console.log('\n🔧 Render Environment Check:');
  console.log('==============================');
  console.log('1. 🌐 Ga naar: https://dashboard.render.com');
  console.log('2. 🔍 Zoek "globalscout-backend-qbyh"');
  console.log('3. ⚙️  Klik op "Environment" tab');
  console.log('4. 🔑 Controleer "API_FOOTBALL_KEY"');
  console.log('5. 👁️  Waarde moet zijn: 6eb7b76c1b1c2aa43745df9c0b4923c3');
  console.log('6. 💾 Als niet correct: update en herstart service');

  console.log('\n📊 Quota Check:');
  console.log('================');
  console.log('🌐 Ga naar: https://www.api-football.com/');
  console.log('🔑 Log in met je account');
  console.log('📈 Controleer Dashboard voor:');
  console.log('   - Requests gebruikt vandaag');
  console.log('   - Quota limiet (100/dag gratis)');
  console.log('   - API key status');

  console.log('\n🎯 Als alles werkt lokaal maar niet op Render:');
  console.log('===============================================');
  console.log('1. ✅ API key is geldig');
  console.log('2. ⚠️  Render environment variable probleem');
  console.log('3. 🔄 Herstart Render service');
  console.log('4. 📝 Check spelling van "API_FOOTBALL_KEY"');
  console.log('5. 🔍 Geen extra spaties in de key waarde');
}

testAPIKeyDirect().catch(console.error);