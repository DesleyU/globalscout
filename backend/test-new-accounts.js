// Quick test for the new test accounts
const API_BASE = 'http://localhost:5000/api';

const testAccounts = [
  { email: 'test.basic@example.com', password: 'testpassword123', expectedType: 'BASIC' },
  { email: 'test.premium@example.com', password: 'testpassword123', expectedType: 'PREMIUM' }
];

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Authorization': `Bearer ${token}` }
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

async function testNewAccounts() {
  console.log('🧪 Testing nieuwe test accounts...\n');

  for (const account of testAccounts) {
    console.log(`👤 Testing ${account.expectedType} account: ${account.email}`);
    
    const token = await loginUser(account.email, account.password);
    if (!token) {
      console.log('❌ Login failed\n');
      continue;
    }
    console.log('✅ Login successful');

    const accountInfo = await getAccountInfo(token);
    if (!accountInfo) {
      console.log('❌ Failed to get account info\n');
      continue;
    }

    console.log(`📊 Account Type: ${accountInfo.data.accountType}`);
    console.log(`📈 Available Stats: ${JSON.stringify(accountInfo.data.limits.statsFields)}`);
    
    if (accountInfo.data.accountType === account.expectedType) {
      console.log('✅ Account type correct!');
    } else {
      console.log(`❌ Account type mismatch! Expected: ${account.expectedType}, Got: ${accountInfo.data.accountType}`);
    }
    
    console.log('─'.repeat(50));
  }

  console.log('\n🎉 Test complete! Je kunt nu inloggen in de frontend met deze accounts.');
}

testNewAccounts().catch(console.error);