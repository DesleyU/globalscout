const { PrismaClient } = require('@prisma/client');

async function addTestStats() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Adding test statistics to another user...\n');

    // Find John Doe user
    const johnDoe = await prisma.user.findFirst({
      where: { email: 'john.doe@example.com' }
    });

    if (!johnDoe) {
      console.log('❌ John Doe user not found');
      return;
    }

    console.log(`👤 Found John Doe: ${johnDoe.id}`);

    // Add some test statistics for John Doe
    const testStats = [
      {
        userId: johnDoe.id,
        apiPlayerId: 999001, // Fake API ID
        apiLeagueId: 39, // Premier League
        apiTeamId: 50, // Manchester City
        season: 2023,
        playerName: 'John Doe',
        teamName: 'Test Team FC',
        leagueName: 'Test League',
        goalsTotal: 12,
        goalsAssists: 8,
        gamesAppearances: 25,
        gamesMinutes: 2100,
        cardsYellow: 3,
        cardsRed: 0,
        gamesRating: 7.5,
        passesAccuracy: 85,
        tacklesTotal: 45,
        tacklesInterceptions: 12,
        duelsWon: 65
      },
      {
        userId: johnDoe.id,
        apiPlayerId: 999001, // Fake API ID
        apiLeagueId: 39, // Premier League
        apiTeamId: 50, // Manchester City
        season: 2022,
        playerName: 'John Doe',
        teamName: 'Test Team FC',
        leagueName: 'Test League',
        goalsTotal: 8,
        goalsAssists: 5,
        gamesAppearances: 20,
        gamesMinutes: 1800,
        cardsYellow: 2,
        cardsRed: 1,
        gamesRating: 7.2,
        passesAccuracy: 82,
        tacklesTotal: 38,
        tacklesInterceptions: 10,
        duelsWon: 58
      }
    ];

    // Check if stats already exist
    const existingStats = await prisma.playerStatistics.findMany({
      where: { userId: johnDoe.id }
    });

    if (existingStats.length > 0) {
      console.log('✅ John Doe already has statistics');
      existingStats.forEach(stat => {
        console.log(`  - ${stat.season}: ${stat.goalsTotal || 0} goals, ${stat.goalsAssists || 0} assists`);
      });
      return;
    }

    // Add the statistics
    for (const stat of testStats) {
      await prisma.playerStatistics.create({
        data: stat
      });
    }

    console.log('✅ Added test statistics for John Doe:');
    testStats.forEach(stat => {
      console.log(`  - ${stat.season}: ${stat.goalsTotal} goals, ${stat.goalsAssists} assists, ${stat.gamesAppearances} games`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestStats();