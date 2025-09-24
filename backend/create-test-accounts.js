const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestAccounts() {
  console.log('🔧 Creating test accounts for account type testing...\n');

  try {
    // Hash password for test accounts
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    // Create Basic Test Account
    console.log('👤 Creating BASIC test account...');
    const basicUser = await prisma.user.upsert({
      where: { email: 'test.basic@example.com' },
      update: {
        accountType: 'BASIC'
      },
      create: {
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
      }
    });
    console.log(`✅ Basic account created: ${basicUser.email} (ID: ${basicUser.id})`);

    // Create Premium Test Account
    console.log('\n👤 Creating PREMIUM test account...');
    const premiumUser = await prisma.user.upsert({
      where: { email: 'test.premium@example.com' },
      update: {
        accountType: 'PREMIUM'
      },
      create: {
        email: 'test.premium@example.com',
        password: hashedPassword,
        role: 'PLAYER',
        accountType: 'PREMIUM',
        profile: {
          create: {
            firstName: 'Test',
            lastName: 'Premium'
          }
        }
      }
    });
    console.log(`✅ Premium account created: ${premiumUser.email} (ID: ${premiumUser.id})`);

    // Add some test stats for both users
    console.log('\n📊 Adding test statistics...');
    
    // Basic user stats
    await prisma.playerStats.upsert({
      where: {
        userId_season: {
          userId: basicUser.id,
          season: '2024-25'
        }
      },
      update: {},
      create: {
        userId: basicUser.id,
        season: '2024-25',
        goals: 5,
        assists: 3,
        minutes: 1800,
        matches: 20,
        yellowCards: 2,
        redCards: 0,
        rating: 7.2
      }
    });

    // Premium user stats
    await prisma.playerStats.upsert({
      where: {
        userId_season: {
          userId: premiumUser.id,
          season: '2024-25'
        }
      },
      update: {},
      create: {
        userId: premiumUser.id,
        season: '2024-25',
        goals: 12,
        assists: 8,
        minutes: 2700,
        matches: 30,
        yellowCards: 1,
        redCards: 0,
        rating: 8.1
      }
    });

    console.log('✅ Test statistics added for both accounts');

    console.log('\n🎉 Test accounts created successfully!');
    console.log('\n📋 Login credentials:');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ BASIC Account:                                          │');
    console.log('│ Email: test.basic@example.com                          │');
    console.log('│ Password: testpassword123                              │');
    console.log('│ Account Type: BASIC                                     │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│ PREMIUM Account:                                        │');
    console.log('│ Email: test.premium@example.com                        │');
    console.log('│ Password: testpassword123                              │');
    console.log('│ Account Type: PREMIUM                                   │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n💡 Je kunt nu inloggen met deze accounts om het verschil');
    console.log('   tussen BASIC en PREMIUM statistieken te testen!');

  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts();