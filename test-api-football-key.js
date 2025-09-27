const axios = require('axios');

// Test the API Football key directly
async function testApiFootballKey() {
  const apiKey = '6eb7b76c1b1c2aa43745df9c0b4923c3';
  
  console.log('🔍 Testing API Football key...\n');
  
  try {
    // Test with a simple API call to get leagues
    const response = await axios.get('https://v3.football.api-sports.io/leagues', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      },
      params: {
        season: 2024,
        country: 'Netherlands'
      }
    });
    
    console.log('✅ API Football key is working!');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📈 Results: ${response.data.results} leagues found`);
    console.log(`🔄 API Calls remaining: ${response.headers['x-ratelimit-requests-remaining'] || 'Unknown'}`);
    
    if (response.data.response && response.data.response.length > 0) {
      console.log('\n🏆 Sample league:');
      const league = response.data.response[0];
      console.log(`   Name: ${league.league.name}`);
      console.log(`   Country: ${league.country.name}`);
      console.log(`   Season: ${league.seasons[0]?.year || 'Unknown'}`);
    }
    
  } catch (error) {
    console.error('❌ API Football key test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      console.error(`   Errors: ${JSON.stringify(error.response.data?.errors || {}, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }
}

testApiFootballKey();