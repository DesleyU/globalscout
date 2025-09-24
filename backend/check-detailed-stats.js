const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDetailedStats() {
  try {
    console.log('🔍 Checking detailed statistics in database...\n');
    
    // Get user with Player ID 61415
    const user = await prisma.user.findFirst({
      where: {
        playerId: 61415
      },
      select: {
        id: true,
        email: true,
        playerId: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User with Player ID 61415 not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.profile?.firstName} ${user.profile?.lastName} (${user.email})`);
    console.log(`   Player ID: ${user.playerId}`);
    
    // Get all statistics for this user
    console.log('\n📊 Getting all statistics for this user...');
    const stats = await prisma.playerStatistics.findMany({
      where: {
        userId: user.id
      },
      orderBy: [
        { season: 'desc' },
        { leagueName: 'asc' }
      ]
    });
    
    console.log(`\n✅ Found ${stats.length} statistics records:`);
    
    stats.forEach((stat, index) => {
      console.log(`\n${index + 1}. ${stat.leagueName} (${stat.season})`);
      console.log(`   Team: ${stat.teamName}`);
      console.log(`   Games: ${stat.games || 0} | Goals: ${stat.goals || 0} | Assists: ${stat.assists || 0}`);
      console.log(`   Yellow Cards: ${stat.yellowCards || 0} | Red Cards: ${stat.redCards || 0}`);
      console.log(`   Minutes: ${stat.minutesPlayed || 0} | Rating: ${stat.rating || 'N/A'}`);
      console.log(`   Position: ${stat.position || 'N/A'}`);
      console.log(`   Created: ${stat.createdAt}`);
      console.log(`   Updated: ${stat.updatedAt}`);
    });
    
    // Check if there are any missing fields
    console.log('\n🔍 Checking for missing or null fields...');
    const fieldsToCheck = ['games', 'goals', 'assists', 'yellowCards', 'redCards', 'minutesPlayed', 'rating', 'position'];
    
    fieldsToCheck.forEach(field => {
      const nullCount = stats.filter(stat => stat[field] === null || stat[field] === undefined).length;
      const totalCount = stats.length;
      console.log(`   ${field}: ${nullCount}/${totalCount} records have null/undefined values`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDetailedStats();