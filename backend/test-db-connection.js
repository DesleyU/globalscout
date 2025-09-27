const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: 'postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:5432/postgres'
    }
  }
});

async function testConnection() {
  try {
    console.log('🔍 Testing Prisma database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connection successful');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log('📊 User count:', userCount);
    
    // Test specific user lookup
    const user = await prisma.user.findUnique({
      where: { email: 'desley_u@hotmail.com' },
      include: { profile: true }
    });
    
    if (user) {
      console.log('✅ User found:', {
        email: user.email,
        role: user.role,
        status: user.status,
        hasProfile: !!user.profile
      });
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    console.log('Error details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();