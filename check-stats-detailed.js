const { PrismaClient } = require('./backend/node_modules/.prisma/client');

async function checkStatsDetailed() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Detailed statistics check for Desley Ubbink...\n');
    
    // Get user
    const user = await prisma.user.findFirst({
      where: { email: 'desley_u@hotmail.com' },
      include: { profile: true }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`👤 User: ${user.profile?.firstName} ${user.profile?.lastName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 Player ID: ${user.playerId}`);
    console.log(`👥 Role: ${user.role}\n`);
    
    // Get all statistics for this user
    const allStats = await prisma.playerStatistics.findMany({
      where: { userId: user.id },
      orderBy: { lastUpdated: 'desc' }
    });
    
    console.log(`📊 Total statistics records: ${allStats.length}\n`);
    
    allStats.forEach((stat, index) => {
      console.log(`📈 Record ${index + 1}:`);
      console.log(`- Season: ${stat.season}`);
      console.log(`- League: ${stat.leagueName} (ID: ${stat.apiLeagueId})`);
      console.log(`- Team: ${stat.teamName} (ID: ${stat.apiTeamId})`);
      console.log(`- Player Name: ${stat.playerName}`);
      console.log(`- API Player ID: ${stat.apiPlayerId}`);
      console.log(`\n🎯 Key Statistics:`);
      console.log(`  - Goals: ${stat.goals}`);
      console.log(`  - Assists: ${stat.assists}`);
      console.log(`  - Appearances: ${stat.appearances}`);
      console.log(`  - Minutes: ${stat.minutes}`);
      console.log(`  - Position: ${stat.position}`);
      console.log(`  - Rating: ${stat.rating}`);
      console.log(`\n⚽ Additional Stats:`);
      console.log(`  - Lineups: ${stat.lineups}`);
      console.log(`  - Goals Home: ${stat.goalsHome}`);
      console.log(`  - Goals Away: ${stat.goalsAway}`);
      console.log(`  - Shots Total: ${stat.shotsTotal}`);
      console.log(`  - Shots On Target: ${stat.shotsOnTarget}`);
      console.log(`  - Passes Total: ${stat.passesTotal}`);
      console.log(`  - Passes Key: ${stat.passesKey}`);
      console.log(`  - Passes Accuracy: ${stat.passesAccuracy}%`);
      console.log(`  - Yellow Cards: ${stat.yellowCards}`);
      console.log(`  - Red Cards: ${stat.redCards}`);
      console.log(`\n📅 Timestamps:`);
      console.log(`  - Created: ${stat.createdAt}`);
      console.log(`  - Last Updated: ${stat.lastUpdated}`);
      console.log(`\n${'='.repeat(50)}\n`);
    });
    
    // Check what the current season should be
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    console.log(`📅 Current Date Analysis:`);
    console.log(`- Current Date: ${currentDate.toISOString().split('T')[0]}`);
    console.log(`- Current Year: ${currentYear}`);
    console.log(`- Current Month: ${currentMonth}`);
    
    // Football seasons typically run from August to May
    let expectedSeason;
    if (currentMonth >= 8) {
      // August or later = start of new season
      expectedSeason = `${currentYear}/${currentYear + 1}`;
    } else {
      // Before August = still in previous season
      expectedSeason = `${currentYear - 1}/${currentYear}`;
    }
    
    console.log(`- Expected Season: ${expectedSeason}`);
    
    // Check if we have stats for the expected season
    const expectedSeasonStats = allStats.filter(stat => stat.season === expectedSeason);
    console.log(`- Stats for expected season: ${expectedSeasonStats.length} records`);
    
    if (expectedSeasonStats.length === 0) {
      console.log(`\n⚠️  WARNING: No statistics found for expected season ${expectedSeason}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatsDetailed();