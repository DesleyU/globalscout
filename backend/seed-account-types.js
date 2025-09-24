const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with account types...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Basic account user (John Doe)
  const johnDoe = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {
      accountType: 'BASIC'
    },
    create: {
      email: 'john.doe@example.com',
      password: hashedPassword,
      role: 'PLAYER',
      accountType: 'BASIC',
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          position: 'MIDFIELDER',
          age: 25,
          height: 180,
          weight: 75,
          nationality: 'Netherlands',
          bio: 'Midfielder with Basic account - limited statistics view'
        }
      }
    },
    include: {
      profile: true
    }
  });

  // Create Premium account user (Desley Ubbink)
  const desleyUbbink = await prisma.user.upsert({
    where: { email: 'desley.ubbink@example.com' },
    update: {
      accountType: 'PREMIUM'
    },
    create: {
      email: 'desley.ubbink@example.com',
      password: hashedPassword,
      role: 'PLAYER',
      accountType: 'PREMIUM',
      profile: {
        create: {
          firstName: 'Desley',
          lastName: 'Ubbink',
          position: 'FORWARD',
          age: 28,
          height: 185,
          weight: 78,
          nationality: 'Netherlands',
          bio: 'Forward with Premium account - full statistics access'
        }
      }
    },
    include: {
      profile: true
    }
  });

  // Create Basic account scout
  const scout = await prisma.user.upsert({
    where: { email: 'scout@example.com' },
    update: {
      accountType: 'BASIC'
    },
    create: {
      email: 'scout@example.com',
      password: hashedPassword,
      role: 'SCOUT_AGENT',
      accountType: 'BASIC',
      profile: {
        create: {
          firstName: 'Scout',
          lastName: 'Agent',
          bio: 'Talent scout with Basic account'
        }
      }
    },
    include: {
      profile: true
    }
  });

  // Add some statistics for both players
  console.log('📊 Adding player statistics...');

  // Basic stats for John Doe (Basic account)
  await prisma.playerStatistics.create({
    data: {
      userId: johnDoe.id,
      apiPlayerId: 1001,
      apiLeagueId: 88,
      apiTeamId: 194,
      season: 2024,
      playerName: 'John Doe',
      leagueName: 'Eredivisie',
      teamName: 'Ajax',
      gamesAppearances: 25,
      gamesMinutes: 2100,
      goalsTotal: 8,
      goalsAssists: 12,
      cardsYellow: 3,
      cardsRed: 0,
      gamesRating: 7.2,
      gamesPosition: 'Midfielder',
      // Premium stats (will be filtered for Basic users)
      passesTotal: 1250,
      passesAccuracy: 87,
      tacklesTotal: 65,
      tacklesInterceptions: 23,
      duelsWon: 145
    }
  });

  // Premium stats for Desley Ubbink (Premium account)
  await prisma.playerStatistics.create({
    data: {
      userId: desleyUbbink.id,
      apiPlayerId: 1002,
      apiLeagueId: 88,
      apiTeamId: 202,
      season: 2024,
      playerName: 'Desley Ubbink',
      leagueName: 'Eredivisie',
      teamName: 'PSV',
      gamesAppearances: 28,
      gamesMinutes: 2450,
      goalsTotal: 15,
      goalsAssists: 8,
      cardsYellow: 2,
      cardsRed: 1,
      gamesRating: 8.1,
      gamesPosition: 'Forward',
      // Premium stats
      passesTotal: 890,
      passesAccuracy: 82,
      tacklesTotal: 25,
      tacklesInterceptions: 8,
      duelsWon: 167
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`👤 John Doe (Basic): ${johnDoe.id}`);
  console.log(`👤 Desley Ubbink (Premium): ${desleyUbbink.id}`);
  console.log(`👤 Scout (Basic): ${scout.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });