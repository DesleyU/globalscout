#!/usr/bin/env node

console.log('🔧 NETLIFY DNS STUCK - OPLOSSING');
console.log('================================');
console.log('⏰ Gestart:', new Date().toLocaleString('nl-NL'));
console.log('');

console.log('🔍 PROBLEEM DIAGNOSE:');
console.log('=====================');
console.log('✅ DNS werkt perfect wereldwijd');
console.log('✅ globalscout.eu wijst naar 72.2.60.5 (Netlify)');
console.log('✅ www.globalscout.eu wijst naar globalscout-app.netlify.app');
console.log('❌ Netlify verificatie is vastgelopen sinds gisteren');
console.log('');

console.log('🛠️  OPLOSSING STAPPEN:');
console.log('======================');
console.log('');

console.log('STAP 1: Ga naar Netlify Dashboard');
console.log('→ https://app.netlify.com/sites/globalscout-app/settings/domain');
console.log('');

console.log('STAP 2: Verwijder de vastgelopen domains');
console.log('→ Klik op de drie puntjes (...) naast globalscout.eu');
console.log('→ Klik "Remove domain"');
console.log('→ Herhaal voor www.globalscout.eu');
console.log('');

console.log('STAP 3: Wacht 2 minuten');
console.log('→ Laat Netlify de cache legen');
console.log('');

console.log('STAP 4: Voeg domains opnieuw toe');
console.log('→ Klik "Add custom domain"');
console.log('→ Voer in: globalscout.eu');
console.log('→ Klik "Verify"');
console.log('→ Klik "Add domain"');
console.log('');

console.log('STAP 5: Voeg www subdomain toe');
console.log('→ Klik "Add custom domain"');
console.log('→ Voer in: www.globalscout.eu');
console.log('→ Klik "Verify"');
console.log('→ Klik "Add domain"');
console.log('');

console.log('STAP 6: Controleer status');
console.log('→ Beide domains moeten nu "Netlify DNS" of "External DNS" tonen');
console.log('→ SSL status moet veranderen naar "Provisioning certificate"');
console.log('→ Binnen 15 minuten: "Secured"');
console.log('');

console.log('🚨 ALTERNATIEVE OPLOSSING (als bovenstaande niet werkt):');
console.log('========================================================');
console.log('');

console.log('OPTIE A: Gebruik Netlify DNS');
console.log('→ Ga naar Domain settings');
console.log('→ Klik "Use Netlify DNS"');
console.log('→ Kopieer de Netlify nameservers');
console.log('→ Ga naar Versio.nl dashboard');
console.log('→ Verander nameservers naar Netlify');
console.log('');

console.log('OPTIE B: Force SSL certificate');
console.log('→ Ga naar Domain settings');
console.log('→ Scroll naar "HTTPS"');
console.log('→ Klik "Renew certificate"');
console.log('');

console.log('📞 CONTACT SUPPORT (laatste optie):');
console.log('===================================');
console.log('Als niets werkt, contact Netlify support:');
console.log('→ https://app.netlify.com/support');
console.log('→ Vermeld: "DNS verification stuck for globalscout.eu"');
console.log('→ Geef aan dat DNS correct werkt maar verificatie vastloopt');
console.log('');

console.log('🎯 VERWACHTE RESULTAAT:');
console.log('=======================');
console.log('Na het opnieuw toevoegen:');
console.log('✅ globalscout.eu → "Secured" status');
console.log('✅ www.globalscout.eu → "Secured" status');
console.log('✅ Beide domains toegankelijk via HTTPS');
console.log('');

console.log('⏰ Script voltooid:', new Date().toLocaleString('nl-NL'));

// Test functie om te controleren of het gelukt is
async function testAfterFix() {
    console.log('\n🧪 TEST NA OPLOSSING:');
    console.log('=====================');
    
    try {
        console.log('Testing globalscout.eu...');
        const response1 = await fetch('https://globalscout.eu', { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('✅ globalscout.eu:', response1.status);
    } catch (error) {
        console.log('❌ globalscout.eu:', error.message);
    }
    
    try {
        console.log('Testing www.globalscout.eu...');
        const response2 = await fetch('https://www.globalscout.eu', { 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('✅ www.globalscout.eu:', response2.status);
    } catch (error) {
        console.log('❌ www.globalscout.eu:', error.message);
    }
}

// Uncomment deze regel om te testen na de fix:
// testAfterFix().catch(console.error);