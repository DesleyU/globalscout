const stripeService = require('../services/stripeService');
const SubscriptionService = require('../services/subscriptionService');
const prisma = require('../config/database');

// Create payment intent for premium upgrade
const createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 9.99, currency = 'eur' } = req.body;

    // Check if user is already premium
    const currentTier = await SubscriptionService.getUserTier(userId);
    if (currentTier === 'PREMIUM') {
      return res.status(400).json({ 
        error: 'User already has premium access' 
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true, 
        stripeCustomerId: true,
        profile: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    const customerName = user.profile 
      ? `${user.profile.firstName} ${user.profile.lastName}` 
      : user.email;
    
    const customer = await stripeService.getOrCreateCustomer(
      userId,
      user.email,
      customerName
    );

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      currency,
      customer.id,
      { 
        userId,
        type: 'premium_upgrade',
        email: user.email 
      }
    );

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};

// Create subscription for recurring payments
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { priceId } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Check if user is already premium
    const currentTier = await SubscriptionService.getUserTier(userId);
    if (currentTier === 'PREMIUM') {
      return res.status(400).json({ 
        error: 'User already has premium access' 
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true, 
        firstName: true, 
        lastName: true,
        stripeCustomerId: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get or create Stripe customer
    const customer = await stripeService.getOrCreateCustomer(
      userId,
      user.email,
      `${user.firstName} ${user.lastName}`
    );

    // Create subscription
    const subscription = await stripeService.createSubscription(
      customer.id,
      priceId,
      { 
        userId,
        email: user.email 
      }
    );

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customerId: customer.id
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription in Stripe
    const canceledSubscription = await stripeService.cancelSubscription(
      subscription.stripeSubscriptionId
    );

    // Update local subscription record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        endDate: new Date()
      }
    });

    // Downgrade user account
    await prisma.user.update({
      where: { id: userId },
      data: { accountType: 'BASIC' }
    });

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      data: {
        subscriptionId: canceledSubscription.id,
        status: canceledSubscription.status
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get subscription status
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's subscription from database
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          hasSubscription: false,
          accountType: 'BASIC'
        }
      });
    }

    // If there's a Stripe subscription ID, get latest status from Stripe
    let stripeSubscription = null;
    if (subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripeService.getSubscription(
          subscription.stripeSubscriptionId
        );
      } catch (error) {
        console.error('Error fetching Stripe subscription:', error);
      }
    }

    res.json({
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          tier: subscription.tier,
          status: stripeSubscription?.status || subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          stripeSubscriptionId: subscription.stripeSubscriptionId
        }
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

// Handle Stripe webhooks
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    // Process webhook with Stripe service
    const result = await stripeService.handleWebhook(req.body, signature);
    
    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};

// Get payment configuration (public keys, prices, etc.)
const getPaymentConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        prices: {
          monthly: {
            id: process.env.STRIPE_MONTHLY_PRICE_ID,
            amount: 999, // €9.99 in cents
            currency: 'eur',
            interval: 'month'
          }
        },
        oneTime: {
          amount: 999, // €9.99 in cents
          currency: 'eur'
        }
      }
    });
  } catch (error) {
    console.error('Get payment config error:', error);
    res.status(500).json({ error: 'Failed to get payment configuration' });
  }
};

module.exports = {
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  handleWebhook,
  getPaymentConfig
};