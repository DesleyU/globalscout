const { PrismaClient } = require('./backend/node_modules/.prisma/client');

async function checkCurrentStats() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking current statistics in database...\n');
    
    // Get all player statistics
    const stats = await prisma.playerStatistics.findMany({
      select: {
        id: true,
        playerName: true,
        season: true,
        leagueName: true,
        lastUpdated: true,
        createdAt: true
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    });
    
    console.log(`📊 Found ${stats.length} statistics records:\n`);
    
    // Group by season
    const seasonGroups = {};
    stats.forEach(stat => {
      if (!seasonGroups[stat.season]) {
        seasonGroups[stat.season] = [];
      }
      seasonGroups[stat.season].push(stat);
    });
    
    // Display by season
    Object.keys(seasonGroups).forEach(season => {
      console.log(`🏆 Season: ${season} (${seasonGroups[season].length} records)`);
      seasonGroups[season].forEach(stat => {
        console.log(`  - ${stat.playerName} (${stat.leagueName}) - Last updated: ${stat.lastUpdated?.toISOString() || 'Never'}`);
      });
      console.log('');
    });
    
    // Check if we need to update seasons
    const has2024Season = stats.some(stat => stat.season.includes('2024'));
    const has2025Season = stats.some(stat => stat.season.includes('2025'));
    
    console.log('🔧 Season Analysis:');
    console.log(`- Has 2024/2025 season data: ${has2024Season}`);
    console.log(`- Has 2025/2026 season data: ${has2025Season}`);
    
    if (has2024Season && !has2025Season) {
      console.log('\n⚠️  WARNING: Found 2024/2025 season data but no 2025/2026 data!');
      console.log('   This might explain why statistics are incorrect.');
    }
    
  } catch (error) {
    console.error('❌ Error checking statistics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentStats();