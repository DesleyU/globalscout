const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use production database URL
const DATABASE_URL = "postgresql://postgres:Globalscout!2025@db.pxiwcdsrkehxgguqyjur.supabase.co:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createProductionUser() {
  try {
    console.log('🔗 Connecting to production database...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase PostgreSQL');

    const email = 'desley_u@hotmail.com';
    const password = 'desley123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });
    
    if (existingUser) {
      console.log('👤 User already exists, updating password...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update the user's password
      const updatedUser = await prisma.user.update({
        where: { email: email },
        data: { password: hashedPassword }
      });
      
      console.log('✅ Password updated successfully!');
      console.log('User ID:', updatedUser.id);
      
    } else {
      console.log('👤 Creating new user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create the user
      const newUser = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          role: 'PLAYER',
          accountType: 'BASIC',
          profile: {
            create: {
              firstName: 'Desley',
              lastName: 'Ubbink',
              position: 'MIDFIELDER',
              age: 32,
              clubName: 'Metaloglobus'
            }
          }
        },
        include: {
          profile: true
        }
      });
      
      console.log('✅ User created successfully!');
      console.log('User ID:', newUser.id);
      console.log('Profile ID:', newUser.profile.userId);
    }
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    // Test the password
    const testUser = await prisma.user.findUnique({
      where: { email: email }
    });
    
    const isValid = await bcrypt.compare(password, testUser.password);
    console.log('🔐 Password verification:', isValid ? '✅ SUCCESS' : '❌ FAILED');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

createProductionUser();