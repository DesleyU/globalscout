const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkSeasons() {
  try {
    console.log('=== BESCHIKBARE SEIZOENEN IN DATABASE ===\n');
    
    // Haal alle unieke seizoenen op
    const seasons = await prisma.playerStatistics.findMany({
      select: {
        season: true,
        playerName: true,
        teamName: true,
        leagueName: true
      },
      distinct: ['season']
    });
    
    console.log(`📊 Aantal unieke seizoenen gevonden: ${seasons.length}\n`);
    
    seasons.forEach((record, index) => {
      console.log(`${index + 1}. Seizoen: ${record.season}`);
      console.log(`   Speler: ${record.playerName}`);
      console.log(`   Team: ${record.teamName}`);
      console.log(`   Liga: ${record.leagueName}\n`);
    });
    
    // Controleer of er al 2025/2026 data is
    const has2025Data = seasons.some(s => s.season.includes('2025') || s.season.includes('2026'));
    
    if (has2025Data) {
      console.log('✅ Er is al data voor seizoen 2025/2026 beschikbaar');
    } else {
      console.log('❌ Geen data voor seizoen 2025/2026 gevonden');
      console.log('💡 We moeten nieuwe data importeren of bestaande data aanpassen');
    }
    
  } catch (error) {
    console.error('❌ Fout bij controleren seizoenen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeasons();