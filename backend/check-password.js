const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'desley_u@hotmail.com' }
    });
    
    if (user) {
      console.log('✅ User found');
      console.log('Password hash exists:', !!user.password);
      console.log('Hash length:', user.password ? user.password.length : 0);
      
      // Test common passwords
      const testPasswords = ['testpass123', 'password123', 'desley123', '123456', 'test123'];
      
      for (const testPass of testPasswords) {
        const isValid = await bcrypt.compare(testPass, user.password);
        console.log(`Testing '${testPass}': ${isValid ? '✅ MATCH' : '❌ No match'}`);
      }
    } else {
      console.log('❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();