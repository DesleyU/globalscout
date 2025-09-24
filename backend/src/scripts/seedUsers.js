const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'john.doe@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PLAYER',
    profile: {
      position: 'FORWARD',
      clubName: 'FC Barcelona',
      bio: 'Professional football player with 5 years of experience.',
      city: 'Barcelona',
      country: 'Spain'
    }
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'SCOUT_AGENT',
    profile: {
      clubName: 'Real Madrid',
      bio: 'Experienced scout looking for talented players.',
      city: 'Madrid',
      country: 'Spain'
    }
  },
  {
    email: 'mike.johnson@example.com',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'PLAYER',
    profile: {
      position: 'MIDFIELDER',
      clubName: 'Manchester United',
      bio: 'Young midfielder with great potential.',
      city: 'Manchester',
      country: 'UK'
    }
  },
  {
    email: 'sarah.wilson@example.com',
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'CLUB',
    profile: {
      clubName: 'Chelsea FC',
      bio: 'Youth coach with 10 years of experience.',
      city: 'London',
      country: 'UK'
    }
  },
  {
    email: 'alex.garcia@example.com',
    password: 'password123',
    firstName: 'Alex',
    lastName: 'Garcia',
    role: 'PLAYER',
    profile: {
      position: 'DEFENDER',
      clubName: 'Atletico Madrid',
      bio: 'Solid defender with leadership qualities.',
      city: 'Madrid',
      country: 'Spain'
    }
  },
  {
    email: 'emma.brown@example.com',
    password: 'password123',
    firstName: 'Emma',
    lastName: 'Brown',
    role: 'SCOUT_AGENT',
    profile: {
      clubName: 'Liverpool FC',
      bio: 'Scout specializing in youth talent identification.',
      city: 'Liverpool',
      country: 'UK'
    }
  },
  {
    email: 'david.martinez@example.com',
    password: 'password123',
    firstName: 'David',
    lastName: 'Martinez',
    role: 'PLAYER',
    profile: {
      position: 'GOALKEEPER',
      clubName: 'Valencia CF',
      bio: 'Experienced goalkeeper with excellent reflexes.',
      city: 'Valencia',
      country: 'Spain'
    }
  },
  {
    email: 'lisa.anderson@example.com',
    password: 'password123',
    firstName: 'Lisa',
    lastName: 'Anderson',
    role: 'CLUB',
    profile: {
      clubName: 'Arsenal FC',
      bio: 'Technical coach focused on player development.',
      city: 'London',
      country: 'UK'
    }
  }
];

async function seedUsers() {
  console.log('🌱 Starting to seed users...');
  
  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user with profile
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          profile: {
            create: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              ...userData.profile
            }
          }
        },
        include: {
          profile: true
        }
      });
      
      console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
    }
    
    console.log('🎉 User seeding completed successfully!');
    
    // Show total user count
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsers();