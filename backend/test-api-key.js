const axios = require('axios');

// Test what's available for current season 2024/2025
async function testCurrentSeasonData() {
  const apiKey = '6eb7b76c1b1c2aa43745df9c0b4923c3';
  
  console.log('🏆 API-Football Seizoen 2024/2025 Test...\n');
  
  const baseConfig = {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'v3.football.api-sports.io'
    }
  };
  
  try {
    // 1. Check current season availability
    console.log('📅 Seizoen 2024/2025 beschikbaarheid...');
    
    const currentSeasonTests = [
      {
        name: 'Premier League 2024/2025',
        league: 39,
        season: 2024
      },
      {
        name: 'La Liga 2024/2025', 
        league: 140,
        season: 2024
      },
      {
        name: 'Bundesliga 2024/2025',
        league: 78,
        season: 2024
      },
      {
        name: 'Serie A 2024/2025',
        league: 135,
        season: 2024
      },
      {
        name: 'Ligue 1 2024/2025',
        league: 61,
        season: 2024
      },
      {
        name: 'Eredivisie 2024/2025',
        league: 88,
        season: 2024
      }
    ];
    
    for (const test of currentSeasonTests) {
      try {
        // Test teams
        const teamsResponse = await axios.get('https://v3.football.api-sports.io/teams', {
          ...baseConfig,
          params: { league: test.league, season: test.season }
        });
        
        // Test fixtures
        const fixturesResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
          ...baseConfig,
          params: { league: test.league, season: test.season }
        });
        
        // Test standings
        const standingsResponse = await axios.get('https://v3.football.api-sports.io/standings', {
          ...baseConfig,
          params: { league: test.league, season: test.season }
        });
        
        console.log(`✅ ${test.name}:`);
        console.log(`   Teams: ${teamsResponse.data.results}`);
        console.log(`   Wedstrijden: ${fixturesResponse.data.results}`);
        console.log(`   Stand: ${standingsResponse.data.results > 0 ? 'Beschikbaar' : 'Niet beschikbaar'}`);
        
        // Show some example data
        if (teamsResponse.data.response && teamsResponse.data.response.length > 0) {
          const exampleTeams = teamsResponse.data.response.slice(0, 3).map(item => item.team.name);
          console.log(`   📝 Teams: ${exampleTeams.join(', ')}`);
        }
        
        if (fixturesResponse.data.response && fixturesResponse.data.response.length > 0) {
          const recentMatch = fixturesResponse.data.response[0];
          const date = new Date(recentMatch.fixture.date).toLocaleDateString('nl-NL');
          console.log(`   ⚽ Laatste wedstrijd: ${recentMatch.teams.home.name} vs ${recentMatch.teams.away.name} (${date})`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${test.name}: Fout ${error.response?.status || 'Unknown'}`);
        if (error.response?.data?.message) {
          console.log(`   Bericht: ${error.response.data.message}`);
        }
        console.log('');
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // 2. Test what would be available with PRO plan
    console.log('\n🚀 WAT ZOU BESCHIKBAAR ZIJN MET PRO PLAN:\n');
    
    console.log('✅ SEIZOEN 2024/2025 DATA:');
    console.log('   • Alle teams en spelers van huidige seizoen');
    console.log('   • Live wedstrijden en uitslagen');
    console.log('   • Real-time statistieken updates');
    console.log('   • Speler prestaties per wedstrijd');
    console.log('   • Team statistieken en rankings');
    console.log('   • Live standen en tabellen');
    
    console.log('\n🔍 SPELER ZOEKEN & STATISTIEKEN:');
    console.log('   • Zoeken op speler naam (Haaland, Mbappe, etc.)');
    console.log('   • Volledige speler profielen');
    console.log('   • Goals, assists, speeltijd per wedstrijd');
    console.log('   • Seizoen statistieken en gemiddeldes');
    console.log('   • Transfer geschiedenis');
    console.log('   • Blessure status');
    
    console.log('\n⚽ AUTOMATISCHE PROFIEL UPDATES:');
    console.log('   • Real-time statistieken na elke wedstrijd');
    console.log('   • Automatische profiel synchronisatie');
    console.log('   • Live prestatie tracking');
    console.log('   • Seizoen voortgang monitoring');
    
    console.log('\n📊 GEAVANCEERDE FEATURES:');
    console.log('   • Team vs team vergelijkingen');
    console.log('   • Voorspellingen en odds');
    console.log('   • Live events (goals, kaarten, wissels)');
    console.log('   • Coach en opstelling informatie');
    
    // 3. Show current API usage
    const statusResponse = await axios.get('https://v3.football.api-sports.io/status', baseConfig);
    if (statusResponse.data.response) {
      const status = statusResponse.data.response;
      console.log('\n📈 HUIDIGE API STATUS (GRATIS):');
      console.log(`   🔄 Requests gebruikt: ${status.requests?.current || 'Onbekend'}/${status.requests?.limit_day || 100}`);
      console.log(`   ⏱️ Rate limit: ${status.requests?.limit_minute || 'Onbekend'} per minuut`);
      console.log(`   💳 Plan: ${status.subscription?.plan || 'Free'}`);
    }
    
    console.log('\n💰 PRO PLAN VOORDELEN:');
    console.log('   📈 150.000 requests/dag (1500x meer)');
    console.log('   ⚡ 900 requests/minuut rate limit');
    console.log('   🏆 Alle seizoenen beschikbaar');
    console.log('   🔍 Volledige speler database');
    console.log('   📊 Real-time statistieken');
    console.log('   💵 $39/maand');
    
  } catch (error) {
    console.error('❌ Fout bij seizoen test:', error.message);
  }
}

testCurrentSeasonData();