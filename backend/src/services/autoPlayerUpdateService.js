const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

class AutoPlayerUpdateService {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.API_FOOTBALL_KEY;
    this.isPro = process.env.API_FOOTBALL_PRO === 'true';
    this.baseConfig = {
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'v3.football.api-sports.io'
      }
    };
    this.updateInterval = this.isPro ? 15 * 60 * 1000 : 60 * 60 * 1000; // 15 min pro, 1 hour free
  }

  /**
   * Start automatische update service
   */
  startAutoUpdates() {
    console.log(`🚀 Auto Player Update Service gestart (${this.isPro ? 'PRO' : 'FREE'} mode)`);
    console.log(`⏱️  Update interval: ${this.updateInterval / 1000 / 60} minuten`);
    
    // Start direct en dan elke interval
    this.performUpdates();
    setInterval(() => {
      this.performUpdates();
    }, this.updateInterval);
  }

  /**
   * Voer updates uit voor alle gevolgde spelers
   */
  async performUpdates() {
    try {
      console.log('🔄 Starting automatic player updates...');
      
      // Haal alle users op die spelers volgen
      const usersWithPlayers = await this.getUsersWithTrackedPlayers();
      
      if (usersWithPlayers.length === 0) {
        console.log('ℹ️  Geen spelers om te updaten');
        return;
      }

      console.log(`👥 ${usersWithPlayers.length} users met gevolgde spelers gevonden`);

      // Update elke gevolgde speler
      for (const user of usersWithPlayers) {
        await this.updateUserPlayers(user);
      }

      console.log('✅ Automatische updates voltooid');
      
    } catch (error) {
      console.error('❌ Fout bij automatische updates:', error.message);
    }
  }

  /**
   * Haal users op die spelers volgen
   */
  async getUsersWithTrackedPlayers() {
    try {
      // Voor nu simuleren we dit - in een echte implementatie zou je
      // een "followed_players" tabel hebben in de database
      const users = await this.prisma.user.findMany({
        where: {
          // Alleen users met premium accounts voor pro features
          accountType: this.isPro ? undefined : 'premium'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      // Simuleer gevolgde spelers per user
      return users.map(user => ({
        ...user,
        followedPlayers: this.getSimulatedFollowedPlayers(user.id)
      }));

    } catch (error) {
      console.error('❌ Fout bij ophalen users:', error.message);
      return [];
    }
  }

  /**
   * Simuleer gevolgde spelers (in echte implementatie uit database)
   */
  getSimulatedFollowedPlayers(userId) {
    const allPlayers = [
      { name: 'Erling Haaland', team: 'Manchester City', apiId: 1100 },
      { name: 'Kylian Mbappe', team: 'Real Madrid', apiId: 1101 },
      { name: 'Jude Bellingham', team: 'Real Madrid', apiId: 1102 },
      { name: 'Bukayo Saka', team: 'Arsenal', apiId: 1103 },
      { name: 'Frenkie de Jong', team: 'FC Barcelona', apiId: 1104 }
    ];

    // Elke user volgt 2-3 random spelers
    const count = Math.floor(Math.random() * 2) + 2;
    return allPlayers.slice(0, count);
  }

  /**
   * Update spelers voor een specifieke user
   */
  async updateUserPlayers(user) {
    console.log(`👤 Updating spelers voor ${user.firstName} ${user.lastName}...`);

    for (const player of user.followedPlayers) {
      try {
        await this.updateSinglePlayer(user.id, player);
      } catch (error) {
        console.error(`❌ Fout bij updaten ${player.name}:`, error.message);
      }
    }
  }

  /**
   * Update een enkele speler
   */
  async updateSinglePlayer(userId, player) {
    try {
      let playerStats;

      if (this.isPro) {
        // Met Pro plan: echte API call
        playerStats = await this.fetchRealPlayerStats(player);
      } else {
        // Zonder Pro plan: simuleer updates met bestaande data
        playerStats = await this.simulatePlayerStats(player);
      }

      // Update database met nieuwe stats
      await this.updatePlayerInDatabase(userId, player, playerStats);

      // Check voor nieuwe prestaties
      await this.checkForNewAchievements(userId, player, playerStats);

      console.log(`✅ ${player.name} bijgewerkt`);

    } catch (error) {
      console.error(`❌ Fout bij updaten ${player.name}:`, error.message);
    }
  }

  /**
   * Haal echte speler statistieken op (Pro plan)
   */
  async fetchRealPlayerStats(player) {
    try {
      const response = await axios.get('https://v3.football.api-sports.io/players', {
        ...this.baseConfig,
        params: { 
          search: player.name, 
          season: 2024,
          league: 39 // Premier League als voorbeeld
        }
      });

      if (response.data.response && response.data.response.length > 0) {
        const playerData = response.data.response[0];
        const stats = playerData.statistics[0];

        return {
          goals: stats.goals.total || 0,
          assists: stats.goals.assists || 0,
          appearances: stats.games.appearences || 0,
          minutes: stats.games.minutes || 0,
          rating: stats.games.rating ? parseFloat(stats.games.rating) : 0,
          lastUpdated: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error(`API fout voor ${player.name}:`, error.message);
      return null;
    }
  }

  /**
   * Simuleer speler statistieken (Free plan)
   */
  async simulatePlayerStats(player) {
    // Simuleer kleine incrementele updates
    const baseStats = {
      goals: Math.floor(Math.random() * 25) + 5,
      assists: Math.floor(Math.random() * 15) + 2,
      appearances: Math.floor(Math.random() * 20) + 10,
      minutes: Math.floor(Math.random() * 1500) + 800,
      rating: parseFloat((Math.random() * 2 + 7).toFixed(1)),
      lastUpdated: new Date()
    };

    // Kleine kans op goal/assist update
    if (Math.random() < 0.1) { // 10% kans
      baseStats.goals += 1;
      console.log(`⚽ ${player.name} heeft gescoord! Nieuw totaal: ${baseStats.goals}`);
    }

    if (Math.random() < 0.05) { // 5% kans
      baseStats.assists += 1;
      console.log(`🎯 ${player.name} heeft geassisteerd! Nieuw totaal: ${baseStats.assists}`);
    }

    return baseStats;
  }

  /**
   * Update speler in database
   */
  async updatePlayerInDatabase(userId, player, stats) {
    if (!stats) return;

    try {
      // In een echte implementatie zou je een player_stats tabel hebben
      // Voor nu loggen we alleen wat er zou gebeuren
      console.log(`💾 Database update voor ${player.name}:`);
      console.log(`   Goals: ${stats.goals}, Assists: ${stats.assists}`);
      console.log(`   Rating: ${stats.rating}, Wedstrijden: ${stats.appearances}`);

      // Hier zou je de echte database update doen:
      /*
      await this.prisma.playerStats.upsert({
        where: {
          userId_playerId: {
            userId: userId,
            playerId: player.apiId
          }
        },
        update: {
          goals: stats.goals,
          assists: stats.assists,
          appearances: stats.appearances,
          minutes: stats.minutes,
          rating: stats.rating,
          lastUpdated: stats.lastUpdated
        },
        create: {
          userId: userId,
          playerId: player.apiId,
          playerName: player.name,
          goals: stats.goals,
          assists: stats.assists,
          appearances: stats.appearances,
          minutes: stats.minutes,
          rating: stats.rating,
          lastUpdated: stats.lastUpdated
        }
      });
      */

    } catch (error) {
      console.error(`Database fout voor ${player.name}:`, error.message);
    }
  }

  /**
   * Check voor nieuwe prestaties
   */
  async checkForNewAchievements(userId, player, stats) {
    if (!stats) return;

    const achievements = [];

    // Check verschillende prestatie thresholds
    if (stats.goals >= 10 && stats.goals % 5 === 0) {
      achievements.push({
        type: 'goals_milestone',
        title: `${stats.goals} Goals Club`,
        description: `${player.name} heeft ${stats.goals} goals gescoord dit seizoen!`
      });
    }

    if (stats.assists >= 10 && stats.assists % 5 === 0) {
      achievements.push({
        type: 'assists_milestone',
        title: `${stats.assists} Assists Master`,
        description: `${player.name} heeft ${stats.assists} assists gegeven dit seizoen!`
      });
    }

    if (stats.rating >= 8.5) {
      achievements.push({
        type: 'high_rating',
        title: 'Top Performer',
        description: `${player.name} heeft een uitstekende rating van ${stats.rating}!`
      });
    }

    // Log nieuwe prestaties
    for (const achievement of achievements) {
      console.log(`🏆 Nieuwe prestatie voor user ${userId}: ${achievement.title}`);
      
      // Hier zou je een notificatie kunnen sturen
      await this.sendAchievementNotification(userId, player, achievement);
    }
  }

  /**
   * Stuur prestatie notificatie
   */
  async sendAchievementNotification(userId, player, achievement) {
    // In een echte implementatie zou je hier push notifications, 
    // emails, of in-app notifications sturen
    console.log(`📱 Notificatie naar user ${userId}:`);
    console.log(`   🏆 ${achievement.title}`);
    console.log(`   📝 ${achievement.description}`);
  }

  /**
   * Stop de service
   */
  stop() {
    console.log('🛑 Auto Player Update Service gestopt');
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }

  /**
   * Handmatige update voor een specifieke user
   */
  async manualUpdateForUser(userId) {
    try {
      console.log(`🔄 Handmatige update voor user ${userId}...`);
      
      const user = await this.prisma.user.findUnique({
        where: { id: String(userId) }
      });

      if (!user) {
        throw new Error('User niet gevonden');
      }

      const userWithPlayers = {
        ...user,
        followedPlayers: this.getSimulatedFollowedPlayers(userId)
      };

      await this.updateUserPlayers(userWithPlayers);
      
      console.log(`✅ Handmatige update voltooid voor ${user.firstName} ${user.lastName}`);
      
    } catch (error) {
      console.error('❌ Fout bij handmatige update:', error.message);
      throw error;
    }
  }
}

module.exports = AutoPlayerUpdateService;