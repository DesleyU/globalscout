#!/usr/bin/env node

console.log('🇪🇺 Globalscout.eu Domain Setup - Versio + Netlify');
console.log('=' .repeat(55));

console.log('\n🎯 JOUW CONFIGURATIE:');
console.log('Domain: globalscout.eu');
console.log('Provider: Versio (Nederlandse hosting provider)');
console.log('Netlify Site: globalscout-app.netlify.app');
console.log('Target: https://globalscout.eu');

console.log('\n📋 STAP 1: VERSIO DNS CONFIGURATIE');
console.log('1. Log in op: https://www.versio.nl/customer');
console.log('2. Ga naar "Mijn Domeinen" → "globalscout.eu"');
console.log('3. Klik op "DNS beheer" of "DNS instellingen"');
console.log('4. Voeg deze DNS records toe:');
console.log('');
console.log('🔹 APEX Domain (globalscout.eu):');
console.log('   Type: A');
console.log('   Naam: @ (of laat leeg)');
console.log('   Waarde: 75.2.60.5');
console.log('   TTL: 300 (5 minuten)');
console.log('');
console.log('🔹 WWW Subdomain (www.globalscout.eu):');
console.log('   Type: CNAME');
console.log('   Naam: www');
console.log('   Waarde: globalscout-app.netlify.app');
console.log('   TTL: 300 (5 minuten)');

console.log('\n🌐 STAP 2: NETLIFY DOMAIN TOEVOEGEN');
console.log('1. Ga naar: https://app.netlify.com/projects/globalscout-app');
console.log('2. Klik op "Domain settings"');
console.log('3. Klik op "Add custom domain"');
console.log('4. Voer in: globalscout.eu');
console.log('5. Klik "Verify"');
console.log('6. Netlify zal DNS verificatie uitvoeren');

console.log('\n⚡ ALTERNATIEF: NETLIFY CLI METHODE');
console.log('Je kunt ook via CLI je domain toevoegen:');
console.log('');
console.log('npx netlify-cli domains:add globalscout.eu --site=globalscout-app');
console.log('npx netlify-cli domains:add www.globalscout.eu --site=globalscout-app');

console.log('\n🔒 STAP 3: SSL CERTIFICAAT (AUTOMATISCH)');
console.log('1. Wacht tot DNS propagatie compleet is (1-24 uur)');
console.log('2. Netlify detecteert automatisch de DNS wijzigingen');
console.log('3. Let\'s Encrypt SSL certificaat wordt automatisch aangevraagd');
console.log('4. HTTPS redirect wordt automatisch geactiveerd');

console.log('\n🧪 STAP 4: VERIFICATIE');
console.log('Test deze URLs na DNS propagatie:');
console.log('✅ http://globalscout.eu → redirect naar https://');
console.log('✅ https://globalscout.eu → toont je Globalscout app');
console.log('✅ https://www.globalscout.eu → toont ook je app');

console.log('\n📊 VERSIO SPECIFIEKE TIPS:');
console.log('🔹 Versio interface:');
console.log('  - DNS wijzigingen zijn meestal binnen 15-30 minuten actief');
console.log('  - Gebruik TTL van 300 seconden tijdens setup');
console.log('  - Backup je huidige DNS instellingen eerst');
console.log('  - Versio heeft soms "DNS Template" opties - gebruik "Custom"');
console.log('');
console.log('🔹 Veelvoorkomende Versio locaties:');
console.log('  - "Mijn Account" → "Domeinen" → "DNS"');
console.log('  - Of: "Hosting" → "DNS Beheer"');
console.log('  - Zoek naar "A Record" en "CNAME Record" opties');

console.log('\n⚠️  BELANGRIJKE OPMERKINGEN:');
console.log('• Verwijder GEEN bestaande MX records (email)');
console.log('• Backup je huidige DNS settings');
console.log('• DNS propagatie kan 1-24 uur duren');
console.log('• Test met: https://dnschecker.org/');
console.log('• Versio heeft goede Nederlandse support als je vastloopt');

console.log('\n🎯 EINDRESULTAAT:');
console.log('Na succesvolle setup:');
console.log('✅ https://globalscout.eu → je Globalscout app');
console.log('✅ https://www.globalscout.eu → ook je app');
console.log('✅ Gratis SSL certificaat');
console.log('✅ Automatische HTTPS redirect');
console.log('✅ Professionele uitstraling met .eu domain');

console.log('\n🔗 NUTTIGE LINKS:');
console.log('• Versio Customer Portal: https://www.versio.nl/customer');
console.log('• DNS Checker: https://dnschecker.org/');
console.log('• Netlify Domain Settings: https://app.netlify.com/projects/globalscout-app');

console.log('\n🚀 VOLGENDE STAPPEN:');
console.log('1. Log in op Versio en configureer DNS');
console.log('2. Voeg domain toe aan Netlify');
console.log('3. Wacht op DNS propagatie');
console.log('4. Test je nieuwe domain!');

console.log('\n💡 Heb je vragen over de Versio interface? Laat het weten!');