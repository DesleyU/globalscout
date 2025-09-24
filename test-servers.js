#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting Globalscout servers...\n');

// Function to check if a port is available
function checkPort(port, callback) {
    const server = http.createServer();
    server.listen(port, () => {
        server.close(() => {
            callback(true); // Port is available
        });
    });
    server.on('error', () => {
        callback(false); // Port is in use
    });
}

// Function to test if server is responding
function testServer(url, name) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            console.log(`✅ ${name} is responding (Status: ${res.statusCode})`);
            resolve(true);
        }).on('error', (err) => {
            console.log(`❌ ${name} is not responding: ${err.message}`);
            resolve(false);
        });
    });
}

async function main() {
    console.log('📋 Checking server status...\n');
    
    // Check backend (port 5000)
    console.log('🔍 Checking backend server (port 5000)...');
    checkPort(5000, async (available) => {
        if (!available) {
            console.log('⚠️  Port 5000 is in use - backend might already be running');
            await testServer('http://localhost:5000', 'Backend Server');
        } else {
            console.log('📭 Port 5000 is available - backend needs to be started');
            console.log('💡 Run: cd backend && npm start');
        }
    });
    
    // Check frontend (port 5173 - Vite default)
    setTimeout(() => {
        console.log('\n🔍 Checking frontend server (port 5173)...');
        checkPort(5173, async (available) => {
            if (!available) {
                console.log('⚠️  Port 5173 is in use - frontend might already be running');
                await testServer('http://localhost:5173', 'Frontend Server');
            } else {
                console.log('📭 Port 5173 is available - frontend needs to be started');
                console.log('💡 Run: cd frontend && npm start');
            }
            
            console.log('\n📝 Manual Testing Instructions:');
            console.log('1. Backend: cd backend && npm start');
            console.log('2. Frontend: cd frontend && npm start');
            console.log('3. Open: http://localhost:5173');
            console.log('4. Test login with: test.basic@example.com / testpassword123');
            console.log('\n🎯 Test page: http://localhost:5173/test-basic-login.html');
        });
    }, 1000);
}

main().catch(console.error);