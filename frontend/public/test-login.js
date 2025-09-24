// Test script to debug login issues
// Run this in the browser console on the login page

async function testBasicLogin() {
  console.log('🔍 Testing BASIC account login...');
  
  try {
    // Test direct API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.basic@example.com',
        password: 'testpassword123'
      })
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response data:', data);
      
      // Test if we can store the token
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}`;
      console.log('🍪 Token stored in cookie');
      
      // Test if we can retrieve user profile
      const profileResponse = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      console.log('👤 Profile response status:', profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Profile data:', profileData);
      } else {
        console.log('❌ Profile request failed');
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

async function testPremiumLogin() {
  console.log('🔍 Testing PREMIUM account login...');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.premium@example.com',
        password: 'testpassword123'
      })
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response data:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run both tests
console.log('🚀 Starting login tests...');
testBasicLogin().then(() => {
  console.log('---');
  return testPremiumLogin();
}).then(() => {
  console.log('🏁 Tests completed');
});