#!/usr/bin/env node

console.log('🔧 Versio DNS Setup - TTL Alternatieven');
console.log('=' .repeat(45));

console.log('\n⚠️  TTL PROBLEEM OPGELOST:');
console.log('Als je TTL niet op 300 kunt zetten, gebruik dan:');

console.log('\n🔹 VERSIO DNS RECORDS (met hogere TTL):');
console.log('');
console.log('Voor globalscout.eu (APEX):');
console.log('   Type: A');
console.log('   Naam: @ (of laat leeg)');
console.log('   Waarde: 75.2.60.5');
console.log('   TTL: 3600 (1 uur) - of wat Versio toestaat');
console.log('');
console.log('Voor www.globalscout.eu:');
console.log('   Type: CNAME');
console.log('   Naam: www');
console.log('   Waarde: globalscout-app.netlify.app');
console.log('   TTL: 3600 (1 uur) - of wat Versio toestaat');

console.log('\n📊 VEELVOORKOMENDE VERSIO TTL WAARDEN:');
console.log('✅ 3600 (1 uur) - meestal beschikbaar');
console.log('✅ 7200 (2 uur) - vaak standaard');
console.log('✅ 14400 (4 uur) - ook mogelijk');
console.log('✅ 86400 (24 uur) - altijd beschikbaar');

console.log('\n💡 WAAROM TTL NIET ZO BELANGRIJK IS:');
console.log('• TTL bepaalt hoe lang DNS wordt gecached');
console.log('• Hogere TTL = langere propagatie tijd');
console.log('• Maar eenmaal werkend, maakt het niet uit');
console.log('• 1-4 uur TTL is prima voor productie');

console.log('\n🚀 VERSIO SPECIFIEKE TIPS:');
console.log('• Versio heeft vaak een minimum TTL van 1 uur (3600)');
console.log('• Sommige Versio accounts hebben 4 uur (14400) minimum');
console.log('• Dit is normaal en werkt prima!');
console.log('• Je kunt TTL later altijd aanpassen');

console.log('\n⏰ VERWACHTE PROPAGATIE TIJDEN:');
console.log('TTL 3600 (1 uur): 1-6 uur propagatie');
console.log('TTL 7200 (2 uur): 2-8 uur propagatie');
console.log('TTL 14400 (4 uur): 4-12 uur propagatie');
console.log('TTL 86400 (24 uur): 6-48 uur propagatie');

console.log('\n🎯 AANBEVOLEN VERSIO SETUP:');
console.log('1. Gebruik de laagste TTL die Versio toestaat');
console.log('2. Meestal is dat 3600 (1 uur)');
console.log('3. Als dat niet kan, gebruik 7200 of 14400');
console.log('4. Zelfs 86400 (24 uur) werkt prima');

console.log('\n✅ ALTERNATIEVE DNS RECORDS:');
console.log('Als A record problemen geeft, probeer:');
console.log('');
console.log('ALIAS record (als beschikbaar):');
console.log('   Type: ALIAS');
console.log('   Naam: @');
console.log('   Waarde: globalscout-app.netlify.app');
console.log('');
console.log('Of CNAME voor subdomain:');
console.log('   Type: CNAME');
console.log('   Naam: app');
console.log('   Waarde: globalscout-app.netlify.app');
console.log('   (Dan werkt app.globalscout.eu)');

console.log('\n🔍 VERSIO INTERFACE TIPS:');
console.log('• Zoek naar "DNS Beheer" of "DNS Instellingen"');
console.log('• Klik op "Record toevoegen" of "Nieuwe record"');
console.log('• TTL staat vaak in een dropdown menu');
console.log('• Kies de laagste beschikbare waarde');
console.log('• Sla op en wacht op bevestiging');

console.log('\n📞 VERSIO SUPPORT:');
console.log('Als je vastloopt:');
console.log('• Versio heeft Nederlandse support');
console.log('• Vraag naar "DNS A record voor Netlify"');
console.log('• Geef ze deze waarden: 75.2.60.5');
console.log('• Ze kunnen je helpen met de juiste TTL');

console.log('\n🎉 RESULTAAT:');
console.log('Met elke TTL waarde krijg je uiteindelijk:');
console.log('✅ https://globalscout.eu → je app');
console.log('✅ https://www.globalscout.eu → je app');
console.log('✅ SSL certificaat');
console.log('✅ Professionele uitstraling');

console.log('\n💪 VOLGENDE STAP:');
console.log('Gebruik gewoon de TTL die Versio toestaat en ga verder!');