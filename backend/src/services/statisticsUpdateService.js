const { PrismaClient } = require('@prisma/client');
const apiFootballService = require('./apiFootballService');

const prisma = new PrismaClient();

class StatisticsUpdateService {
  constructor() {
    this.isUpdating = false;
    this.lastUpdate = null;
    this.updateQueue = new Set();
  }

  /**
   * Update statistics for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Update result
   */
  async updateUserStatistics(userId) {
    if (this.updateQueue.has(userId)) {
      return {
        success: false,
        message: 'Update already in progress for this user'
      };
    }

    this.updateQueue.add(userId);

    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          playerId: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (!user.playerId) {
        throw new Error('User does not have a linked player ID');
      }

      // Get current season (using 2023 as most recent season with data)
      const currentSeason = 2023;
      
      // Fetch player statistics from API-Football
      const apiResponse = await apiFootballService.getPlayerStatistics(
        user.playerId, 
        currentSeason
      );

      if (!apiResponse.response || apiResponse.response.length === 0) {
        throw new Error('No statistics found for this player');
      }

      const playerData = apiResponse.response[0];
      const statistics = playerData.statistics;

      // Process and save statistics for each league/team
      const savedStats = [];
      
      for (const stat of statistics) {
        const playerStat = await this.savePlayerStatistics(
          user.id,
          user.playerId,
          playerData.player,
          stat,
          currentSeason
        );
        savedStats.push(playerStat);
      }

      this.lastUpdate = new Date();

      return {
        success: true,
        message: 'Statistics updated successfully',
        data: {
          player: playerData.player,
          statisticsCount: savedStats.length,
          lastUpdate: this.lastUpdate
        }
      };

    } catch (error) {
      console.error('Error updating user statistics:', error);
      return {
        success: false,
        message: error.message || 'Failed to update statistics'
      };
    } finally {
      this.updateQueue.delete(userId);
    }
  }

  /**
   * Save player statistics to database
   * @param {string} userId - User ID
   * @param {number} apiPlayerId - API-Football player ID
   * @param {Object} playerInfo - Player information from API
   * @param {Object} statistics - Statistics data from API
   * @param {number} season - Season year
   * @returns {Promise<Object>} Saved statistics record
   */
  async savePlayerStatistics(userId, apiPlayerId, playerInfo, statistics, season) {
    const league = statistics.league;
    const team = statistics.team;
    const games = statistics.games;
    const goals = statistics.goals;
    const passes = statistics.passes;
    const tackles = statistics.tackles;
    const duels = statistics.duels;
    const dribbles = statistics.dribbles;
    const fouls = statistics.fouls;
    const cards = statistics.cards;
    const penalty = statistics.penalty;

    return await prisma.playerStatistics.upsert({
      where: {
        userId_apiPlayerId_apiLeagueId_apiTeamId_season: {
          userId: userId,
          apiPlayerId: apiPlayerId,
          apiLeagueId: league.id,
          apiTeamId: team.id,
          season: season
        }
      },
      update: {
        // Player info
        playerName: playerInfo.name,
        playerAge: playerInfo.age,
        playerNationality: playerInfo.nationality,
        playerHeight: playerInfo.height,
        playerWeight: playerInfo.weight,
        playerPhoto: playerInfo.photo,
        
        // League and team info
        leagueName: league.name,
        leagueCountry: league.country,
        leagueLogo: league.logo,
        teamName: team.name,
        teamLogo: team.logo,
        
        // Game statistics
        gamesAppearances: games?.appearences || 0,
        gamesLineups: games?.lineups || 0,
        gamesMinutes: games?.minutes || 0,
        gamesPosition: games?.position || null,
        gamesRating: games?.rating ? parseFloat(games.rating) : null,
        gamesCaptain: games?.captain || false,
        
        // Goal statistics
        goalsTotal: goals?.total || 0,
        goalsConceded: goals?.conceded || 0,
        goalsAssists: goals?.assists || 0,
        goalsSaves: goals?.saves || 0,
        
        // Pass statistics
        passesTotal: passes?.total || 0,
        passesKey: passes?.key || 0,
        passesAccuracy: passes?.accuracy || 0,
        
        // Tackle statistics
        tacklesTotal: tackles?.total || 0,
        tacklesBlocks: tackles?.blocks || 0,
        tacklesInterceptions: tackles?.interceptions || 0,
        
        // Duel statistics
        duelsTotal: duels?.total || 0,
        duelsWon: duels?.won || 0,
        
        // Dribble statistics
        dribblesAttempts: dribbles?.attempts || 0,
        dribblesSuccess: dribbles?.success || 0,
        dribblesPast: dribbles?.past || 0,
        
        // Foul statistics
        foulsDrawn: fouls?.drawn || 0,
        foulsCommitted: fouls?.committed || 0,
        
        // Card statistics
        cardsYellow: cards?.yellow || 0,
        cardsRed: cards?.red || 0,
        
        // Penalty statistics
        penaltyWon: penalty?.won || 0,
        penaltyCommitted: penalty?.commited || 0,
        penaltyScored: penalty?.scored || 0,
        penaltyMissed: penalty?.missed || 0,
        penaltySaved: penalty?.saved || 0,
        
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        apiPlayerId: apiPlayerId,
        apiLeagueId: league.id,
        apiTeamId: team.id,
        season: season,
        
        // Player info
        playerName: playerInfo.name,
        playerAge: playerInfo.age,
        playerNationality: playerInfo.nationality,
        playerHeight: playerInfo.height,
        playerWeight: playerInfo.weight,
        playerPhoto: playerInfo.photo,
        
        // League and team info
        leagueName: league.name,
        leagueCountry: league.country,
        leagueLogo: league.logo,
        teamName: team.name,
        teamLogo: team.logo,
        
        // Game statistics
        gamesAppearances: games?.appearences || 0,
        gamesLineups: games?.lineups || 0,
        gamesMinutes: games?.minutes || 0,
        gamesPosition: games?.position || null,
        gamesRating: games?.rating ? parseFloat(games.rating) : null,
        gamesCaptain: games?.captain || false,
        
        // Goal statistics
        goalsTotal: goals?.total || 0,
        goalsConceded: goals?.conceded || 0,
        goalsAssists: goals?.assists || 0,
        goalsSaves: goals?.saves || 0,
        
        // Pass statistics
        passesTotal: passes?.total || 0,
        passesKey: passes?.key || 0,
        passesAccuracy: passes?.accuracy || 0,
        
        // Tackle statistics
        tacklesTotal: tackles?.total || 0,
        tacklesBlocks: tackles?.blocks || 0,
        tacklesInterceptions: tackles?.interceptions || 0,
        
        // Duel statistics
        duelsTotal: duels?.total || 0,
        duelsWon: duels?.won || 0,
        
        // Dribble statistics
        dribblesAttempts: dribbles?.attempts || 0,
        dribblesSuccess: dribbles?.success || 0,
        dribblesPast: dribbles?.past || 0,
        
        // Foul statistics
        foulsDrawn: fouls?.drawn || 0,
        foulsCommitted: fouls?.committed || 0,
        
        // Card statistics
        cardsYellow: cards?.yellow || 0,
        cardsRed: cards?.red || 0,
        
        // Penalty statistics
        penaltyWon: penalty?.won || 0,
        penaltyCommitted: penalty?.commited || 0,
        penaltyScored: penalty?.scored || 0,
        penaltyMissed: penalty?.missed || 0,
        penaltySaved: penalty?.saved || 0
      }
    });
  }

  /**
   * Force update all user statistics
   * @returns {Promise<Object>} Update result
   */
  async forceUpdateAll() {
    if (this.isUpdating) {
      return {
        success: false,
        message: 'Bulk update already in progress'
      };
    }

    this.isUpdating = true;

    try {
      // Get all users with player IDs
      const users = await prisma.user.findMany({
        where: {
          playerId: {
            not: null
          }
        },
        select: {
          id: true,
          playerId: true,
          email: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const result = await this.updateUserStatistics(user.id);
          results.push({
            userId: user.id,
            userName: user.profile?.firstName && user.profile?.lastName 
              ? `${user.profile.firstName} ${user.profile.lastName}` 
              : user.email,
            ...result
          });
          
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          errorCount++;
          results.push({
            userId: user.id,
            userName: user.profile?.firstName && user.profile?.lastName 
              ? `${user.profile.firstName} ${user.profile.lastName}` 
              : user.email,
            success: false,
            message: error.message
          });
        }
      }

      this.lastUpdate = new Date();

      return {
        success: true,
        message: `Bulk update completed. ${successCount} successful, ${errorCount} failed.`,
        data: {
          totalUsers: users.length,
          successCount,
          errorCount,
          results,
          lastUpdate: this.lastUpdate
        }
      };

    } catch (error) {
      console.error('Error in force update all:', error);
      return {
        success: false,
        message: error.message || 'Failed to update all statistics'
      };
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get current update status
   * @returns {Object} Current status information
   */
  getUpdateStatus() {
    return {
      isUpdating: this.isUpdating,
      lastUpdate: this.lastUpdate,
      queueSize: this.updateQueue.size,
      usersInQueue: Array.from(this.updateQueue)
    };
  }

  /**
   * Clear update queue (emergency function)
   */
  clearQueue() {
    this.updateQueue.clear();
    this.isUpdating = false;
  }
}

module.exports = new StatisticsUpdateService();