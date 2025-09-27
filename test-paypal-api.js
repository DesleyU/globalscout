const { Client, Environment, LogLevel, OrdersController } = require('@paypal/paypal-server-sdk');
require('dotenv').config({ path: './backend/.env' });

async function testPayPalAPI() {
    console.log('Testing PayPal API connectivity...');
    console.log('PayPal Client ID:', process.env.PAYPAL_CLIENT_ID ? 'Present' : 'Missing');
    console.log('PayPal Client Secret:', process.env.PAYPAL_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('PayPal Mode:', process.env.PAYPAL_MODE);

    try {
        // Initialize PayPal client
        const client = new Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: process.env.PAYPAL_CLIENT_ID,
                oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET
            },
            timeout: 0,
            environment: process.env.PAYPAL_MODE === 'live' ? Environment.Production : Environment.Sandbox,
            logging: {
                logLevel: LogLevel.Info,
                logRequest: {
                    logBody: true
                },
                logResponse: {
                    logHeaders: true
                }
            }
        });

        const ordersController = new OrdersController(client);

        // Create a test order
        const request = {
            body: {
                intent: 'CAPTURE',
                purchase_units: [{
                    reference_id: 'test_order_123',
                    amount: {
                        currency_code: 'EUR',
                        value: '9.99'
                    },
                    description: 'Test PayPal Order',
                    custom_id: 'test_user_123',
                    invoice_id: `TEST_${Date.now()}`
                }],
                application_context: {
                    brand_name: 'GlobalScout',
                    landing_page: 'BILLING',
                    user_action: 'PAY_NOW',
                    return_url: 'http://localhost:5173/payment/success',
                    cancel_url: 'http://localhost:5173/payment/cancel'
                }
            }
        };

        console.log('\nCreating test PayPal order...');
        const response = await ordersController.ordersCreate(request);
        
        console.log('Response Status Code:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.result, null, 2));

        if (response.statusCode === 201) {
            console.log('\n✅ PayPal API test successful!');
            console.log('Order ID:', response.result.id);
            console.log('Approval URL:', response.result.links.find(link => link.rel === 'approve')?.href);
        } else {
            console.log('\n❌ PayPal API test failed!');
        }

    } catch (error) {
        console.error('\n❌ PayPal API Error:', error.message);
        console.error('Full error:', error);
    }
}

testPayPalAPI();