#!/usr/bin/env node

/**
 * 🌍 Test Supabase Regions
 * 
 * Test welke regio correct is voor de Supabase Session Pooler
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const projectRef = 'pxiwcdsrkehxgguqyjur';
const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-1', 'eu-central-1'];

console.log('🌍 SUPABASE REGION CONNECTIVITY TEST');
console.log('====================================\n');

async function testRegion(region) {
  const hostname = `aws-0-${region}.pooler.supabase.com`;
  
  console.log(`🔍 Testing ${region.toUpperCase()}:`);
  console.log(`   Host: ${hostname}`);
  
  try {
    // Test DNS resolution
    const { stdout: digOutput } = await execAsync(`dig +short ${hostname}`);
    const ips = digOutput.trim().split('\n').filter(ip => ip);
    
    if (ips.length === 0) {
      console.log('   ❌ DNS resolution failed');
      return false;
    }
    
    console.log(`   ✅ DNS resolved: ${ips[0]}`);
    
    // Test port connectivity
    try {
      const { stdout: ncOutput } = await execAsync(`nc -z -w 5 ${hostname} 5432 2>&1`);
      console.log('   ✅ Port 5432 is reachable');
      return true;
    } catch (ncError) {
      console.log('   ❌ Port 5432 is not reachable');
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const results = {};
  
  for (const region of regions) {
    const isReachable = await testRegion(region);
    results[region] = isReachable;
    console.log('');
  }
  
  console.log('📊 RESULTS SUMMARY:');
  console.log('===================');
  
  const workingRegions = Object.entries(results)
    .filter(([region, works]) => works)
    .map(([region]) => region);
  
  if (workingRegions.length === 0) {
    console.log('❌ No regions are reachable');
    console.log('   This suggests the pooler URLs might be incorrect');
    console.log('   or there are network connectivity issues.');
  } else {
    console.log('✅ Working regions:');
    workingRegions.forEach(region => {
      console.log(`   - ${region}`);
    });
    
    console.log('\n🎯 RECOMMENDED ACTION:');
    console.log('======================');
    console.log(`Use region: ${workingRegions[0]}`);
    console.log(`URL: postgresql://postgres.${projectRef}:***@aws-0-${workingRegions[0]}.pooler.supabase.com:5432/postgres?sslmode=require`);
  }
  
  console.log('\n💡 NOTE:');
  console.log('=========');
  console.log('If no regions work, check your Supabase dashboard for the');
  console.log('correct connection string under Project Settings → Database → Connect');
}

main().catch(console.error);