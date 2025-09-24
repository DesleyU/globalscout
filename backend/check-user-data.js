const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log('🔍 Checking user data in database...\n');
    
    // Check all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        playerId: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${users.length} users in database:`);
    users.forEach((user, index) => {
      const fullName = user.profile ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : 'No profile';
      console.log(`${index + 1}. User: ${fullName || 'No name'} (${user.email})`);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Player ID: ${user.playerId || 'NOT SET'}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check if there are any player statistics
    const statsCount = await prisma.playerStatistics.count();
    console.log(`📈 Total player statistics records: ${statsCount}`);
    
    if (statsCount > 0) {
      const recentStats = await prisma.playerStatistics.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { 
              email: true, 
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });
      
      console.log('\n🏆 Recent statistics:');
      recentStats.forEach((stat, index) => {
        const userName = stat.user?.profile ? 
          `${stat.user.profile.firstName || ''} ${stat.user.profile.lastName || ''}`.trim() : 
          stat.user?.email;
        console.log(`${index + 1}. Player ID: ${stat.playerId}, Season: ${stat.season}`);
        console.log(`   - User: ${userName || 'Unknown'}`);
        console.log(`   - League: ${stat.leagueName}`);
        console.log(`   - Games: ${stat.gamesPlayed}, Goals: ${stat.goals}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();