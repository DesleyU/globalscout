const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testLoginAndRefresh() {
  try {
    console.log('🔐 Testing login and refresh functionality...\n');
    
    // Step 1: Login with Desley's credentials
    console.log('1. Attempting login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'desley_u@hotmail.com',
      password: 'password123' // Assuming this is the password
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Login successful!');
      const token = loginResponse.data.token;
      console.log(`   Token: ${token.substring(0, 20)}...`);
      
      // Step 2: Get current user profile
      console.log('\n2. Getting user profile...');
      const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const user = profileResponse.data.user || profileResponse.data;
      console.log(`✅ Profile retrieved!`);
      console.log(`   User data: ${JSON.stringify(user, null, 2)}`);
      console.log(`   Player ID: ${user.playerId || 'NOT SET'}`);
      console.log(`   Role: ${user.role}`);
      
      // Step 3: Check current stats
      console.log('\n3. Checking current statistics...');
      try {
        const statsResponse = await axios.get(`${BASE_URL}/api/stats/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`✅ Current stats: ${statsResponse.data.stats?.length || 0} records found`);
        if (statsResponse.data.stats?.length > 0) {
          statsResponse.data.stats.forEach((stat, index) => {
            console.log(`   ${index + 1}. Season: ${stat.season}, League: ${stat.leagueName}`);
          });
        }
      } catch (error) {
        console.log(`❌ Error getting stats: ${error.response?.data?.message || error.message}`);
      }
      
      // Step 4: Try to refresh statistics
      console.log('\n4. Attempting to refresh statistics...');
      try {
        const refreshResponse = await axios.post(`${BASE_URL}/api/stats/refresh`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('✅ Refresh successful!');
        console.log(`   Response: ${JSON.stringify(refreshResponse.data, null, 2)}`);
        
        // Step 5: Check stats again after refresh
        console.log('\n5. Checking statistics after refresh...');
        const newStatsResponse = await axios.get(`${BASE_URL}/api/stats/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log(`✅ Stats after refresh: ${newStatsResponse.data.stats?.length || 0} records found`);
        if (newStatsResponse.data.stats?.length > 0) {
          newStatsResponse.data.stats.forEach((stat, index) => {
            console.log(`   ${index + 1}. Season: ${stat.season}, League: ${stat.leagueName}, Goals: ${stat.goals}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error refreshing stats: ${error.response?.data?.message || error.message}`);
        if (error.response?.data) {
          console.log(`   Full error response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
      }
      
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error during login:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log(`Full error response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

testLoginAndRefresh();