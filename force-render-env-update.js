#!/usr/bin/env node

/**
 * 🔧 Force Render Environment Update Script
 * 
 * Dit script helpt bij het oplossen van het Render environment variabele probleem
 * waarbij de DATABASE_URL niet wordt bijgewerkt ondanks wijzigingen in render.yaml
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 RENDER ENVIRONMENT UPDATE SCRIPT');
console.log('=====================================\n');

// Huidige situatie
console.log('📊 HUIDIGE SITUATIE:');
console.log('- render.yaml bevat: poort 6543 (Connection Pooler)');
console.log('- Render gebruikt: poort 5432 (Direct Database)');
console.log('- Probleem: Environment variabele wordt niet bijgewerkt\n');

// Mogelijke oorzaken en oplossingen
console.log('🔍 MOGELIJKE OORZAKEN:');
console.log('1. Render dashboard overschrijft render.yaml');
console.log('2. Environment variabele caching in Render');
console.log('3. render.yaml wordt niet correct gelezen');
console.log('4. Prisma client cache probleem\n');

// Oplossingsstrategieën
console.log('💡 OPLOSSINGSSTRATEGIEËN:');
console.log('1. Manual environment update in Render dashboard');
console.log('2. Force Prisma client regeneration');
console.log('3. Alternative connection string formats');
console.log('4. Direct Supabase IP whitelisting check\n');

// Genereer verschillende DATABASE_URL varianten
const baseConfig = {
  user: 'postgres',
  password: 'Globalscout!2025',
  host: 'db.pxiwcdsrkehxgguqyjur.supabase.co',
  database: 'postgres'
};

const urlVariants = [
  {
    name: 'Connection Pooler (Session)',
    port: 6543,
    params: 'sslmode=require&pgbouncer=true',
    description: 'Supabase Connection Pooler in Session mode'
  },
  {
    name: 'Connection Pooler (Transaction)', 
    port: 6543,
    params: 'sslmode=require&pgbouncer=true&pool_mode=transaction',
    description: 'Supabase Connection Pooler in Transaction mode'
  },
  {
    name: 'Direct Database with SSL',
    port: 5432,
    params: 'sslmode=require',
    description: 'Direct database connection with SSL'
  },
  {
    name: 'Direct Database with full SSL',
    port: 5432, 
    params: 'sslmode=require&sslcert=&sslkey=&sslrootcert=',
    description: 'Direct database with full SSL parameters'
  }
];

console.log('🔗 DATABASE_URL VARIANTEN:');
urlVariants.forEach((variant, index) => {
  const url = `postgresql://${baseConfig.user}:${baseConfig.password}@${baseConfig.host}:${variant.port}/${baseConfig.database}?${variant.params}`;
  console.log(`\n${index + 1}. ${variant.name}`);
  console.log(`   ${variant.description}`);
  console.log(`   ${url}`);
});

// Genereer update scripts
console.log('\n📝 GENEREREN UPDATE SCRIPTS...\n');

// Script voor Prisma regeneration
const prismaRegenScript = `#!/bin/bash
echo "🔄 Forcing Prisma Client Regeneration"
echo "====================================="

# Verwijder bestaande Prisma client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# Regenereer Prisma client
npx prisma generate

# Deploy met force flag
git add .
git commit -m "🔄 Force Prisma client regeneration"
git push origin main

echo "✅ Prisma client regeneration deployed!"
echo "⏰ Wacht 2-3 minuten en test opnieuw"
`;

fs.writeFileSync('force-prisma-regen.sh', prismaRegenScript);
fs.chmodSync('force-prisma-regen.sh', '755');

// Script voor environment variabele test
const envTestScript = `#!/bin/bash
echo "🧪 Testing Environment Variables"
echo "==============================="

echo "⏰ Wachten op deployment..."
sleep 150

echo "🔍 Testing current DATABASE_URL..."
curl -s https://globalscout-backend-qbyh.onrender.com/api/test-db | jq '.'

echo ""
echo "📊 Analyseer de 'databaseUrl' field in de response"
echo "   - Als het nog steeds :5432 toont, dan overschrijft Render dashboard de render.yaml"
echo "   - Als het :6543 toont, dan werkt de connection pooler niet"
`;

fs.writeFileSync('test-env-vars.sh', envTestScript);
fs.chmodSync('test-env-vars.sh', '755');

console.log('✅ Scripts gegenereerd:');
console.log('   - force-prisma-regen.sh');
console.log('   - test-env-vars.sh\n');

// Instructies
console.log('📋 VOLGENDE STAPPEN:');
console.log('1. Ga naar Render Dashboard (https://dashboard.render.com)');
console.log('2. Open globalscout-backend service');
console.log('3. Ga naar Environment tab');
console.log('4. Update DATABASE_URL handmatig naar:');
console.log('   postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:6543/postgres?sslmode=require&pgbouncer=true');
console.log('5. Save en wacht op redeploy');
console.log('6. Test met: ./test-env-vars.sh\n');

console.log('🔄 ALTERNATIEF - Probeer Prisma regeneration:');
console.log('   ./force-prisma-regen.sh\n');

console.log('🆘 ALS NIETS WERKT:');
console.log('1. Check Supabase dashboard voor IP restrictions');
console.log('2. Probeer direct database connection (poort 5432)');
console.log('3. Contact Supabase support voor Render IP whitelisting\n');

console.log('✅ Script voltooid! Volg de instructies hierboven.');