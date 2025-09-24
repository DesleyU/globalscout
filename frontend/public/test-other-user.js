// Test script to check other user statistics
// Run this in browser console after logging in

async function testOtherUserStats() {
  try {
    console.log('🔍 Testing other user statistics...');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No token found. Please log in first.');
      return;
    }
    
    console.log('✅ Token found');
    
    // Get all users
    const usersResponse = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!usersResponse.ok) {
      console.log('❌ Failed to fetch users:', usersResponse.status);
      return;
    }
    
    const usersData = await usersResponse.json();
    const users = usersData.users || usersData;
    console.log(`📋 Found ${users.length} users`);
    
    // Find another player user
    const currentUserEmail = 'desley_u@hotmail.com'; // Assuming logged in as Desley
    const otherUser = users.find(user => 
      user.email !== currentUserEmail && 
      user.role === 'PLAYER'
    );
    
    if (!otherUser) {
      console.log('❌ No other player users found');
      console.log('Available users:', users.map(u => ({ email: u.email, role: u.role, id: u.id })));
      return;
    }
    
    console.log(`👤 Testing with user: ${otherUser.email} (ID: ${otherUser.id})`);
    
    // Test fetching other user's stats
    const statsResponse = await fetch(`/api/stats/user/${otherUser.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('📊 Stats response status:', statsResponse.status);
    
    if (!statsResponse.ok) {
      const errorText = await statsResponse.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const statsData = await statsResponse.json();
    console.log('📊 Stats data:', statsData);
    
    if (statsData.stats && statsData.stats.length > 0) {
      console.log(`✅ Found ${statsData.stats.length} statistics records`);
      const seasons = [...new Set(statsData.stats.map(s => s.season))];
      console.log('📅 Available seasons:', seasons);
    } else {
      console.log('ℹ️ No statistics found for this user');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOtherUserStats();