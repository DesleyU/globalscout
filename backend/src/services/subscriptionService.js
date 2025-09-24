const prisma = require('../config/database');

class SubscriptionService {
  // Get user's account type
  static async getUserTier(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountType: true }
      });

      if (!user) {
        return 'BASIC';
      }

      return user.accountType;
    } catch (error) {
      console.error('Error getting user tier:', error);
      return 'BASIC'; // Default to basic on error
    }
  }

  // Check if user has premium access
  static async isPremium(userId) {
    const tier = await this.getUserTier(userId);
    return tier === 'PREMIUM';
  }

  // Update user account type
  static async updateAccountType(userId, accountType) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { accountType },
        select: { id: true, accountType: true }
      });

      return user;
    } catch (error) {
      console.error('Error updating account type:', error);
      throw error;
    }
  }

  // Get subscription limits for basic users
  static getBasicLimits() {
    return {
      maxConnections: 10,
      maxVideos: 1,
      profileFields: ['avatar', 'position', 'age', 'clubName'],
      statsFields: ['goals', 'assists', 'minutes'],
      visitorDetails: false // Only show count, not details
    };
  }

  // Get subscription limits for premium users
  static getPremiumLimits() {
    return {
      maxConnections: -1, // Unlimited
      maxVideos: -1, // Unlimited
      profileFields: 'all',
      statsFields: 'all',
      visitorDetails: true // Show detailed visitor information
    };
  }

  // Get limits based on user tier
  static async getUserLimits(userId) {
    const isPremium = await this.isPremium(userId);
    return isPremium ? this.getPremiumLimits() : this.getBasicLimits();
  }
}

module.exports = SubscriptionService;