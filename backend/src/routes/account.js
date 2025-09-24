const express = require('express');
const router = express.Router();
const { getAccountInfo, upgradeAccount, downgradeAccount } = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/auth');

// Get current user's account information
router.get('/info', authenticateToken, getAccountInfo);

// Upgrade account to premium
router.post('/upgrade', authenticateToken, upgradeAccount);

// Downgrade account to basic (for testing)
router.post('/downgrade', authenticateToken, downgradeAccount);

module.exports = router;