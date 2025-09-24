// Using built-in fetch (Node.js 18+)

const API_BASE = 'http://localhost:5000/api';

// Test users from our seed data
const testUsers = [
  { email: 'john.doe@example.com', password: 'password123', name: 'John Doe', expectedAccountType: 'BASIC' },
  { email: 'desley.ubbink@example.com', password: 'password123', name: 'Desley Ubbink', expectedAccountType: 'PREMIUM' }
];

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.message);
    return null;
  }
}

async function getAccountInfo(token) {
  try {
    const response = await fetch(`${API_BASE}/account/info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get account info: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to get account info:', error.message);
    return null;
  }
}

async function getUserStats(token, userId) {
  try {
    const response = await fetch(`${API_BASE}/stats/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user stats: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to get user stats:', error.message);
    return null;
  }
}

async function upgradeAccount(token) {
  try {
    const response = await fetch(`${API_BASE}/account/upgrade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to upgrade account: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Failed to upgrade account:', error.message);
    return null;
  }
}

async function testAccountTypeSystem() {
  console.log('🧪 Testing Account Type System\n');

  for (const user of testUsers) {
    console.log(`\n👤 Testing user: ${user.name} (${user.email})`);
    console.log(`Expected account type: ${user.expectedAccountType}`);
    
    // 1. Login
    const token = await loginUser(user.email, user.password);
    if (!token) {
      console.log('❌ Skipping user due to login failure\n');
      continue;
    }
    console.log('✅ Login successful');

    // 2. Get account info
    const accountInfo = await getAccountInfo(token);
    if (!accountInfo) {
      console.log('❌ Failed to get account info\n');
      continue;
    }
    
    console.log(`📊 Account Type: ${accountInfo.data.accountType}`);
    console.log(`📈 Available Stats Fields: ${JSON.stringify(accountInfo.data.limits.statsFields)}`);
    
    // Verify expected account type
    if (accountInfo.data.accountType === user.expectedAccountType) {
      console.log('✅ Account type matches expected');
    } else {
      console.log(`❌ Account type mismatch! Expected: ${user.expectedAccountType}, Got: ${accountInfo.data.accountType}`);
    }

    // 3. Get user stats (own stats)
    const stats = await getUserStats(token, accountInfo.data.id);
    if (stats) {
      console.log(`📈 Stats Account Type: ${stats.accountType}`);
      console.log(`📊 Available Fields: ${stats.availableFields}`);
      console.log(`📋 Number of stat records: ${stats.data ? stats.data.length : 0}`);
      
      if (stats.data && stats.data.length > 0) {
        const firstStat = stats.data[0];
        console.log(`🎯 Sample stats: Goals: ${firstStat.goals}, Assists: ${firstStat.assists}, Minutes: ${firstStat.minutes}`);
      }
    }

    // 4. Test account upgrade (only for BASIC users)
    if (accountInfo.data.accountType === 'BASIC') {
      console.log('\n🔄 Testing account upgrade...');
      const upgradeResult = await upgradeAccount(token);
      if (upgradeResult) {
        console.log('✅ Account upgrade successful');
        console.log(`📊 New Account Type: ${upgradeResult.data.accountType}`);
        
        // Get updated account info
        const updatedAccountInfo = await getAccountInfo(token);
        if (updatedAccountInfo) {
          console.log(`📈 Updated Available Stats Fields: ${JSON.stringify(updatedAccountInfo.data.limits.statsFields)}`);
        }
      }
    }

    console.log('─'.repeat(50));
  }

  console.log('\n🎉 Account Type System Test Complete!');
}

// Run the test
testAccountTypeSystem().catch(console.error);