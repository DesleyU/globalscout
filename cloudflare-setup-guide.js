#!/usr/bin/env node

console.log('🌟 CLOUDFLARE SETUP VOOR GLOBALSCOUT');
console.log('====================================');
console.log('⏰ Gestart op:', new Date().toLocaleString('nl-NL'));
console.log('');

console.log('🎯 DOEL: globalscout.eu via Cloudflare (5-15 min propagatie)');
console.log('');

console.log('📋 STAP 1: CLOUDFLARE ACCOUNT AANMAKEN');
console.log('======================================');
console.log('');
console.log('🌐 Ga naar: https://cloudflare.com');
console.log('📝 Klik op: "Sign Up" (rechtsboven)');
console.log('');
console.log('✅ Vul in:');
console.log('   • Email: [jouw email]');
console.log('   • Wachtwoord: [sterk wachtwoord]');
console.log('   • Bevestig email via inbox');
console.log('');
console.log('⏭️  Na inloggen → ga naar STAP 2');
console.log('');

console.log('📋 STAP 2: DOMAIN TOEVOEGEN');
console.log('===========================');
console.log('');
console.log('🔵 In Cloudflare dashboard:');
console.log('   1. Klik "Add a Site"');
console.log('   2. Voer in: globalscout.eu');
console.log('   3. Klik "Add Site"');
console.log('   4. Kies "Free Plan" (€0/maand)');
console.log('   5. Klik "Continue"');
console.log('');
console.log('⏳ Cloudflare scant nu je DNS records...');
console.log('');

console.log('📋 STAP 3: DNS RECORDS CONTROLEREN');
console.log('==================================');
console.log('');
console.log('🔍 Cloudflare toont je huidige DNS records.');
console.log('');
console.log('✅ CONTROLEER deze records:');
console.log('');
console.log('📌 A Record:');
console.log('   • Name: globalscout.eu (of @)');
console.log('   • Content: 75.2.60.5');
console.log('   • Proxy: 🟠 Proxied (oranje wolkje AAN)');
console.log('');
console.log('📌 CNAME Record:');
console.log('   • Name: www');
console.log('   • Content: globalscout-app.netlify.app');
console.log('   • Proxy: 🟠 Proxied (oranje wolkje AAN)');
console.log('');
console.log('🔧 ALS IP VERKEERD IS (72.2.60.5):');
console.log('   1. Klik op "Edit" bij A record');
console.log('   2. Wijzig naar: 75.2.60.5');
console.log('   3. Zorg dat Proxy AAN staat (oranje)');
console.log('   4. Klik "Save"');
console.log('');
console.log('✅ Klik "Continue" als alles klopt');
console.log('');

console.log('📋 STAP 4: NAMESERVERS KRIJGEN');
console.log('===============================');
console.log('');
console.log('📝 Cloudflare geeft je 2 nameservers, bijvoorbeeld:');
console.log('   • ava.ns.cloudflare.com');
console.log('   • bob.ns.cloudflare.com');
console.log('');
console.log('📋 NOTEER DEZE NAMESERVERS!');
console.log('   (Je hebt ze nodig voor Versio)');
console.log('');

console.log('📋 STAP 5: NAMESERVERS WIJZIGEN BIJ VERSIO');
console.log('==========================================');
console.log('');
console.log('🏢 Ga naar: https://www.versio.nl/customer');
console.log('🔑 Log in met je Versio account');
console.log('');
console.log('📂 Navigatie:');
console.log('   1. Ga naar "Domeinen"');
console.log('   2. Klik op "globalscout.eu"');
console.log('   3. Ga naar "DNS/Nameservers"');
console.log('   4. Klik "Wijzigen"');
console.log('');
console.log('🔄 Wijzig van:');
console.log('   ❌ ns233.premiumdns-versio.net');
console.log('   ❌ ns224.premiumdns-versio.eu');
console.log('   ❌ ns205.premiumdns-versio.nl');
console.log('');
console.log('🔄 Naar (jouw Cloudflare nameservers):');
console.log('   ✅ [eerste Cloudflare nameserver]');
console.log('   ✅ [tweede Cloudflare nameserver]');
console.log('');
console.log('💾 Klik "Opslaan"');
console.log('');

console.log('📋 STAP 6: WACHTEN OP PROPAGATIE');
console.log('================================');
console.log('');
console.log('⏱️  Propagatietijd: 5-15 minuten');
console.log('');
console.log('🔍 Check voortgang:');
console.log('   • Cloudflare dashboard toont status');
console.log('   • https://dnschecker.org/');
console.log('   • Run: node verify-globalscout-eu-domain.js');
console.log('');

console.log('🎉 STAP 7: KLAAR!');
console.log('=================');
console.log('');
console.log('✅ Als alles werkt:');
console.log('   • https://globalscout.eu → werkt!');
console.log('   • https://www.globalscout.eu → werkt!');
console.log('   • Automatische HTTPS');
console.log('   • Wereldwijde CDN actief');
console.log('   • DDoS bescherming aan');
console.log('');

console.log('🔗 NUTTIGE LINKS');
console.log('================');
console.log('🌐 Cloudflare: https://cloudflare.com');
console.log('🏢 Versio: https://www.versio.nl/customer');
console.log('🔍 DNS Check: https://dnschecker.org/');
console.log('📊 Netlify: https://app.netlify.com/sites/globalscout-app/settings/domain');
console.log('');

console.log('🆘 HULP NODIG?');
console.log('==============');
console.log('🔧 DNS Status: node verify-globalscout-eu-domain.js');
console.log('🚀 App Test: node test-netlify-deployment.js https://globalscout-app.netlify.app');
console.log('📋 Dit script: node cloudflare-setup-guide.js');
console.log('');

console.log('💡 TIPS');
console.log('=======');
console.log('• Houd beide tabbladen open (Cloudflare + Versio)');
console.log('• Kopieer nameservers exact over');
console.log('• Oranje wolkje = CDN + DDoS bescherming');
console.log('• Grijs wolkje = alleen DNS (geen CDN)');
console.log('');

console.log('🚀 SUCCES MET DE SETUP!');
console.log('Je app wordt straks super snel wereldwijd! 🌍');