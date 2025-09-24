const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('./backend/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function checkLogin() {
  try {
    console.log('=== CHECKING LOGIN STATUS ===');
    
    // Check user account
    const user = await prisma.user.findUnique({
      where: { email: 'desley_u@hotmail.com' },
      include: { profile: true }
    });

    if (user) {
      console.log('✅ User found in database');
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Player ID:', user.playerId);
      console.log('Created:', user.createdAt);
      console.log('Updated:', user.updatedAt);
      
      if (user.profile) {
        console.log('\n=== PROFILE ===');
        console.log('Name:', user.profile.firstName, user.profile.lastName);
        console.log('Position:', user.profile.position);
      }

      // Test password verification
      console.log('\n=== PASSWORD TEST ===');
      const testPasswords = ['password123', 'desley123', 'password', '123456'];
      
      for (const testPassword of testPasswords) {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`Password "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        if (isValid) {
          console.log(`\n🎉 CORRECT PASSWORD FOUND: "${testPassword}"`);
          break;
        }
      }

    } else {
      console.log('❌ User not found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLogin();