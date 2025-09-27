#!/usr/bin/env node

console.log('🌐 NETLIFY STATUS CHECKER');
console.log('=========================');
console.log('⏰ Check gestart:', new Date().toLocaleString('nl-NL'));
console.log('');

const NETLIFY_APP_URL = 'https://globalscout-app.netlify.app';
const CUSTOM_DOMAIN = 'https://globalscout.eu';
const WWW_DOMAIN = 'https://www.globalscout.eu';

async function checkNetlifyApp() {
    console.log('🔍 Checking Netlify App URL...');
    try {
        const response = await fetch(NETLIFY_APP_URL);
        const text = await response.text();
        
        console.log('   📊 Status:', response.status);
        console.log('   📊 Content-Type:', response.headers.get('content-type'));
        console.log('   📊 Response Size:', text.length, 'characters');
        
        if (response.ok && text.includes('<!DOCTYPE html>')) {
            console.log('   ✅ Netlify App is WERKEND!');
            return true;
        } else {
            console.log('   ❌ Netlify App heeft problemen');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        return false;
    }
}

async function checkCustomDomain(url, domainName) {
    console.log(`🔍 Checking ${domainName}...`);
    try {
        const response = await fetch(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        console.log('   📊 Status:', response.status);
        console.log('   📊 URL:', response.url);
        
        // Check for SSL certificate
        if (url.startsWith('https://')) {
            console.log('   🔒 SSL: Verbinding succesvol');
        }
        
        if (response.ok) {
            console.log(`   ✅ ${domainName} is WERKEND!`);
            return true;
        } else {
            console.log(`   ⚠️  ${domainName} geeft status ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
        
        // Analyze common SSL/DNS errors
        if (error.message.includes('certificate')) {
            console.log('   🔒 SSL Certificaat probleem - Netlify configureert nog SSL');
        } else if (error.message.includes('ENOTFOUND')) {
            console.log('   🌐 DNS probleem - Domain wijst niet naar Netlify');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('   🔌 Verbinding geweigerd - Server niet bereikbaar');
        }
        
        return false;
    }
}

async function checkDNSConfiguration() {
    console.log('🌐 DNS Configuration Check...');
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
        const nslookup = spawn('nslookup', ['globalscout.eu']);
        let output = '';
        
        nslookup.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        nslookup.on('close', (code) => {
            console.log('   📊 DNS Lookup Result:');
            const lines = output.split('\n');
            lines.forEach(line => {
                if (line.includes('Address:') && !line.includes('#53')) {
                    console.log('   📊 IP:', line.trim());
                }
            });
            
            if (output.includes('Address:')) {
                console.log('   ✅ DNS is geconfigureerd');
            } else {
                console.log('   ❌ DNS niet gevonden');
            }
            resolve();
        });
    });
}

async function checkNetlifyHeaders() {
    console.log('🔍 Checking Netlify Headers...');
    try {
        const response = await fetch(NETLIFY_APP_URL, { method: 'HEAD' });
        
        console.log('   📊 Server:', response.headers.get('server') || 'Unknown');
        console.log('   📊 X-NF-Request-ID:', response.headers.get('x-nf-request-id') || 'Not found');
        console.log('   📊 Cache-Control:', response.headers.get('cache-control') || 'Not set');
        
        const server = response.headers.get('server');
        if (server && server.includes('Netlify')) {
            console.log('   ✅ Confirmed Netlify hosting');
        }
        
    } catch (error) {
        console.log('   ❌ Header check failed:', error.message);
    }
}

async function generateStatusReport() {
    console.log('\n📋 NETLIFY STATUS RAPPORT');
    console.log('==========================');
    
    const netlifyAppWorking = await checkNetlifyApp();
    console.log('');
    
    await checkNetlifyHeaders();
    console.log('');
    
    await checkDNSConfiguration();
    console.log('');
    
    const customDomainWorking = await checkCustomDomain(CUSTOM_DOMAIN, 'globalscout.eu');
    console.log('');
    
    const wwwDomainWorking = await checkCustomDomain(WWW_DOMAIN, 'www.globalscout.eu');
    console.log('');
    
    console.log('📊 SAMENVATTING:');
    console.log('================');
    console.log('🌐 Netlify App (.netlify.app):', netlifyAppWorking ? '✅ WERKEND' : '❌ PROBLEEM');
    console.log('🌐 globalscout.eu:', customDomainWorking ? '✅ WERKEND' : '❌ PROBLEEM');
    console.log('🌐 www.globalscout.eu:', wwwDomainWorking ? '✅ WERKEND' : '❌ PROBLEEM');
    
    console.log('\n🔧 ACTIES VOOR NETLIFY DASHBOARD:');
    console.log('==================================');
    
    if (!customDomainWorking || !wwwDomainWorking) {
        console.log('1. Ga naar: https://app.netlify.com/sites/globalscout-app/settings/domain');
        console.log('2. Controleer of beide domains zijn toegevoegd:');
        console.log('   - globalscout.eu');
        console.log('   - www.globalscout.eu');
        console.log('3. Kijk naar SSL status - moet "Secured" zijn');
        console.log('4. Als SSL nog "Provisioning", wacht 15-30 minuten');
    }
    
    if (netlifyAppWorking && (!customDomainWorking || !wwwDomainWorking)) {
        console.log('\n💡 DIAGNOSE: App werkt op Netlify, custom domain SSL wordt nog geconfigureerd');
    }
    
    console.log('\n⏰ Check voltooid:', new Date().toLocaleString('nl-NL'));
}

generateStatusReport().catch(console.error);