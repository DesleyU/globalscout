const prisma = require('../config/database');
const SubscriptionService = require('../services/subscriptionService');

// Get user statistics with tier-based limitations
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    
    // Get the target user's subscription tier
    const userTier = await SubscriptionService.getUserTier(userId);
    const limits = await SubscriptionService.getUserLimits(userId);

    // Get player statistics from database
    const playerStats = await prisma.playerStatistics.findMany({
      where: { userId: userId },
      orderBy: { season: 'desc' }
    });

    // Map database field names to frontend expected field names
    const mappedStats = playerStats.map(stat => ({
      ...stat,
      // Use correct database field names from the actual schema
      goals: stat.goalsTotal || 0,
      assists: stat.goalsAssists || 0,
      minutes: stat.gamesMinutes || 0,
      appearances: stat.gamesAppearances || 0,
      yellowCards: stat.cardsYellow || 0,
      redCards: stat.cardsRed || 0,
      rating: stat.gamesRating || null,
      position: stat.gamesPosition || null,
      shotsTotal: 0, // Not available in current schema
      shotsOnTarget: 0, // Not available in current schema
      passesAccuracy: stat.passesAccuracy || 0,
      tacklesTotal: stat.tacklesTotal || 0,
      tacklesInterceptions: stat.tacklesInterceptions || 0,
      duelsWon: stat.duelsWon || 0
    }));

    // Filter fields based on account type
    let filteredStats = mappedStats;
    
    if (userTier === 'BASIC' && userId !== requesterId) {
      // For basic users viewing others, show limited fields
      filteredStats = mappedStats.map(stat => {
        const limitedStat = {};
        limits.statsFields.forEach(field => {
          if (stat[field] !== undefined) {
            limitedStat[field] = stat[field];
          }
        });
        return limitedStat;
      });
    }

    res.json({
      success: true,
      data: filteredStats,
      accountType: userTier,
      availableFields: userTier === 'BASIC' ? limits.statsFields : 'all',
      totalSeasons: mappedStats.length
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create or update player statistics (only for the user themselves)
const updateUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const statsData = req.body;

    // Get user's subscription tier to determine what stats they can update
    const userTier = await SubscriptionService.getUserTier(userId);
    const limits = await SubscriptionService.getUserLimits(userId);

    // Filter allowed fields based on subscription
    let allowedData = {};
    if (userTier === 'BASIC') {
      limits.statsFields.forEach(field => {
        if (statsData[field] !== undefined) {
          allowedData[field] = statsData[field];
        }
      });
    } else {
      allowedData = statsData;
    }

    // Validate required fields
    const requiredFields = ['season'];
    for (const field of requiredFields) {
      if (!allowedData[field]) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Create or update player statistics
    const playerStats = await prisma.playerStatistics.upsert({
      where: {
        userId_season: {
          userId: userId,
          season: allowedData.season
        }
      },
      update: {
        ...allowedData,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        ...allowedData
      }
    });

    res.json({
      message: 'Statistics updated successfully',
      stats: playerStats,
      tier: userTier
    });
  } catch (error) {
    console.error('Update user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user's own statistics
const getMyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's own statistics (no filtering needed)
    const playerStats = await prisma.playerStatistics.findMany({
      where: { userId: userId },
      orderBy: [
        { season: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Map database field names to frontend expected field names
    const mappedStats = playerStats.map(stat => ({
      ...stat,
      // Frontend expected field names (using actual schema fields)
      goals: stat.goals || 0,
      assists: stat.assists || 0,
      minutes: stat.minutes || 0,
      appearances: stat.matches || 0,
      yellowCards: stat.yellowCards || 0,
      redCards: stat.redCards || 0,
      rating: stat.rating || null,
      shotsTotal: stat.shotsTotal || 0,
      shotsOnTarget: stat.shotsOnTarget || 0,
      passesAccuracy: stat.passesAccuracy || 0,
      tacklesTotal: stat.tacklesTotal || 0,
      tacklesInterceptions: stat.tacklesInterceptions || 0,
      duelsWon: stat.duelsWon || 0
    }));

    // Get user's subscription tier for response
    const userTier = await SubscriptionService.getUserTier(userId);

    res.json({
      stats: mappedStats,
      tier: userTier,
      totalSeasons: mappedStats.length,
      message: mappedStats.length === 0 ? 'No statistics found. Add your player statistics to get started!' : undefined
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserStats,
  updateUserStats,
  getMyStats
};