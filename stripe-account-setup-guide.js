#!/usr/bin/env node

/**
 * 🏦 STRIPE ACCOUNT SETUP GUIDE
 * 
 * Stap-voor-stap guide voor het aanmaken van een Stripe Individual account
 * ZONDER KvK registratie
 */

console.log('🏦 STRIPE ACCOUNT SETUP GUIDE');
console.log('==============================\n');

console.log('🎯 DOEL: Individual Stripe account aanmaken zonder KvK\n');

console.log('📋 WAT JE NODIG HEBT:');
console.log('======================');
console.log('✅ Geldig Nederlands ID (rijbewijs/paspoort)');
console.log('✅ BSN (Burgerservicenummer)');
console.log('✅ Nederlandse bankrekening (IBAN)');
console.log('✅ Adresgegevens (GBA uittreksel kan gevraagd worden)');
console.log('✅ Telefoonnummer');
console.log('✅ Email adres\n');

console.log('🚀 STAP 1: ACCOUNT AANMAKEN');
console.log('============================');
console.log('1. Ga naar: https://stripe.com/nl');
console.log('2. Klik op "Start now" (rechtsboven)');
console.log('3. Vul je email adres in');
console.log('4. Maak een sterk wachtwoord aan');
console.log('5. Klik "Create account"\n');

console.log('⚙️  STAP 2: ACCOUNT TYPE KIEZEN');
console.log('================================');
console.log('🔥 BELANGRIJK: Kies "Individual" NIET "Business"');
console.log('   → Individual = Geen KvK nodig');
console.log('   → Business = KvK verplicht\n');

console.log('📝 STAP 3: PERSOONLIJKE GEGEVENS');
console.log('=================================');
console.log('Vul in:');
console.log('   → Voornaam');
console.log('   → Achternaam');
console.log('   → Geboortedatum');
console.log('   → BSN (Burgerservicenummer)');
console.log('   → Adres (straat + huisnummer)');
console.log('   → Postcode');
console.log('   → Plaats');
console.log('   → Land: Nederland');
console.log('   → Telefoonnummer\n');

console.log('🏦 STAP 4: BANKGEGEVENS');
console.log('========================');
console.log('   → IBAN van je Nederlandse bankrekening');
console.log('   → Naam op de bankrekening (moet overeenkomen)');
console.log('   → Bank naam (ING, ABN AMRO, Rabobank, etc.)\n');

console.log('🆔 STAP 5: IDENTITEITSVERIFICATIE');
console.log('==================================');
console.log('Upload een van deze documenten:');
console.log('   ✅ Nederlandse rijbewijs (voor- en achterkant)');
console.log('   ✅ Nederlands paspoort (foto pagina)');
console.log('   ✅ Nederlandse ID-kaart (voor- en achterkant)\n');

console.log('📊 STAP 6: BUSINESS INFORMATIE');
console.log('===============================');
console.log('Voor Individual account:');
console.log('   → Business type: "Individual/Sole proprietorship"');
console.log('   → Industry: "Software" of "Technology"');
console.log('   → Product description: "SaaS platform for football analytics"');
console.log('   → Website: https://globalscout.eu');
console.log('   → Verwachte maandelijkse omzet: €0-€2000 (start conservatief)\n');

console.log('⏱️  STAP 7: VERIFICATIE WACHTEN');
console.log('===============================');
console.log('   → Stripe controleert je gegevens (1-2 werkdagen)');
console.log('   → Je krijgt email updates over de status');
console.log('   → Je kunt al beginnen met TEST mode\n');

console.log('🔑 STAP 8: API KEYS OPHALEN');
console.log('============================');
console.log('Na account aanmaak:');
console.log('1. Log in op Stripe Dashboard');
console.log('2. Ga naar "Developers" → "API keys"');
console.log('3. Kopieer de TEST keys:');
console.log('   → Publishable key (pk_test_...)');
console.log('   → Secret key (sk_test_...)');
console.log('4. Bewaar deze veilig!\n');

console.log('💰 STAP 9: PRODUCT EN PRIJZEN');
console.log('==============================');
console.log('1. Ga naar "Products" in Dashboard');
console.log('2. Klik "Add product"');
console.log('3. Vul in:');
console.log('   → Name: "GlobalScout Premium"');
console.log('   → Description: "Premium subscription for advanced football analytics"');
console.log('4. Add pricing:');
console.log('   → Model: "Recurring"');
console.log('   → Price: €9.99');
console.log('   → Billing period: "Monthly"');
console.log('   → Currency: "EUR"');
console.log('5. Save en kopieer de Price ID (price_...)\n');

console.log('🪝 STAP 10: WEBHOOK SETUP');
console.log('==========================');
console.log('1. Ga naar "Developers" → "Webhooks"');
console.log('2. Klik "Add endpoint"');
console.log('3. Endpoint URL: https://globalscout.eu/api/payment/webhook');
console.log('4. Selecteer events:');
console.log('   ✅ payment_intent.succeeded');
console.log('   ✅ payment_intent.payment_failed');
console.log('   ✅ customer.subscription.created');
console.log('   ✅ customer.subscription.updated');
console.log('   ✅ customer.subscription.deleted');
console.log('   ✅ invoice.payment_succeeded');
console.log('   ✅ invoice.payment_failed');
console.log('5. Save en kopieer Webhook secret (whsec_...)\n');

console.log('⚠️  BELANGRIJKE TIPS:');
console.log('=====================');
console.log('🔒 BEVEILIGING:');
console.log('   → Deel NOOIT je secret keys');
console.log('   → Gebruik altijd HTTPS');
console.log('   → Bewaar keys in environment variables\n');

console.log('💶 LIMIETEN ZONDER KVK:');
console.log('   → Start: €2.000/maand');
console.log('   → Na 3 maanden: verhoogde limieten');
console.log('   → Volledig geverifieerd: onbeperkt\n');

console.log('📞 HULP NODIG?');
console.log('==============');
console.log('   → Stripe Support NL: +31 20 808 5929');
console.log('   → Email: support@stripe.com');
console.log('   → Chat: stripe.com/support');
console.log('   → Documentatie: stripe.com/docs\n');

console.log('🎉 VOLGENDE STAPPEN NA SETUP:');
console.log('==============================');
console.log('1. Run: node configure-stripe-keys.js');
console.log('2. Test met test credit cards');
console.log('3. Deploy naar productie');
console.log('4. Test live payments');
console.log('5. Ga live na volledige verificatie\n');

console.log('✨ Succes met je Stripe account setup!');