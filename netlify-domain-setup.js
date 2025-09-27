#!/usr/bin/env node

console.log('🌐 Netlify Domain Setup - globalscout.eu');
console.log('=' .repeat(45));

console.log('\n✅ DNS RECORDS TOEGEVOEGD BIJ VERSIO!');
console.log('Nu gaan we het domain toevoegen aan Netlify.');

console.log('\n🔗 STAP 1: GA NAAR NETLIFY');
console.log('Open deze link in je browser:');
console.log('👉 https://app.netlify.com/sites/globalscout-app/settings/domain');

console.log('\n⚙️  STAP 2: DOMAIN TOEVOEGEN');
console.log('1. Klik op "Add custom domain"');
console.log('2. Voer in: globalscout.eu');
console.log('3. Klik "Verify"');
console.log('4. Netlify zal zeggen: "Check DNS configuration"');
console.log('5. Klik "Add domain" (ook al is DNS nog niet gepropageerd)');

console.log('\n🔄 STAP 3: WWW SUBDOMAIN TOEVOEGEN');
console.log('1. Klik opnieuw "Add custom domain"');
console.log('2. Voer in: www.globalscout.eu');
console.log('3. Klik "Verify"');
console.log('4. Klik "Add domain"');

console.log('\n⚡ ALTERNATIEF: AUTOMATISCHE SETUP');
console.log('Netlify kan ook automatisch www.globalscout.eu toevoegen');
console.log('als je alleen globalscout.eu toevoegt.');

console.log('\n🔒 STAP 4: SSL CERTIFICAAT');
console.log('Na DNS propagatie (1-24 uur):');
console.log('• Netlify detecteert automatisch de DNS wijzigingen');
console.log('• SSL certificaat wordt automatisch aangevraagd');
console.log('• HTTPS redirect wordt geactiveerd');

console.log('\n⏰ VERWACHTE TIJDLIJN:');
console.log('🔹 Nu: Domain toevoegen aan Netlify (5 minuten)');
console.log('🔹 1-6 uur: DNS propagatie (afhankelijk van TTL)');
console.log('🔹 +15 min: SSL certificaat automatisch');
console.log('🔹 Klaar: https://globalscout.eu werkt!');

console.log('\n🧪 TESTEN TIJDENS PROPAGATIE:');
console.log('Je kunt de voortgang checken met:');
console.log('• https://dnschecker.org/ → zoek globalscout.eu');
console.log('• Netlify Domain settings → zie status');
console.log('• Browser: probeer https://globalscout.eu');

console.log('\n📊 NETLIFY DOMAIN STATUS:');
console.log('In Netlify zie je deze statussen:');
console.log('🔸 "Awaiting external DNS" → DNS nog niet gepropageerd');
console.log('🔸 "Netlify DNS" → DNS werkt, SSL wordt aangevraagd');
console.log('🔸 "Secured" → Alles werkt! 🎉');

console.log('\n🎯 EINDRESULTAAT:');
console.log('Na succesvolle setup:');
console.log('✅ https://globalscout.eu → je Globalscout app');
console.log('✅ https://www.globalscout.eu → ook je app');
console.log('✅ Automatische HTTPS redirect');
console.log('✅ Gratis SSL certificaat');
console.log('✅ Professionele .eu domain!');

console.log('\n🚀 GA NAAR NETLIFY:');
console.log('👉 https://app.netlify.com/sites/globalscout-app/settings/domain');
console.log('');
console.log('Voeg globalscout.eu toe en laat me weten hoe het gaat!');