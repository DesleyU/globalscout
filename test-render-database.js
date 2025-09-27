#!/usr/bin/env node

/**
 * Test Database Connection on Render
 * This script tests the database connection and user lookup on the Render deployment
 */

const axios = require('axios');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection on Render...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${RENDER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test 2: Try to access a simple endpoint that uses database
    console.log('\n2️⃣ Testing database-dependent endpoint...');
    
    // Create a simple test endpoint call that should work
    try {
      const loginResponse = await axios.post(`${RENDER_URL}/api/auth/login`, {
        email: 'test@nonexistent.com',
        password: 'testpassword'
      });
      console.log('❓ Unexpected success:', loginResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('📊 Response status:', error.response.status);
        console.log('📊 Response data:', error.response.data);
        
        if (error.response.status === 401 && error.response.data.error === 'Invalid credentials') {
          console.log('✅ Database connection works - got expected "Invalid credentials" response');
        } else if (error.response.status === 500 && error.response.data.error === 'Internal server error') {
          console.log('❌ Database connection issue - got "Internal server error"');
          console.log('🔧 This suggests a problem with:');
          console.log('   - Database connectivity');
          console.log('   - Prisma client initialization');
          console.log('   - Environment variables');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

    // Test 3: Test with the actual user credentials
    console.log('\n3️⃣ Testing with actual user credentials...');
    try {
      const actualLoginResponse = await axios.post(`${RENDER_URL}/api/auth/login`, {
        email: 'desley_u@hotmail.com',
        password: 'desley123'
      });
      console.log('✅ Login successful!', {
        hasToken: !!actualLoginResponse.data.token,
        hasUser: !!actualLoginResponse.data.user,
        userEmail: actualLoginResponse.data.user?.email
      });
    } catch (error) {
      if (error.response) {
        console.log('❌ Login failed:', error.response.status, error.response.data);
      } else {
        console.log('❌ Network error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDatabaseConnection().then(() => {
  console.log('\n🏁 Database connection test completed');
}).catch(error => {
  console.error('💥 Test script error:', error.message);
});