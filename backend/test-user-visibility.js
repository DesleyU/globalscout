const { PrismaClient } = require('@prisma/client');

async function testUserVisibility() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user visibility and statistics...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    console.log(`📋 Found ${users.length} users:`);
    users.forEach(user => {
      const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'No profile';
      console.log(`  - ${user.email} (${user.role}) - ${name} - ID: ${user.id}`);
    });

    // Check statistics for each player
    console.log('\n📊 Checking statistics for each player:');
    
    for (const user of users.filter(u => u.role === 'PLAYER')) {
      const stats = await prisma.playerStatistics.findMany({
        where: { userId: user.id },
        select: {
          season: true,
          goalsTotal: true,
          goalsAssists: true,
          gamesAppearances: true,
          gamesMinutes: true
        }
      });

      const name = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email;
      console.log(`\n👤 ${name} (${user.email}):`);
      
      if (stats.length > 0) {
        console.log(`  ✅ Has ${stats.length} statistics records`);
        stats.forEach(stat => {
          console.log(`    - ${stat.season}: ${stat.goalsTotal || 0} goals, ${stat.goalsAssists || 0} assists, ${stat.gamesAppearances || 0} games`);
        });
      } else {
        console.log(`  ❌ No statistics found`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserVisibility();