#!/usr/bin/env node

/**
 * 🔧 Fix Supabase Connection Format
 * 
 * Genereert de juiste Supabase connection strings volgens de officiële documentatie
 */

console.log('🔧 SUPABASE CONNECTION FORMAT FIX');
console.log('==================================\n');

// Project details (extracted from current URL)
const projectRef = 'pxiwcdsrkehxgguqyjur';
const password = 'Globalscout!2025';

console.log('📊 HUIDIGE CONFIGURATIE:');
console.log('------------------------');
console.log('❌ Verkeerd: db.pxiwcdsrkehxgguqyjur.supabase.co:5432');
console.log('   (Dit is de directe database URL, niet de pooler)\n');

console.log('✅ JUISTE CONFIGURATIES:');
console.log('-------------------------\n');

// Mogelijke regio's (meest waarschijnlijk eu-west-1 voor Europa)
const regions = ['eu-west-1', 'us-east-1', 'ap-southeast-1', 'eu-central-1'];

regions.forEach((region, index) => {
  console.log(`${index + 1}. REGIO: ${region.toUpperCase()}`);
  console.log('   ================');
  
  // Session pooler (poort 5432)
  const sessionUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`;
  console.log('   📡 Session Pooler (persistent connections):');
  console.log(`   ${sessionUrl.replace(`:${password}`, ':***')}\n`);
  
  // Transaction pooler (poort 6543)  
  const transactionUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?sslmode=require`;
  console.log('   ⚡ Transaction Pooler (serverless):');
  console.log(`   ${transactionUrl.replace(`:${password}`, ':***')}\n`);
});

console.log('🎯 AANBEVELING VOOR RENDER:');
console.log('===========================');
console.log('Voor Render (persistent container) gebruik Session Pooler:');
console.log(`postgresql://postgres.${projectRef}:${password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require`.replace(`:${password}`, ':***'));

console.log('\n📋 VOLGENDE STAPPEN:');
console.log('====================');
console.log('1. Ga naar Supabase Dashboard → Project Settings → Database');
console.log('2. Klik op "Connect" button');
console.log('3. Selecteer "Session pooler" tab');
console.log('4. Kopieer de exacte connection string');
console.log('5. Update render.yaml met de juiste URL');
console.log('6. Deploy en test opnieuw\n');

// Genereer render.yaml updates
console.log('🔄 RENDER.YAML UPDATES:');
console.log('=======================\n');

regions.forEach((region, index) => {
  const sessionUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-${region}.pooler.supabase.com:5432/postgres?sslmode=require`;
  
  console.log(`# Optie ${index + 1}: ${region}`);
  console.log('      - key: DATABASE_URL');
  console.log(`        value: ${sessionUrl}`);
  console.log('');
});

console.log('✅ Connection format fix script voltooid!');
console.log('   Gebruik de juiste pooler URL uit je Supabase dashboard.');