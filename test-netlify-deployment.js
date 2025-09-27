#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testNetlifyDeployment(netlifyUrl) {
    console.log('🚀 Testing Netlify Deployment...\n');
    
    const tests = [
        {
            name: 'Frontend Accessibility',
            test: () => testUrl(netlifyUrl),
            critical: true
        },
        {
            name: 'SPA Routing (React Router)',
            test: () => testUrl(`${netlifyUrl}/login`),
            critical: true
        },
        {
            name: 'Static Assets Loading',
            test: () => testUrl(`${netlifyUrl}/assets/index-C7tTV2W9.css`),
            critical: false
        },
        {
            name: 'Backend Connection Test',
            test: () => testBackendConnection(netlifyUrl),
            critical: true
        }
    ];

    let passed = 0;
    let failed = 0;
    let criticalFailed = 0;

    for (const test of tests) {
        try {
            console.log(`Testing: ${test.name}...`);
            const result = await test.test();
            
            if (result.success) {
                console.log(`✅ ${test.name}: ${result.message}`);
                passed++;
            } else {
                console.log(`❌ ${test.name}: ${result.message}`);
                failed++;
                if (test.critical) criticalFailed++;
            }
        } catch (error) {
            console.log(`❌ ${test.name}: ${error.message}`);
            failed++;
            if (test.critical) criticalFailed++;
        }
        console.log('');
    }

    // Summary
    console.log('📊 DEPLOYMENT TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔥 Critical Failed: ${criticalFailed}`);
    
    if (criticalFailed === 0) {
        console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
        console.log('Your Globalscout app is live and ready to use!');
        console.log(`\n🌐 Live URL: ${netlifyUrl}`);
        console.log(`🔗 Backend API: https://globalscout-backend-qbyh.onrender.com`);
        console.log(`📚 API Docs: https://globalscout-backend-qbyh.onrender.com/api/docs`);
    } else {
        console.log('\n⚠️  DEPLOYMENT HAS ISSUES');
        console.log('Some critical tests failed. Please check the errors above.');
    }
}

function testUrl(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const req = protocol.get(url, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({
                    success: true,
                    message: `Status ${res.statusCode} - OK`
                });
            } else {
                resolve({
                    success: false,
                    message: `Status ${res.statusCode} - ${res.statusMessage}`
                });
            }
        });

        req.on('error', (error) => {
            resolve({
                success: false,
                message: `Connection error: ${error.message}`
            });
        });

        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                message: 'Request timeout (10s)'
            });
        });
    });
}

async function testBackendConnection(frontendUrl) {
    // Test if frontend can reach backend
    const backendUrl = 'https://globalscout-backend-qbyh.onrender.com/health';
    
    return new Promise((resolve) => {
        https.get(backendUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.status === 'OK') {
                        resolve({
                            success: true,
                            message: 'Backend is reachable and healthy'
                        });
                    } else {
                        resolve({
                            success: false,
                            message: 'Backend responded but not healthy'
                        });
                    }
                } catch (error) {
                    resolve({
                        success: false,
                        message: 'Backend response parsing failed'
                    });
                }
            });
        }).on('error', (error) => {
            resolve({
                success: false,
                message: `Backend connection failed: ${error.message}`
            });
        });
    });
}

// Main execution
if (require.main === module) {
    const netlifyUrl = process.argv[2];
    
    if (!netlifyUrl) {
        console.log('❌ Please provide the Netlify URL as an argument');
        console.log('Usage: node test-netlify-deployment.js https://your-app.netlify.app');
        process.exit(1);
    }
    
    testNetlifyDeployment(netlifyUrl)
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testNetlifyDeployment };