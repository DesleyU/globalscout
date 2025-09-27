const prisma = require('../config/database');
const SubscriptionService = require('../services/subscriptionService');

// Get current user's account information
const getAccountInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        accountType: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limits = await SubscriptionService.getUserLimits(userId);

    res.json({
      success: true,
      data: {
        ...user,
        limits
      }
    });
  } catch (error) {
    console.error('Get account info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upgrade account to premium (called after successful PayPal payment)
const upgradeAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check current account type
    const currentTier = await SubscriptionService.getUserTier(userId);
    
    if (currentTier === 'PREMIUM') {
      return res.status(400).json({ 
        error: 'Account is already premium' 
      });
    }

    // Update account type to premium
    const updatedUser = await SubscriptionService.updateAccountType(userId, 'PREMIUM');
    
    res.json({
      success: true,
      message: 'Account upgraded to Premium successfully',
      data: {
        accountType: updatedUser.accountType
      }
    });
  } catch (error) {
    console.error('Upgrade account error:', error);
    res.status(500).json({ error: 'Failed to upgrade account' });
  }
};

// Downgrade account to basic (for testing purposes)
const downgradeAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check current account type
    const currentTier = await SubscriptionService.getUserTier(userId);
    
    if (currentTier === 'BASIC') {
      return res.status(400).json({ 
        error: 'Account is already basic' 
      });
    }

    // Update account type to basic
    const updatedUser = await SubscriptionService.updateAccountType(userId, 'BASIC');
    
    res.json({
      success: true,
      message: 'Account downgraded to Basic',
      data: {
        accountType: updatedUser.accountType
      }
    });
  } catch (error) {
    console.error('Downgrade account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAccountInfo,
  upgradeAccount,
  downgradeAccount
};