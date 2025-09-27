#!/usr/bin/env node

/**
 * 🔧 STRIPE INDIVIDUAL ACCOUNT FIX
 * 
 * Oplossing voor wanneer je per ongeluk Business account flow krijgt
 */

console.log('🔧 STRIPE INDIVIDUAL ACCOUNT FIX');
console.log('=================================\n');

console.log('❌ PROBLEEM: Je krijgt "Naam van onderneming" en KvK vragen');
console.log('✅ OPLOSSING: Je bent in de Business flow, we gaan naar Individual\n');

console.log('🎯 WAAROM GEBEURT DIT?');
console.log('======================');
console.log('• Stripe detecteert automatisch account type op basis van je gedrag');
console.log('• Als je op "Business" klikt of business-gerelateerde velden invult');
console.log('• Dan switcht Stripe naar Business flow (met KvK vereiste)');
console.log('• We moeten expliciet naar Individual account type\n');

console.log('🚀 OPLOSSING STAP 1: ACCOUNT TYPE WIJZIGEN');
console.log('===========================================');
console.log('1. Ga naar je Stripe Dashboard');
console.log('2. Klik linksboven op je account naam/email');
console.log('3. Ga naar "Account settings"');
console.log('4. Zoek naar "Business type" of "Account type"');
console.log('5. Wijzig van "Business" naar "Individual"');
console.log('6. Sla op\n');

console.log('🔄 OPLOSSING STAP 2: NIEUW ACCOUNT AANMAKEN');
console.log('============================================');
console.log('Als stap 1 niet werkt, maak een nieuw account:');
console.log('1. Log uit van je huidige Stripe account');
console.log('2. Ga naar: https://stripe.com/nl');
console.log('3. Klik "Start now"');
console.log('4. Gebruik een ander email adres (bijv. +individual achter je naam)');
console.log('5. Bij account setup: Kies expliciet "Individual"');
console.log('6. NIET klikken op business-gerelateerde opties\n');

console.log('📝 OPLOSSING STAP 3: CORRECTE INDIVIDUAL FLOW');
console.log('==============================================');
console.log('Volg deze exacte stappen voor Individual account:');
console.log('');
console.log('1. Account aanmaken:');
console.log('   → Email + wachtwoord');
console.log('   → Kies "Individual" (NIET Business)');
console.log('');
console.log('2. Persoonlijke gegevens:');
console.log('   → Voornaam');
console.log('   → Achternaam');
console.log('   → Geboortedatum');
console.log('   → BSN (Burgerservicenummer)');
console.log('   → Adres');
console.log('');
console.log('3. Bankgegevens:');
console.log('   → Nederlandse IBAN');
console.log('   → Naam op rekening');
console.log('');
console.log('4. Business informatie (voor Individual):');
console.log('   → Business type: "Individual/Sole proprietorship"');
console.log('   → Industry: "Software"');
console.log('   → Product: "SaaS platform"');
console.log('   → Website: https://globalscout.eu');
console.log('   → GEEN KvK nummer invullen!');
console.log('');
console.log('5. Identiteitsverificatie:');
console.log('   → Upload Nederlands ID\n');

console.log('⚠️  BELANGRIJKE TIPS OM BUSINESS FLOW TE VERMIJDEN:');
console.log('===================================================');
console.log('❌ NIET doen:');
console.log('   → Klikken op "Business" opties');
console.log('   → Bedrijfsnaam invullen');
console.log('   → KvK nummer invullen');
console.log('   → BTW nummer invullen');
console.log('   → "Company" selecteren');
console.log('');
console.log('✅ WEL doen:');
console.log('   → Altijd "Individual" kiezen');
console.log('   → Alleen persoonlijke gegevens invullen');
console.log('   → BSN gebruiken (geen KvK)');
console.log('   → "Sole proprietorship" selecteren\n');

console.log('🔍 HOE HERKEN JE INDIVIDUAL FLOW?');
console.log('==================================');
console.log('✅ Je ziet deze velden:');
console.log('   → Voornaam/Achternaam (NIET bedrijfsnaam)');
console.log('   → BSN (NIET KvK nummer)');
console.log('   → Geboortedatum');
console.log('   → Persoonlijk adres');
console.log('   → "Individual" of "Sole proprietorship"');
console.log('');
console.log('❌ Je ziet NIET:');
console.log('   → "Naam van onderneming"');
console.log('   → "KvK nummer"');
console.log('   → "BTW nummer"');
console.log('   → "Company registration"\n');

console.log('🆘 ALS HET NOG STEEDS NIET LUKT:');
console.log('=================================');
console.log('1. Probeer incognito/private browsing');
console.log('2. Wis je browser cookies voor stripe.com');
console.log('3. Gebruik een ander email adres');
console.log('4. Start vanaf: https://stripe.com/nl/individual');
console.log('5. Contact Stripe Support: +31 20 808 5929\n');

console.log('📧 EMAIL VARIATIES VOOR NIEUW ACCOUNT:');
console.log('======================================');
console.log('Als je een nieuw account moet maken:');
console.log('• jouwmail+stripe@gmail.com');
console.log('• jouwmail+individual@gmail.com');
console.log('• jouwmail+globalscout@gmail.com');
console.log('(Gmail negeert alles na de +)\n');

console.log('🎯 VOLGENDE STAPPEN NA CORRECTE SETUP:');
console.log('======================================');
console.log('1. Controleer dat je Individual account hebt');
console.log('2. Haal je TEST API keys op');
console.log('3. Run: node configure-stripe-keys.js');
console.log('4. Test je payment flow');
console.log('5. Wacht op account verificatie\n');

console.log('✨ Succes! Individual account = geen KvK nodig!');