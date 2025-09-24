const express = require('express');
const router = express.Router();
const { 
  getUserStats,
  updateUserStats,
  getMyStats
} = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');
const StatisticsUpdateService = require('../services/statisticsUpdateService');

/**
 * @swagger
 * /api/stats/me:
 *   get:
 *     summary: Get current user's statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, getMyStats);

/**
 * @swagger
 * /api/stats/me:
 *   put:
 *     summary: Update current user's statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: string
 *                 example: "2023-24"
 *               goals:
 *                 type: integer
 *               assists:
 *                 type: integer
 *               minutes:
 *                 type: integer
 *               appearances:
 *                 type: integer
 *               yellowCards:
 *                 type: integer
 *               redCards:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Statistics updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.put('/me', authenticateToken, updateUserStats);

/**
 * @swagger
 * /api/stats/user/{userId}:
 *   get:
 *     summary: Get user statistics by ID (limited for basic users)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', authenticateToken, getUserStats);

/**
 * @swagger
 * /api/stats/refresh:
 *   post:
 *     summary: Manually refresh current user's statistics
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics refreshed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await StatisticsUpdateService.updateUserStatistics(userId);
    
    res.json({
      success: true,
      message: 'Statistics refreshed successfully',
      data: result
    });
  } catch (error) {
    console.error('Manual stats refresh error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/stats/refresh/all:
 *   post:
 *     summary: Force refresh all statistics (admin only)
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All statistics refreshed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.post('/refresh/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add proper admin middleware)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const result = await StatisticsUpdateService.forceUpdateAll();
    
    res.json({
      success: true,
      message: 'All statistics refresh initiated successfully',
      data: result
    });
  } catch (error) {
    console.error('Force refresh all stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh all statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/stats/update-status:
 *   get:
 *     summary: Get statistics update status
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Update status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/update-status', authenticateToken, async (req, res) => {
  try {
    const status = await StatisticsUpdateService.getUpdateStatus();
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Get update status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get update status',
      error: error.message
    });
  }
});

module.exports = router;