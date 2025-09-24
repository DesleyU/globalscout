const axios = require('axios');

async function testLogin() {
  console.log('🔍 Testing login functionality...\n');
  
  // Test 1: Direct backend API call
  console.log('1. Testing direct backend API call:');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test.basic@example.com',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Direct backend call successful');
    console.log('Response:', {
      message: response.data.message,
      hasToken: !!response.data.token,
      userEmail: response.data.user?.email,
      userRole: response.data.user?.role
    });
  } catch (error) {
    console.log('❌ Direct backend call failed');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log('\n2. Testing frontend proxy call:');
  try {
    const response = await axios.post('http://localhost:5173/api/auth/login', {
      email: 'test.basic@example.com',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Frontend proxy call successful');
    console.log('Response:', {
      message: response.data.message,
      hasToken: !!response.data.token,
      userEmail: response.data.user?.email,
      userRole: response.data.user?.role
    });
  } catch (error) {
    console.log('❌ Frontend proxy call failed');
    console.log('Error:', error.response?.data || error.message);
  }
  
  console.log('\n3. Testing with wrong credentials:');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test.basic@example.com',
      password: 'wrongpassword'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⚠️ Wrong credentials accepted (this should not happen)');
  } catch (error) {
    console.log('✅ Wrong credentials correctly rejected');
    console.log('Error message:', error.response?.data?.error || error.message);
  }
  
  console.log('\n4. Testing with non-existent user:');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('⚠️ Non-existent user accepted (this should not happen)');
  } catch (error) {
    console.log('✅ Non-existent user correctly rejected');
    console.log('Error message:', error.response?.data?.error || error.message);
  }
}

testLogin().catch(console.error);