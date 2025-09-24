const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixBasicLogin() {
  console.log('🔧 Fixing BASIC account login...\n');
  
  try {
    // Ensure basic user exists with correct data
    console.log('1. Creating/updating basic test account...');
    
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const basicUser = await prisma.user.upsert({
      where: { email: 'test.basic@example.com' },
      update: {
        password: hashedPassword,
        role: 'PLAYER',
        accountType: 'BASIC',
        status: 'ACTIVE'
      },
      create: {
        email: 'test.basic@example.com',
        password: hashedPassword,
        role: 'PLAYER',
        accountType: 'BASIC',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Basic'
          }
        }
      },
      include: { profile: true }
    });
    
    console.log('✅ Basic user created/updated:');
    console.log('   - Email:', basicUser.email);
    console.log('   - Role:', basicUser.role);
    console.log('   - Account Type:', basicUser.accountType);
    console.log('   - Status:', basicUser.status);
    console.log('   - Has Profile:', !!basicUser.profile);
    
    // Test password verification
    console.log('\n2. Testing password verification...');
    const isValidPassword = await bcrypt.compare('testpassword123', basicUser.password);
    console.log('   - Password valid:', isValidPassword);
    
    // Create premium user as well for comparison
    console.log('\n3. Creating/updating premium test account...');
    
    const premiumUser = await prisma.user.upsert({
      where: { email: 'test.premium@example.com' },
      update: {
        password: hashedPassword,
        role: 'PLAYER',
        accountType: 'PREMIUM',
        status: 'ACTIVE'
      },
      create: {
        email: 'test.premium@example.com',
        password: hashedPassword,
        role: 'PLAYER',
        accountType: 'PREMIUM',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Premium'
          }
        }
      },
      include: { profile: true }
    });
    
    console.log('✅ Premium user created/updated:');
    console.log('   - Email:', premiumUser.email);
    console.log('   - Account Type:', premiumUser.accountType);
    
    console.log('\n✅ Login fix completed successfully!');
    console.log('\nTest credentials:');
    console.log('BASIC:   test.basic@example.com / testpassword123');
    console.log('PREMIUM: test.premium@example.com / testpassword123');
    
  } catch (error) {
    console.error('💥 Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBasicLogin();