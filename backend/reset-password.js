const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'desley_u@hotmail.com';
    const newPassword = 'desley123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password reset successful!');
    console.log('Email:', email);
    console.log('New password:', newPassword);
    console.log('User ID:', updatedUser.id);
    
    // Test the new password
    const testUser = await prisma.user.findUnique({
      where: { email: email }
    });
    
    const isValid = await bcrypt.compare(newPassword, testUser.password);
    console.log('Password verification:', isValid ? '✅ SUCCESS' : '❌ FAILED');
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();