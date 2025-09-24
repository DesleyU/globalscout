const fetch = require('node-fetch');

async function testJohnDoeStats() {
  try {
    console.log('🔍 Testing John Doe statistics API...\n');

    // Login as Desley
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'desley_u@hotmail.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Logged in as Desley');

    // Use John Doe's known user ID
    const johnDoeId = 'cmftnz1kj00007kjbn8k2g9nl';
    console.log(`👤 Using John Doe ID: ${johnDoeId}`);

    // Test fetching John Doe's stats
    const statsResponse = await fetch(`http://localhost:5000/api/stats/user/${johnDoeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📊 Stats response status:', statsResponse.status);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const statsData = await statsResponse.json();
    console.log('📊 John Doe stats data:');
    console.log('- Tier:', statsData.tier);
    console.log('- Stats count:', statsData.stats?.length || 0);
    console.log('- Total seasons:', statsData.totalSeasons);
    
    if (statsData.stats && statsData.stats.length > 0) {
      console.log('\n📈 Statistics details:');
      statsData.stats.forEach(stat => {
        console.log(`  - ${stat.season}: ${stat.goals || stat.goalsTotal || 0} goals, ${stat.assists || stat.goalsAssists || 0} assists, ${stat.appearances || stat.gamesAppearances || 0} games`);
      });
    } else {
      console.log('ℹ️ No statistics found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testJohnDoeStats();