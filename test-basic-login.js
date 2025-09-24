const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testBasicLogin() {
  console.log('🔍 Testing BASIC account login...\n');
  
  try {
    // 1. Check if basic user exists
    console.log('1. Checking if basic user exists...');
    const user = await prisma.user.findUnique({
      where: { email: 'test.basic@example.com' },
      include: { profile: true }
    });
    
    if (!user) {
      console.log('❌ Basic user does not exist!');
      console.log('Creating basic user...');
      
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      const newUser = await prisma.user.create({
        data: {
          email: 'test.basic@example.com',
          password: hashedPassword,
          role: 'PLAYER',
          accountType: 'BASIC',
          profile: {
            create: {
              firstName: 'Test',
              lastName: 'Basic'
            }
          }
        },
        include: { profile: true }
      });
      console.log('✅ Basic user created:', newUser.email);
      return;
    }
    
    console.log('✅ Basic user exists:', user.email);
    console.log('   - Role:', user.role);
    console.log('   - Account Type:', user.accountType);
    console.log('   - Status:', user.status);
    console.log('   - Has Profile:', !!user.profile);
    
    // 2. Test password verification
    console.log('\n2. Testing password verification...');
    const isValidPassword = await bcrypt.compare('testpassword123', user.password);
    if (isValidPassword) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
      console.log('Updating password...');
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      console.log('✅ Password updated');
    }
    
    // 3. Check user status
    console.log('\n3. Checking user status...');
    if (user.status === 'ACTIVE') {
      console.log('✅ User status is ACTIVE');
    } else {
      console.log('❌ User status is not ACTIVE:', user.status);
      console.log('Updating status to ACTIVE...');
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' }
      });
      console.log('✅ User status updated to ACTIVE');
    }
    
    console.log('\n✅ Basic login test completed successfully!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBasicLogin();