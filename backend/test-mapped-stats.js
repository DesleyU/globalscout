const axios = require('axios');

async function testMappedStats() {
  try {
    console.log('🔍 Testing mapped statistics API...\n');
    
    // First login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'desley_u@hotmail.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Get user profile to confirm player ID
    console.log('\n2. Getting user profile...');
    const profileResponse = await axios.get('http://localhost:5000/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const user = profileResponse.data.user;
    console.log(`✅ User: ${user.profile?.firstName} ${user.profile?.lastName}`);
    console.log(`   Player ID: ${user.playerId}`);
    
    // Get statistics using the new mapped API
    console.log('\n3. Getting mapped statistics...');
    const statsResponse = await axios.get('http://localhost:5000/api/stats/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const stats = statsResponse.data.stats;
    console.log(`✅ Found ${stats.length} statistics records:`);
    
    stats.forEach((stat, index) => {
      console.log(`\n${index + 1}. ${stat.leagueName} (${stat.season})`);
      console.log(`   Team: ${stat.teamName}`);
      console.log(`   Frontend fields:`);
      console.log(`     Goals: ${stat.goals}`);
      console.log(`     Assists: ${stat.assists}`);
      console.log(`     Minutes: ${stat.minutes}`);
      console.log(`     Appearances: ${stat.appearances}`);
      console.log(`     Yellow Cards: ${stat.yellowCards}`);
      console.log(`     Red Cards: ${stat.redCards}`);
      console.log(`     Rating: ${stat.rating}`);
      console.log(`     Position: ${stat.position}`);
      console.log(`     Passes Accuracy: ${stat.passesAccuracy}%`);
      console.log(`     Tackles Total: ${stat.tacklesTotal}`);
      console.log(`     Tackles Interceptions: ${stat.tacklesInterceptions}`);
      console.log(`     Duels Won: ${stat.duelsWon}`);
      
      console.log(`   Database fields (for comparison):`);
      console.log(`     goalsTotal: ${stat.goalsTotal}`);
      console.log(`     goalsAssists: ${stat.goalsAssists}`);
      console.log(`     gamesMinutes: ${stat.gamesMinutes}`);
      console.log(`     gamesAppearances: ${stat.gamesAppearances}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testMappedStats();