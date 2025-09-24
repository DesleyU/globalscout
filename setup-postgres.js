#!/usr/bin/env node

/**
 * PostgreSQL Database Setup Script
 * Helps migrate from SQLite to PostgreSQL for production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐘 PostgreSQL Database Setup for GlobalScout');
console.log('=============================================');

// Check if we're in the right directory
if (!fs.existsSync('backend/prisma/schema.prisma')) {
    console.error('❌ Error: Please run this script from the project root directory');
    process.exit(1);
}

// Function to execute command and handle errors
function runCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        execSync(command, { stdio: 'inherit', cwd: 'backend' });
        console.log(`✅ ${description} completed`);
    } catch (error) {
        console.error(`❌ Error during: ${description}`);
        console.error(error.message);
        process.exit(1);
    }
}

// Check if PostgreSQL is available
function checkPostgreSQL() {
    try {
        execSync('which psql', { stdio: 'ignore' });
        console.log('✅ PostgreSQL client found');
        return true;
    } catch (error) {
        console.log('⚠️  PostgreSQL client not found locally');
        console.log('   You can use a cloud database service like:');
        console.log('   - Supabase (recommended): https://supabase.com');
        console.log('   - Railway: https://railway.app');
        console.log('   - Heroku Postgres: https://www.heroku.com/postgres');
        console.log('   - AWS RDS: https://aws.amazon.com/rds/');
        return false;
    }
}

// Main setup process
async function setupPostgreSQL() {
    console.log('\n🔍 Checking PostgreSQL availability...');
    const hasPostgreSQL = checkPostgreSQL();
    
    console.log('\n📝 Setting up production schema...');
    
    // Backup current schema
    if (fs.existsSync('backend/prisma/schema.prisma')) {
        fs.copyFileSync(
            'backend/prisma/schema.prisma', 
            'backend/prisma/schema.sqlite.backup'
        );
        console.log('✅ SQLite schema backed up to schema.sqlite.backup');
    }
    
    // Copy production schema
    if (fs.existsSync('backend/prisma/schema.production.prisma')) {
        fs.copyFileSync(
            'backend/prisma/schema.production.prisma',
            'backend/prisma/schema.prisma'
        );
        console.log('✅ PostgreSQL schema activated');
    } else {
        console.error('❌ Production schema not found!');
        process.exit(1);
    }
    
    // Generate Prisma client
    runCommand('npx prisma generate', 'Generating Prisma client for PostgreSQL');
    
    console.log('\n🔧 Environment Configuration:');
    
    // Check if .env exists
    if (!fs.existsSync('backend/.env')) {
        console.log('📝 Creating .env from production template...');
        fs.copyFileSync('backend/.env.production', 'backend/.env');
        console.log('✅ .env file created');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. 🔑 Set up your PostgreSQL database:');
    
    if (hasPostgreSQL) {
        console.log('   Local PostgreSQL:');
        console.log('   createdb globalscout_prod');
        console.log('   psql globalscout_prod');
    }
    
    console.log('\n   Or use a cloud service:');
    console.log('   🌟 Supabase (Recommended):');
    console.log('      - Go to https://supabase.com');
    console.log('      - Create new project');
    console.log('      - Copy connection string to DATABASE_URL in .env');
    
    console.log('\n2. 📝 Edit backend/.env with your database URL:');
    console.log('   DATABASE_URL="postgresql://user:password@host:5432/database"');
    
    console.log('\n3. 🚀 Run database migration:');
    console.log('   cd backend && npx prisma migrate deploy');
    
    console.log('\n4. 🌱 Seed the database (optional):');
    console.log('   cd backend && npm run seed');
    
    console.log('\n5. ✅ Test the connection:');
    console.log('   cd backend && npx prisma db pull');
    
    console.log('\n🔄 To revert to SQLite (development):');
    console.log('   cp backend/prisma/schema.sqlite.backup backend/prisma/schema.prisma');
    console.log('   cd backend && npx prisma generate');
}

// Run the setup
setupPostgreSQL().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
});