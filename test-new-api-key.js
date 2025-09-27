#!/usr/bin/env node

const axios = require('axios');

// Test de nieuwe API key
async function testNewAPIKey() {
  console.log('🔑 Test Nieuwe API-Football Key');
  console.log('================================');
  
  const NEW_API_KEY = '015322d016c9ab2db54cc49f49736279';
  
  console.log(`🔍 Testing nieuwe API Key: ${NEW_API_KEY.substring(0, 8)}...${NEW_API_KEY.substring(-4)}`);
  console.log('📡 Direct call naar API-Football...\n');

  try {
    // Test 1: Basic API call
    console.log('📋 Test 1: API Status Check');
    const statusResponse = await axios.get('https://v3.football.api-sports.io/status', {
      headers: {
        'X-RapidAPI-Key': NEW_API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });
    
    console.log('✅ API Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    // Test 2: Try to get current season leagues
    console.log('\n📋 Test 2: Current Season Leagues');
    const leaguesResponse = await axios.get('https://v3.football.api-sports.io/leagues', {
      headers: {
        'X-RapidAPI-Key': NEW_API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      },
      params: {
        current: true
      }
    });
    
    console.log('✅ Leagues Response (first 2):');
    const leagues = leaguesResponse.data.response.slice(0, 2);
    console.log(JSON.stringify(leagues, null, 2));
    
    // Test 3: Try to get Premier League teams for 2024/2025
    console.log('\n📋 Test 3: Premier League 2024/2025 Teams');
    const teamsResponse = await axios.get('https://v3.football.api-sports.io/teams', {
      headers: {
        'X-RapidAPI-Key': NEW_API_KEY,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      },
      params: {
        league: 39, // Premier League
        season: 2024
      }
    });
    
    console.log('✅ Premier League Teams Response:');
    console.log(`Teams found: ${teamsResponse.data.response.length}`);
    if (teamsResponse.data.response.length > 0) {
      console.log('First team:', teamsResponse.data.response[0].team.name);
    }
    
    console.log('\n🎉 NIEUWE API KEY WERKT PERFECT!');
    console.log('✅ Status check: OK');
    console.log('✅ Leagues data: OK');
    console.log('✅ Teams data: OK');
    
  } catch (error) {
    console.log('❌ API Test Failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n🚨 PROBLEEM: API Key is ongeldig');
        console.log('💡 OPLOSSING:');
        console.log('1. Controleer of de key correct is gekopieerd');
        console.log('2. Ga naar https://www.api-football.com/');
        console.log('3. Verifieer de key in je dashboard');
      } else if (error.response.status === 429) {
        console.log('\n⚠️  QUOTA BEREIKT: Te veel requests');
        console.log('💡 OPLOSSING:');
        console.log('1. Wacht tot quota reset');
        console.log('2. Check je quota op api-football.com');
      }
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

testNewAPIKey().catch(console.error);