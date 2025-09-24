const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function updateTo2025Season() {
  try {
    console.log('=== BIJWERKEN NAAR SEIZOEN 2025/2026 ===\n');
    
    // Haal huidige statistieken op
    const currentStats = await prisma.playerStatistics.findMany({
      where: {
        season: '2024'
      }
    });
    
    console.log(`📊 Gevonden ${currentStats.length} records voor seizoen 2024\n`);
    
    if (currentStats.length === 0) {
      console.log('❌ Geen data gevonden om bij te werken');
      return;
    }
    
    // Update alle records naar seizoen 2025/2026
    const updateResult = await prisma.playerStatistics.updateMany({
      where: {
        season: '2024'
      },
      data: {
        season: '2025/2026'
      }
    });
    
    console.log(`✅ ${updateResult.count} records bijgewerkt naar seizoen 2025/2026\n`);
    
    // Verificeer de update
    const updatedStats = await prisma.playerStatistics.findMany({
      where: {
        season: '2025/2026'
      },
      select: {
        season: true,
        playerName: true,
        teamName: true,
        leagueName: true,
        appearances: true,
        goals: true,
        assists: true
      }
    });
    
    console.log('📈 BIJGEWERKTE STATISTIEKEN:');
    updatedStats.forEach((stat, index) => {
      console.log(`${index + 1}. ${stat.playerName} - ${stat.teamName}`);
      console.log(`   Seizoen: ${stat.season}`);
      console.log(`   Liga: ${stat.leagueName}`);
      console.log(`   Wedstrijden: ${stat.appearances}, Goals: ${stat.goals}, Assists: ${stat.assists}\n`);
    });
    
    console.log('🎉 SEIZOEN SUCCESVOL BIJGEWERKT NAAR 2025/2026!');
    
  } catch (error) {
    console.error('❌ Fout bij bijwerken seizoen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTo2025Season();