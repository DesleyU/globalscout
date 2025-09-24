async function testOtherUserStats() {
  try {
    console.log('🔍 Testing other user statistics API...\n');

    // Login as Desley
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'desley_u@hotmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Logged in as Desley');

    // Get all users to find another user ID
    const usersResponse = await fetch('http://localhost:3001/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const usersData = await usersResponse.json();
    const users = usersData.users || usersData;
    console.log(`📋 Found ${users.length} users`);

    // Find a different user (not Desley)
    const otherUser = users.find(user => 
      user.email !== 'desley_u@hotmail.com' && 
      user.role === 'PLAYER'
    );

    if (!otherUser) {
      console.log('❌ No other player users found');
      return;
    }

    console.log(`👤 Testing with user: ${otherUser.email} (ID: ${otherUser.id})`);

    // Test fetching other user's stats
    try {
      const statsResponse = await fetch(`http://localhost:3001/api/stats/user/${otherUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('\n📊 Other user stats response:');
      console.log('Status:', statsResponse.status);
      
      const statsData = await statsResponse.json();
      console.log('Data:', JSON.stringify(statsData, null, 2));

      if (statsData.stats && statsData.stats.length > 0) {
        console.log(`✅ Found ${statsData.stats.length} statistics records`);
        
        // Show seasons available
        const seasons = [...new Set(statsData.stats.map(s => s.season))];
        console.log('📅 Available seasons:', seasons);
      } else {
        console.log('ℹ️ No statistics found for this user');
      }

    } catch (statsError) {
      console.log('\n❌ Error fetching other user stats:');
      console.log('Error:', statsError.message);
    }

    // Also test with a user that definitely has stats (Desley's own stats)
    console.log('\n🔄 Testing Desley\'s own stats for comparison...');
    const myStatsResponse = await fetch('http://localhost:3001/api/stats/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const myStatsData = await myStatsResponse.json();
    console.log('📊 My stats response:');
    console.log('Status:', myStatsResponse.status);
    console.log('Stats count:', myStatsData.stats?.length || 0);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testOtherUserStats();