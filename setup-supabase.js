#!/usr/bin/env node

/**
 * Supabase Setup Script for GlobalScout
 * This script helps configure Supabase as the production database
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 GlobalScout Supabase Setup');
console.log('==============================\n');

console.log('📋 Steps to set up Supabase:');
console.log('1. Go to https://supabase.com');
console.log('2. Create a new account or sign in');
console.log('3. Create a new project');
console.log('4. Choose a region close to your users');
console.log('5. Set a strong database password');
console.log('6. Wait for the project to be created (2-3 minutes)\n');

console.log('📝 After project creation, you\'ll need:');
console.log('- Project URL (https://your-project-ref.supabase.co)');
console.log('- Anon/Public Key (starts with "eyJ...")');
console.log('- Database URL (postgresql://postgres:...)');
console.log('- Service Role Key (for admin operations)\n');

console.log('🔧 Configuration locations:');
console.log('- Backend: backend/.env');
console.log('- Frontend: frontend/.env.production\n');

// Create a template for Supabase configuration
const supabaseTemplate = `# Supabase Configuration Template
# Copy these values from your Supabase project dashboard

# Project Settings > API
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Project Settings > Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres"

# For frontend (Vite)
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

fs.writeFileSync('supabase-config-template.env', supabaseTemplate);
console.log('✅ Created supabase-config-template.env');

console.log('\n🔗 Useful links:');
console.log('- Supabase Dashboard: https://app.supabase.com');
console.log('- Documentation: https://supabase.com/docs');
console.log('- Pricing: https://supabase.com/pricing (Free tier available)');

console.log('\n⚡ Quick setup commands after getting Supabase credentials:');
console.log('1. Update backend/.env with DATABASE_URL');
console.log('2. cd backend && npx prisma db push');
console.log('3. cd backend && npx prisma generate');
console.log('4. cd backend && npm run seed');

console.log('\n🎯 Next: Run the main deployment script');
console.log('chmod +x deploy.sh && ./deploy.sh');