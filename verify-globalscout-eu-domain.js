#!/usr/bin/env node

const https = require('https');
const dns = require('dns').promises;

console.log('🌐 Globalscout.eu Domain Verificatie');
console.log('=' .repeat(40));

async function checkDNS() {
    console.log('\n🔍 DNS PROPAGATIE CHECK');
    console.log('-'.repeat(25));
    
    try {
        // Check A record voor globalscout.eu
        console.log('📍 Checking A record voor globalscout.eu...');
        const aRecords = await dns.resolve4('globalscout.eu');
        console.log(`✅ A Record: ${aRecords.join(', ')}`);
        
        // Check of het naar Netlify wijst
        const netlifyIP = '75.2.60.5';
        if (aRecords.includes(netlifyIP)) {
            console.log('✅ DNS wijst correct naar Netlify!');
        } else {
            console.log(`⚠️  DNS wijst naar ${aRecords[0]}, verwacht: ${netlifyIP}`);
        }
        
    } catch (error) {
        console.log('❌ A Record niet gevonden - DNS nog niet gepropageerd');
        console.log(`   Error: ${error.message}`);
    }
    
    try {
        // Check CNAME record voor www.globalscout.eu
        console.log('\n📍 Checking CNAME record voor www.globalscout.eu...');
        const cnameRecords = await dns.resolveCname('www.globalscout.eu');
        console.log(`✅ CNAME Record: ${cnameRecords.join(', ')}`);
        
        // Check of het naar Netlify wijst
        const expectedCname = 'globalscout-app.netlify.app';
        if (cnameRecords.includes(expectedCname)) {
            console.log('✅ CNAME wijst correct naar Netlify!');
        } else {
            console.log(`⚠️  CNAME wijst naar ${cnameRecords[0]}, verwacht: ${expectedCname}`);
        }
        
    } catch (error) {
        console.log('❌ CNAME Record niet gevonden - DNS nog niet gepropageerd');
        console.log(`   Error: ${error.message}`);
    }
}

async function checkHTTPS(domain) {
    return new Promise((resolve) => {
        console.log(`\n🔒 HTTPS CHECK - ${domain}`);
        console.log('-'.repeat(25));
        
        const options = {
            hostname: domain,
            port: 443,
            path: '/',
            method: 'GET',
            timeout: 10000,
            headers: {
                'User-Agent': 'Globalscout-Domain-Checker/1.0'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log(`✅ HTTPS Status: ${res.statusCode}`);
            console.log(`✅ SSL Certificaat: Actief`);
            
            // Check redirect
            if (res.statusCode >= 300 && res.statusCode < 400) {
                console.log(`🔄 Redirect naar: ${res.headers.location}`);
            }
            
            // Check headers
            if (res.headers['strict-transport-security']) {
                console.log('✅ HSTS Header: Aanwezig');
            }
            
            resolve(true);
        });
        
        req.on('error', (error) => {
            console.log(`❌ HTTPS Error: ${error.message}`);
            if (error.code === 'ENOTFOUND') {
                console.log('   → DNS nog niet gepropageerd');
            } else if (error.code === 'CERT_NOT_YET_VALID' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                console.log('   → SSL certificaat nog niet klaar');
            }
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ HTTPS Timeout - mogelijk nog niet beschikbaar');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

async function checkNetlifyStatus() {
    console.log('\n📊 NETLIFY STATUS CHECK');
    console.log('-'.repeat(25));
    console.log('🔗 Ga naar Netlify voor gedetailleerde status:');
    console.log('👉 https://app.netlify.com/sites/globalscout-app/settings/domain');
    console.log('');
    console.log('📋 Mogelijke statussen:');
    console.log('🔸 "Awaiting external DNS" → DNS propagatie bezig');
    console.log('🔸 "Netlify DNS" → DNS werkt, SSL wordt aangevraagd');
    console.log('🔸 "Secured" → Alles werkt! 🎉');
}

async function main() {
    console.log('⏰ Gestart op:', new Date().toLocaleString('nl-NL'));
    
    // DNS Check
    await checkDNS();
    
    // HTTPS Checks
    const httpsWorking = await checkHTTPS('globalscout.eu');
    await checkHTTPS('www.globalscout.eu');
    
    // Netlify Status Info
    await checkNetlifyStatus();
    
    // Summary
    console.log('\n📋 SAMENVATTING');
    console.log('=' .repeat(15));
    
    if (httpsWorking) {
        console.log('🎉 SUCCESS! Je domain werkt!');
        console.log('✅ https://globalscout.eu is live!');
        console.log('✅ SSL certificaat is actief');
        console.log('✅ DNS propagatie voltooid');
        console.log('');
        console.log('🚀 Je Globalscout app is nu beschikbaar op:');
        console.log('   👉 https://globalscout.eu');
        console.log('   👉 https://www.globalscout.eu');
    } else {
        console.log('⏳ WACHTEN OP PROPAGATIE...');
        console.log('🔄 DNS propagatie is nog bezig');
        console.log('⏰ Dit kan 1-24 uur duren');
        console.log('');
        console.log('💡 TIP: Run dit script opnieuw over een uur:');
        console.log('   node verify-globalscout-eu-domain.js');
    }
    
    console.log('\n🧪 HANDMATIGE TESTS:');
    console.log('• DNS Checker: https://dnschecker.org/');
    console.log('• SSL Test: https://www.ssllabs.com/ssltest/');
    console.log('• Netlify Status: https://app.netlify.com/sites/globalscout-app/settings/domain');
}

main().catch(console.error);