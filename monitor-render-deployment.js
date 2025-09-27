
console.log('📊 RENDER DEPLOYMENT MONITOR');
console.log('=============================');
console.log('⏰ Monitor gestart:', new Date().toLocaleString('nl-NL'));
console.log('');

const BACKEND_URL = 'https://globalscout-backend-qbyh.onrender.com';

async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.text();
        
        console.log('🏥 Backend Health Check:');
        console.log('   📊 Status:', response.status);
        console.log('   📊 Response:', data);
        
        return response.ok;
    } catch (error) {
        console.log('❌ Backend Health Error:', error.message);
        return false;
    }
}

async function checkCORSConfiguration() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://globalscout-app.netlify.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type',
            }
        });
        
        console.log('🔒 CORS Configuration Check:');
        console.log('   📊 Preflight Status:', response.status);
        
        const allowOrigin = response.headers.get('access-control-allow-origin');
        console.log('   📊 Allow Origin:', allowOrigin);
        
        if (response.status === 200 || response.status === 204) {
            console.log('   ✅ CORS is correct geconfigureerd!');
            return true;
        } else {
            console.log('   ❌ CORS nog niet correct');
            return false;
        }
    } catch (error) {
        console.log('❌ CORS Check Error:', error.message);
        return false;
    }
}

async function testRegistration() {
    try {
        const testUser = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!',
            firstName: 'Test',
            lastName: 'User'
        };
        
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://globalscout-app.netlify.app'
            },
            body: JSON.stringify(testUser)
        });
        
        console.log('🔧 Registratie Test:');
        console.log('   📊 Status:', response.status);
        
        if (response.ok) {
            console.log('   ✅ REGISTRATIE WERKT!');
            const data = await response.json();
            console.log('   ✅ Gebruiker aangemaakt:', data.user?.username);
            return true;
        } else {
            const errorText = await response.text();
            console.log('   ❌ Registratie gefaald:', errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Registratie Test Error:', error.message);
        return false;
    }
}

async function monitorDeployment() {
    console.log('🔄 Start monitoring Render deployment...');
    console.log('');
    
    let attempts = 0;
    const maxAttempts = 20; // 10 minuten (30 sec intervals)
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`📊 Poging ${attempts}/${maxAttempts} - ${new Date().toLocaleString('nl-NL')}`);
        console.log('----------------------------------------');
        
        const healthOk = await checkBackendHealth();
        
        if (healthOk) {
            const corsOk = await checkCORSConfiguration();
            
            if (corsOk) {
                const registrationOk = await testRegistration();
                
                if (registrationOk) {
                    console.log('');
                    console.log('🎉 DEPLOYMENT SUCCESVOL!');
                    console.log('=========================');
                    console.log('✅ Backend is online');
                    console.log('✅ CORS is correct geconfigureerd');
                    console.log('✅ Registratie werkt!');
                    console.log('');
                    console.log('🚀 Je kunt nu registreren op:');
                    console.log('   👉 https://globalscout-app.netlify.app/register');
                    console.log('');
                    return;
                }
            }
        }
        
        if (attempts < maxAttempts) {
            console.log('⏳ Wacht 30 seconden voor volgende check...');
            console.log('');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('');
    console.log('⚠️ DEPLOYMENT TIMEOUT');
    console.log('======================');
    console.log('De deployment duurt langer dan verwacht.');
    console.log('');
    console.log('💡 Volgende stappen:');
    console.log('   1. Controleer Render Dashboard: https://dashboard.render.com');
    console.log('   2. Zoek naar deployment logs');
    console.log('   3. Probeer handmatig te deployen als nodig');
    console.log('   4. Test registratie later opnieuw');
}

// Start monitoring
monitorDeployment().catch(console.error);