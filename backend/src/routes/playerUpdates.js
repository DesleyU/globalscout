const express = require('express');
const router = express.Router();
const AutoPlayerUpdateService = require('../services/autoPlayerUpdateService');

// Initialize service
const updateService = new AutoPlayerUpdateService();

/**
 * @route GET /api/player-updates/status
 * @desc Get status van de auto update service
 * @access Public
 */
router.get('/status', async (req, res) => {
  try {
    const status = {
      serviceActive: true,
      isPro: process.env.API_FOOTBALL_PRO === 'true',
      updateInterval: updateService.updateInterval / 1000 / 60, // in minuten
      lastUpdate: new Date().toISOString(),
      features: {
        realTimeUpdates: process.env.API_FOOTBALL_PRO === 'true',
        achievements: true,
        notifications: true,
        manualUpdates: true
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij ophalen service status',
      error: error.message
    });
  }
});

/**
 * @route POST /api/player-updates/start
 * @desc Start de automatische update service
 * @access Private (Admin only)
 */
router.post('/start', async (req, res) => {
  try {
    updateService.startAutoUpdates();
    
    res.json({
      success: true,
      message: 'Automatische player updates gestart',
      data: {
        interval: updateService.updateInterval / 1000 / 60,
        isPro: process.env.API_FOOTBALL_PRO === 'true'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij starten service',
      error: error.message
    });
  }
});

/**
 * @route POST /api/player-updates/stop
 * @desc Stop de automatische update service
 * @access Private (Admin only)
 */
router.post('/stop', async (req, res) => {
  try {
    updateService.stop();
    
    res.json({
      success: true,
      message: 'Automatische player updates gestopt'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij stoppen service',
      error: error.message
    });
  }
});

/**
 * @route POST /api/player-updates/manual/:userId
 * @desc Handmatige update voor een specifieke user
 * @access Private
 */
router.post('/manual/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is verplicht'
      });
    }

    await updateService.manualUpdateForUser(parseInt(userId));
    
    res.json({
      success: true,
      message: `Handmatige update voltooid voor user ${userId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij handmatige update',
      error: error.message
    });
  }
});

/**
 * @route GET /api/player-updates/demo
 * @desc Demo van automatische updates (voor testing)
 * @access Public
 */
router.get('/demo', async (req, res) => {
  try {
    console.log('🎬 Starting demo van automatische player updates...');
    
    // Simuleer een update cyclus
    await updateService.performUpdates();
    
    res.json({
      success: true,
      message: 'Demo update cyclus voltooid',
      data: {
        timestamp: new Date().toISOString(),
        features: {
          automaticUpdates: 'Speler statistieken worden automatisch bijgewerkt',
          achievements: 'Prestaties worden gedetecteerd en gemeld',
          notifications: 'Users krijgen meldingen van nieuwe prestaties',
          realTimeData: process.env.API_FOOTBALL_PRO === 'true' ? 
            'Live data van API-Football (Pro plan)' : 
            'Gesimuleerde data (Free plan)',
          updateFrequency: `Updates elke ${updateService.updateInterval / 1000 / 60} minuten`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij demo',
      error: error.message
    });
  }
});

/**
 * @route GET /api/player-updates/features
 * @desc Overzicht van beschikbare features
 * @access Public
 */
router.get('/features', async (req, res) => {
  try {
    const isPro = process.env.API_FOOTBALL_PRO === 'true';
    
    const features = {
      automaticUpdates: {
        available: true,
        description: 'Automatische updates van speler statistieken',
        frequency: isPro ? 'Elke 15 minuten' : 'Elk uur',
        proOnly: false
      },
      realTimeData: {
        available: isPro,
        description: 'Live statistieken van API-Football',
        frequency: 'Real-time tijdens wedstrijden',
        proOnly: true
      },
      achievements: {
        available: true,
        description: 'Automatische detectie van prestaties',
        frequency: 'Bij elke update',
        proOnly: false
      },
      notifications: {
        available: true,
        description: 'Push notifications voor nieuwe prestaties',
        frequency: 'Instant',
        proOnly: false
      },
      playerSearch: {
        available: isPro,
        description: 'Zoeken naar alle spelers wereldwijd',
        frequency: 'On-demand',
        proOnly: true
      },
      teamStats: {
        available: isPro,
        description: 'Uitgebreide team statistieken',
        frequency: 'Daily updates',
        proOnly: true
      },
      predictions: {
        available: isPro,
        description: 'AI-powered prestatie voorspellingen',
        frequency: 'Weekly',
        proOnly: true
      },
      historicalData: {
        available: isPro,
        description: 'Toegang tot alle seizoenen',
        frequency: 'On-demand',
        proOnly: true
      }
    };

    res.json({
      success: true,
      data: {
        currentPlan: isPro ? 'Pro' : 'Free',
        features: features,
        upgrade: !isPro ? {
          message: 'Upgrade naar Pro voor volledige functionaliteit',
          benefits: [
            'Real-time live statistieken',
            'Alle spelers wereldwijd zoeken',
            'Uitgebreide team analyses',
            'AI prestatie voorspellingen',
            'Toegang tot alle seizoenen',
            '150.000 API calls per dag'
          ],
          price: '$39/maand'
        } : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fout bij ophalen features',
      error: error.message
    });
  }
});

module.exports = router;