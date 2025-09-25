const { PrismaClient } = require('@prisma/client');

// Test Supabase PostgreSQL connection
async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase PostgreSQL connection...');
  
  // Temporarily override the schema to use PostgreSQL
  process.env.DATABASE_URL = 'postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:5432/postgres';
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test basic connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');

    // Test a simple query
    console.log('🔍 Testing database query...');
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful:', result);

    // Check if tables exist
    console.log('📋 Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('📊 Existing tables:', tables);

    if (tables.length === 0) {
      console.log('⚠️  No tables found - migrations need to be run');
    } else {
      console.log('✅ Database has tables - ready for use');
    }

  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    
    if (error.code === 'P1001') {
      console.log('💡 This might be a network connectivity issue');
    } else if (error.code === 'P1000') {
      console.log('💡 This might be an authentication issue - check your credentials');
    } else {
      console.log('💡 Error details:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSupabaseConnection();