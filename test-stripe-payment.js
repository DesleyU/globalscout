// Using built-in fetch (Node.js 18+)

const API_URL = 'http://localhost:5000/api';

// Test credentials (you should have these from previous tests)
const TEST_EMAIL = 'john.doe@example.com';
const TEST_PASSWORD = 'password123';

async function testStripePayment() {
  try {
    console.log('🧪 Testing Stripe Payment Integration...\n');

    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    const token = loginData.data?.token || loginData.token;
    console.log('✅ Login successful');

    // Step 2: Get payment configuration
    console.log('\n2. Getting payment configuration...');
    const configResponse = await fetch(`${API_URL}/payment/config`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!configResponse.ok) {
      throw new Error(`Config failed: ${configResponse.status}`);
    }

    const configData = await configResponse.json();
    console.log('✅ Payment config retrieved:', {
      publishableKey: configData.data.publishableKey ? 'Present' : 'Missing',
      monthlyPrice: configData.data.monthlyPrice
    });

    // Step 3: Create payment intent
    console.log('\n3. Creating payment intent...');
    const intentResponse = await fetch(`${API_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 9.99,
        currency: 'eur'
      })
    });

    if (!intentResponse.ok) {
      const errorData = await intentResponse.json();
      throw new Error(`Payment intent failed: ${intentResponse.status} - ${errorData.error}`);
    }

    const intentData = await intentResponse.json();
    console.log('✅ Payment intent created:', {
      clientSecret: intentData.data.clientSecret ? 'Present' : 'Missing',
      amount: intentData.data.amount,
      currency: intentData.data.currency
    });

    // Step 4: Check current account status
    console.log('\n4. Checking account status...');
    const accountResponse = await fetch(`${API_URL}/account/info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!accountResponse.ok) {
      throw new Error(`Account info failed: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    console.log('✅ Account status:', {
      accountType: accountData.data.accountType,
      email: accountData.data.email
    });

    console.log('\n🎉 All Stripe payment endpoints are working correctly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set up real Stripe test keys in .env');
    console.log('   2. Test the payment flow in the browser');
    console.log('   3. Verify webhook handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testStripePayment();