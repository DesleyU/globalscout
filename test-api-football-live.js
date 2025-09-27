#!/usr/bin/env node

const https = require('https');

const RENDER_URL = 'https://globalscout-backend-qbyh.onrender.com';

console.log('🏈 Testing API Football integration on live deployment...\n');

// Test 1: Health check
function testHealth() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Testing health endpoint...');
        
        https.get(`${RENDER_URL}/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('✅ Health check:', result.status);
                    resolve();
                } catch (error) {
                    console.log('❌ Health check failed:', error.message);
                    reject(error);
                }
            });
        }).on('error', reject);
    });
}

// Test 2: Check if API Football endpoints exist
function testApiFootballEndpoints() {
    return new Promise((resolve, reject) => {
        console.log('\n2️⃣ Testing API Football endpoints...');
        
        // Test leagues endpoint
        https.get(`${RENDER_URL}/api/football/leagues`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Leagues endpoint status:', res.statusCode);
                if (res.statusCode === 200) {
                    console.log('✅ API Football endpoints are accessible');
                } else if (res.statusCode === 401) {
                    console.log('🔑 API Football key authentication issue');
                } else if (res.statusCode === 404) {
                    console.log('❌ API Football endpoints not found');
                } else {
                    console.log('⚠️ Unexpected status:', res.statusCode);
                }
                resolve();
            });
        }).on('error', (error) => {
            console.log('❌ API Football test failed:', error.message);
            resolve(); // Don't reject, just log
        });
    });
}

// Test 3: Environment variables check
function testEnvironmentCheck() {
    return new Promise((resolve, reject) => {
        console.log('\n3️⃣ Testing environment configuration...');
        
        https.get(`${RENDER_URL}/api/config/check`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Environment configuration accessible');
                } else {
                    console.log('⚠️ Environment check status:', res.statusCode);
                }
                resolve();
            });
        }).on('error', (error) => {
            console.log('ℹ️ Environment check endpoint not available (normal)');
            resolve();
        });
    });
}

// Run all tests
async function runTests() {
    try {
        await testHealth();
        await testApiFootballEndpoints();
        await testEnvironmentCheck();
        
        console.log('\n🎉 API Football integration test completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Verify API_FOOTBALL_KEY is added in Render dashboard');
        console.log('2. Wait 2-3 minutes for deployment restart');
        console.log('3. Test football data endpoints in your app');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

runTests();