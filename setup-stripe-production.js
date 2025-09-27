#!/usr/bin/env node

/**
 * 🚀 STRIPE PRODUCTION SETUP
 * 
 * Dit script helpt je bij het configureren van Stripe voor productie
 * zonder KvK registratie (Individual account)
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 STRIPE PRODUCTION SETUP');
console.log('==========================\n');

// Check current environment files
const envFiles = [
  { name: 'Backend .env.render', path: './backend/.env.render' },
  { name: 'Backend .env.example', path: './backend/.env.example' },
  { name: 'Frontend .env', path: './frontend/.env' },
  { name: 'Frontend .env.example', path: './frontend/.env.example' }
];

console.log('📁 Checking current environment files...\n');

envFiles.forEach(file => {
  const exists = fs.existsSync(file.path);
  console.log(`${exists ? '✅' : '❌'} ${file.name}: ${exists ? 'Found' : 'Missing'}`);
});

console.log('\n🔧 STRIPE CONFIGURATION NEEDED:\n');

console.log('📋 BACKEND ENVIRONMENT VARIABLES:');
console.log('==================================');
console.log(`
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (Test key voor development)
STRIPE_PUBLISHABLE_KEY=pk_test_... (Test key voor development)
STRIPE_WEBHOOK_SECRET=whsec_... (Webhook secret)

# Voor productie (na verificatie):
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Product Configuration
STRIPE_MONTHLY_PRICE_ID=price_... (Price ID van je maandelijkse abonnement)
STRIPE_CURRENCY=eur
STRIPE_PREMIUM_AMOUNT=9.99
`);

console.log('📋 FRONTEND ENVIRONMENT VARIABLES:');
console.log('===================================');
console.log(`
# Stripe Frontend Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (Zelfde als backend)
VITE_API_URL=https://globalscout-backend.onrender.com/api
`);

console.log('\n🎯 STAPPEN OM STRIPE TE CONFIGUREREN:\n');

console.log('1️⃣  STRIPE ACCOUNT AANMAKEN');
console.log('   → Ga naar: https://stripe.com/nl');
console.log('   → Kies "Individual" account type');
console.log('   → Vul persoonlijke gegevens in (BSN, geen KvK nodig)');
console.log('   → Verifieer je identiteit\n');

console.log('2️⃣  API KEYS OPHALEN');
console.log('   → Log in op Stripe Dashboard');
console.log('   → Ga naar "Developers" → "API keys"');
console.log('   → Kopieer "Publishable key" en "Secret key"');
console.log('   → Start met TEST keys (pk_test_... en sk_test_...)\n');

console.log('3️⃣  PRODUCT EN PRIJZEN INSTELLEN');
console.log('   → Ga naar "Products" in Stripe Dashboard');
console.log('   → Maak nieuw product: "GlobalScout Premium"');
console.log('   → Stel prijs in: €9.99/maand');
console.log('   → Kopieer de "Price ID" (price_...)\n');

console.log('4️⃣  WEBHOOK CONFIGUREREN');
console.log('   → Ga naar "Developers" → "Webhooks"');
console.log('   → Voeg endpoint toe: https://globalscout.eu/api/payment/webhook');
console.log('   → Selecteer events (zie STRIPE-SETUP-GUIDE.md)');
console.log('   → Kopieer "Webhook secret" (whsec_...)\n');

console.log('5️⃣  ENVIRONMENT FILES UPDATEN');
console.log('   → Update backend/.env.render met Stripe keys');
console.log('   → Update frontend/.env met publishable key');
console.log('   → Deploy naar Render en Netlify\n');

console.log('🧪 TESTEN');
console.log('========');
console.log('   → Gebruik test credit cards (zie STRIPE-SETUP-GUIDE.md)');
console.log('   → Test iDEAL met "Test Bank"');
console.log('   → Controleer webhook events in Stripe Dashboard\n');

console.log('💡 TIPS:');
console.log('=======');
console.log('   ✅ Start altijd met TEST keys');
console.log('   ✅ Test alle payment flows grondig');
console.log('   ✅ Controleer webhook logs');
console.log('   ✅ Ga pas live na volledige verificatie\n');

console.log('📞 HULP NODIG?');
console.log('==============');
console.log('   → Stripe Support: +31 20 808 5929');
console.log('   → Email: support@stripe.com');
console.log('   → Documentatie: https://stripe.com/docs\n');

console.log('🎉 Succes met je Stripe setup!');