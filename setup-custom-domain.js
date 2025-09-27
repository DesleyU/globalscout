#!/usr/bin/env node

console.log('🌐 Custom Domain Setup Guide for Globalscout');
console.log('=' .repeat(50));

console.log('\n📋 STAP 1: NETLIFY DOMAIN CONFIGURATIE');
console.log('1. Ga naar: https://app.netlify.com/projects/globalscout-app');
console.log('2. Klik op "Domain settings"');
console.log('3. Klik op "Add custom domain"');
console.log('4. Voer je domeinnaam in (bijv: globalscout.nl)');
console.log('5. Klik "Verify"');

console.log('\n🔧 STAP 2: DNS CONFIGURATIE BIJ JE DOMAIN PROVIDER');
console.log('Je moet deze DNS records toevoegen bij je domain provider:');
console.log('');
console.log('Voor APEX domain (globalscout.nl):');
console.log('Type: A Record');
console.log('Name: @ (of laat leeg)');
console.log('Value: 75.2.60.5');
console.log('');
console.log('Voor WWW subdomain (www.globalscout.nl):');
console.log('Type: CNAME');
console.log('Name: www');
console.log('Value: globalscout-app.netlify.app');
console.log('');
console.log('Alternative (als A record niet werkt):');
console.log('Type: ALIAS/ANAME');
console.log('Name: @');
console.log('Value: globalscout-app.netlify.app');

console.log('\n🔒 STAP 3: SSL CERTIFICAAT');
console.log('1. Wacht tot DNS propagatie compleet is (kan 24-48 uur duren)');
console.log('2. Ga terug naar Netlify Domain settings');
console.log('3. Klik "Verify DNS configuration"');
console.log('4. Netlify zal automatisch een SSL certificaat aanvragen');
console.log('5. Forceer HTTPS redirect in de instellingen');

console.log('\n⚡ STAP 4: NETLIFY CLI DOMAIN SETUP (OPTIONEEL)');
console.log('Je kunt ook via CLI je domain toevoegen:');
console.log('');
console.log('npx netlify-cli domains:add yourdomain.com --site=globalscout-app');
console.log('npx netlify-cli domains:add www.yourdomain.com --site=globalscout-app');

console.log('\n🧪 STAP 5: TESTEN');
console.log('Na DNS propagatie test je:');
console.log('1. http://yourdomain.com → moet redirecten naar https://');
console.log('2. https://yourdomain.com → moet je app tonen');
console.log('3. https://www.yourdomain.com → moet ook werken');

console.log('\n📊 VEELGEBRUIKTE DOMAIN PROVIDERS:');
console.log('');
console.log('🔹 Namecheap:');
console.log('  - Ga naar Domain List → Manage → Advanced DNS');
console.log('  - Voeg A record toe: @ → 75.2.60.5');
console.log('  - Voeg CNAME toe: www → globalscout-app.netlify.app');
console.log('');
console.log('🔹 GoDaddy:');
console.log('  - Ga naar DNS Management');
console.log('  - Voeg A record toe: @ → 75.2.60.5');
console.log('  - Voeg CNAME toe: www → globalscout-app.netlify.app');
console.log('');
console.log('🔹 Cloudflare:');
console.log('  - Ga naar DNS settings');
console.log('  - Voeg A record toe: @ → 75.2.60.5 (proxy off)');
console.log('  - Voeg CNAME toe: www → globalscout-app.netlify.app (proxy off)');
console.log('  - Later kun je proxy aanzetten voor extra features');

console.log('\n⚠️  BELANGRIJKE TIPS:');
console.log('• DNS propagatie kan 24-48 uur duren');
console.log('• Test met https://dnschecker.org/');
console.log('• Zet TTL laag (300-600) tijdens setup');
console.log('• Netlify SSL is gratis via Let\'s Encrypt');
console.log('• Backup je huidige DNS settings');

console.log('\n🎯 RESULTAAT:');
console.log('Na setup werken deze URLs:');
console.log('✅ https://yourdomain.com');
console.log('✅ https://www.yourdomain.com');
console.log('✅ Automatische HTTPS redirect');
console.log('✅ SSL certificaat');

console.log('\n🔗 NUTTIGE LINKS:');
console.log('• Netlify Docs: https://docs.netlify.com/domains-https/custom-domains/');
console.log('• DNS Checker: https://dnschecker.org/');
console.log('• SSL Test: https://www.ssllabs.com/ssltest/');

console.log('\n💡 Wat is je domeinnaam? Dan kan ik specifiekere instructies geven!');