🔹 A Record (hoofddomain):
   Naam: @ (of laat leeg)
   Waarde: 75.2.60.5
   TTL: 300

🔹 CNAME Record (www):
   Naam: www  
   Waarde: globalscout-app.netlify.app
   TTL: 300#!/usr/bin/env node

const https = require('https');

// Test your live Render deployment
const RENDER_URL = process.argv[2] || 'https://your-app.onrender.com';

console.log(`🔍 Testing live deployment: ${RENDER_URL}\n`);

function makeRequest(url, description) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ ${description}:`);
                    console.log(JSON.stringify(jsonData, null, 2));
                    resolve(jsonData);
                } catch (error) {
                    console.log(`✅ ${description} (Raw response):`);
                    console.log(data);
                    resolve(data);
                }
            });
        });
        
        request.on('error', (error) => {
            console.log(`❌ ${description} failed:`);
            console.log(error.message);
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            console.log(`⏰ ${description} timed out`);
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function testDeployment() {
    console.log('🏥 Testing Health Check...');
    try {
        await makeRequest(`${RENDER_URL}/health`, 'Health Check');
    } catch (error) {
        console.log('❌ Health check failed - deployment might not be ready');
    }
    
    console.log('\n📚 Testing API Documentation...');
    try {
        await makeRequest(`${RENDER_URL}/api/docs`, 'API Documentation');
    } catch (error) {
        console.log('❌ API docs failed');
    }
    
    console.log('\n🔐 Testing Registration (to check database)...');
    try {
        // Test registration to see if database works
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'player',
            position: 'midfielder',
            age: 25
        };
        
        const postData = JSON.stringify(testUser);
        
        const options = {
            hostname: RENDER_URL.replace('https://', ''),
            port: 443,
            path: '/api/auth/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (response.statusCode === 201) {
                        console.log('✅ Database connection working - registration successful');
                        console.log('User created:', result.user?.email);
                    } else {
                        console.log('⚠️ Registration response:', result);
                    }
                } catch (error) {
                    console.log('❌ Database connection failed:', data);
                }
            });
        });
        
        request.on('error', (error) => {
            console.log('❌ Registration test failed:', error.message);
        });
        
        request.write(postData);
        request.end();
        
    } catch (error) {
        console.log('❌ Registration test error:', error.message);
    }
}

// Instructions
console.log('📋 DEPLOYMENT DIAGNOSIS\n');
console.log('Usage: node test-live-deployment.js https://your-app.onrender.com\n');

if (process.argv[2]) {
    testDeployment();
} else {
    console.log('❌ Please provide your Render URL as argument');
    console.log('Example: node test-live-deployment.js https://globalscout-backend.onrender.com');
}

console.log('\n🔧 COMMON FIXES:');
console.log('1. Database not connected:');
console.log('   - Check DATABASE_URL in Render environment variables');
console.log('   - Verify Supabase project is active');
console.log('');
console.log('2. API Football not connected:');
console.log('   - Add API_FOOTBALL_KEY environment variable in Render');
console.log('   - Get key from: https://www.api-football.com/');
console.log('');
console.log('3. Environment variables missing:');
console.log('   - Go to Render Dashboard → Your Service → Environment');
console.log('   - Add all required variables from .env.render file');