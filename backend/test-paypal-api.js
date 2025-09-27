require('dotenv').config();
const paypalService = require('./src/services/paypalService');

async function testPayPalAPI() {
    console.log('Testing PayPal API connectivity...');
    console.log('PayPal Client ID:', process.env.PAYPAL_CLIENT_ID ? 'Present' : 'Missing');
    console.log('PayPal Client Secret:', process.env.PAYPAL_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('PayPal Mode:', process.env.PAYPAL_MODE);
    console.log('PayPal Currency:', process.env.PAYPAL_CURRENCY);
    console.log('PayPal Premium Amount:', process.env.PAYPAL_PREMIUM_AMOUNT);

    try {
        console.log('\nCreating test PayPal order using PayPal service...');
        
        const orderData = {
            userId: 'test_user_123',
            email: 'test@example.com',
            amount: '9.99'
        };

        const result = await paypalService.createOrder(orderData);
        
        console.log('✅ PayPal API test successful!');
        console.log('Order ID:', result.orderId);
        console.log('Approval URL:', result.approvalUrl);
        console.log('Full result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('\n❌ PayPal API Error:', error.message);
        console.error('Full error:', error);
        
        // Check if it's a network/auth issue
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            console.error('\n🔑 This looks like an authentication issue. Check your PayPal credentials.');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
            console.error('\n🚫 This looks like a permissions issue. Check your PayPal app permissions.');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
            console.error('\n🌐 This looks like a network connectivity issue.');
        }
    }
}

testPayPalAPI();