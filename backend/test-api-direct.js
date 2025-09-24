const apiFootballService = require('./src/services/apiFootballService');

async function testApiDirect() {
  try {
    console.log('🔍 Testing API-Football service directly...\n');
    
    const playerId = 61415;
    const season = 2023;
    
    console.log(`Testing player ID: ${playerId}, season: ${season}`);
    
    // Test getPlayerStatistics
    console.log('\n1. Testing getPlayerStatistics...');
    const statsResponse = await apiFootballService.getPlayerStatistics(playerId, season);
    console.log(`✅ Full API response: ${JSON.stringify(statsResponse, null, 2)}`);
    
    const stats = statsResponse.response || [];
    console.log(`✅ Statistics found: ${stats.length} records`);
    
    if (stats.length > 0) {
      stats.forEach((stat, index) => {
        console.log(`   ${index + 1}. Player: ${stat.player?.name}`);
        stat.statistics?.forEach((statistic, statIndex) => {
          console.log(`      ${statIndex + 1}. League: ${statistic.league?.name}, Team: ${statistic.team?.name}`);
          console.log(`         Games: ${statistic.games?.appearences || 0}, Goals: ${statistic.goals?.total || 0}`);
        });
      });
    } else {
      console.log('   No statistics found');
    }
    
    // Test getPlayerById
    console.log('\n2. Testing getPlayerById...');
    const playerInfo = await apiFootballService.getPlayerById(playerId, season);
    console.log(`✅ Player info: ${JSON.stringify(playerInfo, null, 2)}`);
    
    // Test with different seasons
    console.log('\n3. Testing different seasons...');
    const seasons = [2024, 2023, 2022, 2021];
    
    for (const testSeason of seasons) {
      console.log(`\n   Testing season ${testSeason}:`);
      const seasonStatsResponse = await apiFootballService.getPlayerStatistics(playerId, testSeason);
      const seasonStats = seasonStatsResponse.response || [];
      console.log(`   Found ${seasonStats.length} records for season ${testSeason}`);
      
      if (seasonStats.length > 0) {
        seasonStats.forEach((stat, index) => {
          stat.statistics?.forEach((statistic, statIndex) => {
            console.log(`     ${index + 1}.${statIndex + 1}. League: ${statistic.league?.name}, Games: ${statistic.games?.appearences || 0}`);
          });
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testApiDirect();