#!/usr/bin/env node

/**
 * 🔧 STRIPE KEYS CONFIGURATOR
 * 
 * Dit script helpt je bij het veilig configureren van je Stripe keys
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 STRIPE KEYS CONFIGURATOR');
console.log('============================\n');

console.log('⚠️  BELANGRIJK:');
console.log('   → Start altijd met TEST keys (pk_test_... en sk_test_...)');
console.log('   → Ga pas naar LIVE keys na volledige verificatie');
console.log('   → Deel NOOIT je secret keys\n');

const stripeConfig = {};

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function configureStripe() {
  try {
    console.log('📝 Voer je Stripe configuratie in:\n');

    // Publishable Key
    stripeConfig.publishableKey = await askQuestion('🔑 Stripe Publishable Key (pk_test_...): ');
    if (!stripeConfig.publishableKey.startsWith('pk_')) {
      console.log('❌ Ongeldige publishable key format');
      process.exit(1);
    }

    // Secret Key
    stripeConfig.secretKey = await askQuestion('🔐 Stripe Secret Key (sk_test_...): ');
    if (!stripeConfig.secretKey.startsWith('sk_')) {
      console.log('❌ Ongeldige secret key format');
      process.exit(1);
    }

    // Webhook Secret
    stripeConfig.webhookSecret = await askQuestion('🪝 Webhook Secret (whsec_...): ');
    if (!stripeConfig.webhookSecret.startsWith('whsec_')) {
      console.log('❌ Ongeldige webhook secret format');
      process.exit(1);
    }

    // Price ID
    stripeConfig.priceId = await askQuestion('💰 Monthly Price ID (price_...): ');
    if (!stripeConfig.priceId.startsWith('price_')) {
      console.log('❌ Ongeldige price ID format');
      process.exit(1);
    }

    console.log('\n✅ Configuratie ontvangen!\n');

    // Update backend .env.render
    await updateBackendEnv();
    
    // Create frontend .env
    await updateFrontendEnv();

    console.log('🎉 Stripe configuratie voltooid!');
    console.log('\n📋 Volgende stappen:');
    console.log('   1. Test de configuratie lokaal');
    console.log('   2. Deploy naar Render (backend)');
    console.log('   3. Deploy naar Netlify (frontend)');
    console.log('   4. Test betalingen met test cards\n');

  } catch (error) {
    console.error('❌ Fout bij configuratie:', error.message);
  } finally {
    rl.close();
  }
}

async function updateBackendEnv() {
  const envPath = './backend/.env.render';
  
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Remove existing Stripe config
    envContent = envContent.replace(/STRIPE_.*=.*/g, '');
    
    // Add new Stripe config
    const stripeEnvVars = `
# Stripe Configuration
STRIPE_SECRET_KEY=${stripeConfig.secretKey}
STRIPE_PUBLISHABLE_KEY=${stripeConfig.publishableKey}
STRIPE_WEBHOOK_SECRET=${stripeConfig.webhookSecret}
STRIPE_MONTHLY_PRICE_ID=${stripeConfig.priceId}
STRIPE_CURRENCY=eur
STRIPE_PREMIUM_AMOUNT=9.99
`;

    envContent = envContent.trim() + stripeEnvVars;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Backend .env.render updated');
    
  } catch (error) {
    console.error('❌ Fout bij updaten backend env:', error.message);
  }
}

async function updateFrontendEnv() {
  const envPath = './frontend/.env';
  
  try {
    const envContent = `# Frontend Environment Variables

# API Configuration  
VITE_API_URL=https://globalscout-backend.onrender.com/api

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=${stripeConfig.publishableKey}

# App Configuration
VITE_APP_NAME=GlobalScout
VITE_APP_VERSION=1.0.0
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Frontend .env created');
    
  } catch (error) {
    console.error('❌ Fout bij maken frontend env:', error.message);
  }
}

// Start configuration
configureStripe();