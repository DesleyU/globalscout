#!/usr/bin/env node

console.log('⏰ NETLIFY MONITORING - 15 MINUTEN CHECK');
console.log('=========================================');
console.log('🕐 Gestart:', new Date().toLocaleString('nl-NL'));
console.log('');

const WAIT_TIME = 15 * 60 * 1000; // 15 minuten in milliseconds

async function checkDomainStatus() {
    console.log('🔍 CHECKING DOMAIN STATUS...');
    console.log('============================');
    
    const domains = [
        { name: 'globalscout.eu', url: 'https://globalscout.eu' },
        { name: 'www.globalscout.eu', url: 'https://www.globalscout.eu' },
        { name: 'Netlify App', url: 'https://globalscout-app.netlify.app' }
    ];
    
    const results = [];
    
    for (const domain of domains) {
        console.log(`\n🌐 Testing ${domain.name}...`);
        try {
            const startTime = Date.now();
            const response = await fetch(domain.url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            const responseTime = Date.now() - startTime;
            
            console.log(`   📊 Status: ${response.status}`);
            console.log(`   ⚡ Response Time: ${responseTime}ms`);
            console.log(`   🔒 Protocol: ${response.url.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ⚠️'}`);
            
            // Check for SSL certificate
            if (response.url.startsWith('https://')) {
                console.log(`   🔐 SSL: Working ✅`);
            }
            
            if (response.ok) {
                console.log(`   ✅ ${domain.name} is WERKEND!`);
                results.push({ domain: domain.name, status: 'SUCCESS', code: response.status });
            } else {
                console.log(`   ⚠️  ${domain.name} geeft status ${response.status}`);
                results.push({ domain: domain.name, status: 'WARNING', code: response.status });
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            
            // Analyze error types
            if (error.message.includes('certificate')) {
                console.log(`   🔒 SSL Certificaat wordt nog geïnstalleerd...`);
                results.push({ domain: domain.name, status: 'SSL_PENDING', error: error.message });
            } else if (error.message.includes('ENOTFOUND')) {
                console.log(`   🌐 DNS probleem - nog niet gepropageerd`);
                results.push({ domain: domain.name, status: 'DNS_PENDING', error: error.message });
            } else if (error.message.includes('ECONNREFUSED')) {
                console.log(`   🔌 Verbinding geweigerd - SSL nog niet actief`);
                results.push({ domain: domain.name, status: 'SSL_PENDING', error: error.message });
            } else {
                results.push({ domain: domain.name, status: 'ERROR', error: error.message });
            }
        }
    }
    
    return results;
}

async function generateReport(results) {
    console.log('\n📋 NETLIFY STATUS RAPPORT');
    console.log('==========================');
    console.log('🕐 Check tijd:', new Date().toLocaleString('nl-NL'));
    console.log('');
    
    let allWorking = true;
    let sslPending = false;
    
    results.forEach(result => {
        const status = result.status === 'SUCCESS' ? '✅ WERKEND' : 
                      result.status === 'SSL_PENDING' ? '🔄 SSL WORDT GEÏNSTALLEERD' :
                      result.status === 'DNS_PENDING' ? '🔄 DNS PROPAGATIE' :
                      result.status === 'WARNING' ? '⚠️ WAARSCHUWING' :
                      '❌ PROBLEEM';
        
        console.log(`🌐 ${result.domain}: ${status}`);
        
        if (result.status !== 'SUCCESS') {
            allWorking = false;
        }
        if (result.status === 'SSL_PENDING') {
            sslPending = true;
        }
    });
    
    console.log('\n🎯 CONCLUSIE:');
    console.log('=============');
    
    if (allWorking) {
        console.log('🎉 ALLE DOMAINS WERKEN PERFECT!');
        console.log('✅ Netlify DNS fix is succesvol!');
        console.log('✅ SSL certificaten zijn geïnstalleerd');
        console.log('✅ Je kunt nu globalscout.eu gebruiken');
    } else if (sslPending) {
        console.log('🔄 SSL CERTIFICATEN WORDEN GEÏNSTALLEERD');
        console.log('⏰ Dit duurt meestal 5-30 minuten');
        console.log('💡 DNS verificatie is gelukt!');
        console.log('🔄 Wacht nog even voor SSL activatie');
    } else {
        console.log('⚠️  ER ZIJN NOG PROBLEMEN');
        console.log('🔧 Mogelijk zijn er extra stappen nodig');
    }
    
    console.log('\n📞 VOLGENDE STAPPEN:');
    console.log('====================');
    
    if (allWorking) {
        console.log('🎯 Geen actie vereist - alles werkt!');
        console.log('🌐 Test je app op: https://globalscout.eu');
    } else if (sslPending) {
        console.log('⏰ Wacht nog 15-30 minuten voor SSL');
        console.log('🔄 Run dit script opnieuw om te checken');
        console.log('📱 Controleer Netlify dashboard voor SSL status');
    } else {
        console.log('🔧 Controleer Netlify dashboard');
        console.log('📞 Overweeg contact met Netlify support');
    }
}

async function monitorAfter15Minutes() {
    console.log('⏰ Wachten 15 minuten voor DNS propagatie...');
    console.log('🔄 Check start om:', new Date(Date.now() + WAIT_TIME).toLocaleString('nl-NL'));
    console.log('');
    
    // Wait 15 minutes
    await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
    
    console.log('🚀 15 MINUTEN VERSTREKEN - STARTING CHECK!');
    console.log('==========================================');
    
    const results = await checkDomainStatus();
    await generateReport(results);
}

// Immediate check option
async function checkNow() {
    console.log('🚀 DIRECTE CHECK (zonder wachten)');
    console.log('=================================');
    
    const results = await checkDomainStatus();
    await generateReport(results);
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--now') || args.includes('-n')) {
    checkNow().catch(console.error);
} else {
    monitorAfter15Minutes().catch(console.error);
}

console.log('\n💡 TIP: Run "node monitor-netlify-fix.js --now" voor directe check');
console.log('💡 TIP: Run "node monitor-netlify-fix.js" voor 15-minuten check');