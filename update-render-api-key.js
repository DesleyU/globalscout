#!/usr/bin/env node

console.log('🔑 Update Render API Key');
console.log('========================');
console.log('');

console.log('📋 Stappen om de API key bij te werken op Render:');
console.log('');

console.log('1. 🌐 Ga naar Render Dashboard:');
console.log('   https://dashboard.render.com');
console.log('');

console.log('2. 🔍 Zoek je GlobalScout service:');
console.log('   Service naam: "globalscout-backend-qbyh"');
console.log('   Of zoek op: "GlobalScout"');
console.log('');

console.log('3. ⚙️  Klik op je service en ga naar "Environment" tab');
console.log('');

console.log('4. 🔑 Zoek de "API_FOOTBALL_KEY" variabele');
console.log('');

console.log('5. ✏️  Update de waarde naar:');
console.log('   015322d016c9ab2db54cc49f49736279');
console.log('');

console.log('6. 💾 Klik op "Save Changes"');
console.log('');

console.log('7. 🔄 Render zal automatisch je service herstarten');
console.log('   Dit duurt ongeveer 2-3 minuten');
console.log('');

console.log('8. ✅ Wacht tot de deployment voltooid is');
console.log('   Status wordt "Live" wanneer klaar');
console.log('');

console.log('🎯 Verificatie stappen:');
console.log('======================');
console.log('');

console.log('Na de herstart kun je testen met:');
console.log('');
console.log('# Test de Render deployment:');
console.log('node test-render-connections.js');
console.log('');
console.log('# Test specifiek de nieuwe API key:');
console.log('node test-api-football-render.js');
console.log('');

console.log('🚨 Belangrijke opmerkingen:');
console.log('============================');
console.log('');
console.log('• De oude API key werkt niet meer');
console.log('• Render herstart automatisch na wijzigingen');
console.log('• Wacht tot deployment "Live" is voordat je test');
console.log('• De nieuwe key heeft een verse quota (100 requests/dag)');
console.log('');

console.log('💡 Als er problemen zijn:');
console.log('==========================');
console.log('');
console.log('1. Controleer spelling van "API_FOOTBALL_KEY"');
console.log('2. Geen spaties voor/na de key waarde');
console.log('3. Key moet exact zijn: 015322d016c9ab2db54cc49f49736279');
console.log('4. Wacht tot deployment volledig klaar is');
console.log('5. Test eerst lokaal met: node test-new-api-key.js');
console.log('');

console.log('🎉 Klaar! Je nieuwe API key is nu geconfigureerd.');
console.log('');

// Test de nieuwe key ook lokaal
console.log('🧪 Quick lokale test van nieuwe key...');
console.log('');

const axios = require('axios');

async function quickTest() {
  try {
    const response = await axios.get('https://v3.football.api-sports.io/status', {
      headers: {
        'X-RapidAPI-Key': '015322d016c9ab2db54cc49f49736279',
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    });
    
    console.log('✅ Nieuwe API key werkt lokaal!');
    console.log(`📊 Quota: ${response.data.response.requests.current}/${response.data.response.requests.limit_day} requests gebruikt`);
  } catch (error) {
    console.log('❌ Probleem met nieuwe API key:');
    console.log(error.response?.data || error.message);
  }
}

quickTest();