#!/usr/bin/env node

/**
 * 🧪 STRIPE SETUP TESTER
 * 
 * Test je Stripe configuratie voordat je live gaat
 */

const fs = require('fs');

console.log('🧪 STRIPE SETUP TESTER');
console.log('=======================\n');

// Check environment files
function checkEnvironmentFiles() {
  console.log('📁 Checking environment files...\n');
  
  const files = [
    { path: './backend/.env.render', name: 'Backend Production' },
    { path: './frontend/.env', name: 'Frontend Production' }
  ];
  
  files.forEach(file => {
    const exists = fs.existsSync(file.path);
    console.log(`${exists ? '✅' : '❌'} ${file.name}: ${exists ? 'Found' : 'Missing'}`);
    
    if (exists) {
      const content = fs.readFileSync(file.path, 'utf8');
      
      // Check for Stripe keys
      const hasStripeKeys = content.includes('STRIPE_');
      console.log(`   ${hasStripeKeys ? '✅' : '❌'} Stripe keys: ${hasStripeKeys ? 'Configured' : 'Missing'}`);
      
      if (file.path.includes('backend')) {
        const requiredKeys = [
          'STRIPE_SECRET_KEY',
          'STRIPE_PUBLISHABLE_KEY', 
          'STRIPE_WEBHOOK_SECRET',
          'STRIPE_MONTHLY_PRICE_ID'
        ];
        
        requiredKeys.forEach(key => {
          const hasKey = content.includes(key);
          console.log(`   ${hasKey ? '✅' : '❌'} ${key}: ${hasKey ? 'Set' : 'Missing'}`);
        });
      }
      
      if (file.path.includes('frontend')) {
        const hasPublishableKey = content.includes('VITE_STRIPE_PUBLISHABLE_KEY');
        console.log(`   ${hasPublishableKey ? '✅' : '❌'} VITE_STRIPE_PUBLISHABLE_KEY: ${hasPublishableKey ? 'Set' : 'Missing'}`);
      }
    }
    console.log('');
  });
}

// Check Stripe integration files
function checkStripeFiles() {
  console.log('🔧 Checking Stripe integration files...\n');
  
  const stripeFiles = [
    './backend/src/services/stripeService.js',
    './backend/src/controllers/paymentController.js',
    './backend/src/routes/payment.js',
    './frontend/src/components/PaymentModal.jsx'
  ];
  
  stripeFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`);
  });
  console.log('');
}

// Test checklist
function showTestChecklist() {
  console.log('📋 STRIPE TEST CHECKLIST');
  console.log('========================\n');
  
  console.log('🏗️  SETUP TESTS:');
  console.log('   □ Stripe account created (Individual)');
  console.log('   □ Test API keys configured');
  console.log('   □ Product created in Stripe Dashboard');
  console.log('   □ Price ID configured (€9.99/month)');
  console.log('   □ Webhook endpoint configured\n');
  
  console.log('🧪 PAYMENT TESTS:');
  console.log('   □ Test credit card payment (4242 4242 4242 4242)');
  console.log('   □ Test declined payment (4000 0000 0000 0002)');
  console.log('   □ Test iDEAL payment (Test Bank)');
  console.log('   □ Test subscription creation');
  console.log('   □ Test subscription cancellation\n');
  
  console.log('🔗 INTEGRATION TESTS:');
  console.log('   □ Payment modal opens correctly');
  console.log('   □ User account upgrades to Premium');
  console.log('   □ Webhook events received');
  console.log('   □ Database records created');
  console.log('   □ Email notifications sent\n');
  
  console.log('🚀 DEPLOYMENT TESTS:');
  console.log('   □ Backend deployed to Render');
  console.log('   □ Frontend deployed to Netlify');
  console.log('   □ Environment variables set');
  console.log('   □ HTTPS endpoints working');
  console.log('   □ CORS configured correctly\n');
}

// Test commands
function showTestCommands() {
  console.log('🛠️  TEST COMMANDS');
  console.log('=================\n');
  
  console.log('Local testing:');
  console.log('   npm run test:stripe          # Test Stripe integration');
  console.log('   node test-stripe-payment.js  # Test payment flow');
  console.log('   npm run dev                   # Start development server\n');
  
  console.log('Production testing:');
  console.log('   curl https://globalscout.eu/api/payment/config');
  console.log('   curl https://globalscout.eu/api/health\n');
  
  console.log('Stripe Dashboard:');
  console.log('   → https://dashboard.stripe.com/test/payments');
  console.log('   → https://dashboard.stripe.com/test/webhooks');
  console.log('   → https://dashboard.stripe.com/test/logs\n');
}

// Run all checks
checkEnvironmentFiles();
checkStripeFiles();
showTestChecklist();
showTestCommands();

console.log('💡 TIPS:');
console.log('=======');
console.log('   ✅ Test altijd eerst lokaal');
console.log('   ✅ Controleer Stripe Dashboard logs');
console.log('   ✅ Gebruik test credit cards');
console.log('   ✅ Verifieer webhook events');
console.log('   ✅ Test alle payment flows\n');

console.log('🎯 VOLGENDE STAPPEN:');
console.log('===================');
console.log('   1. Run: node configure-stripe-keys.js');
console.log('   2. Test lokaal met test cards');
console.log('   3. Deploy naar productie');
console.log('   4. Test productie endpoints');
console.log('   5. Ga live na volledige verificatie\n');

console.log('🎉 Succes met je Stripe setup!');