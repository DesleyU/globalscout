const paypalService = require('../services/paypalService');
const SubscriptionService = require('../services/subscriptionService');
const prisma = require('../config/database');



// PayPal payment functions
const createPayPalOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 9.99 } = req.body;

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
      select: { email: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create PayPal order
    const orderResult = await paypalService.createOrder({
      userId,
      email: user.email,
      amount: amount.toString()
    });

    if (orderResult.success) {
      res.json({
        success: true,
        orderId: orderResult.orderId,
        approvalUrl: orderResult.approvalUrl
      });
    } else {
      res.status(500).json({ error: 'Failed to create PayPal order' });
    }
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const capturePayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Capture the PayPal order
    const captureResult = await paypalService.captureOrder(orderId);

    if (captureResult.success && captureResult.status === 'COMPLETED') {
      // Activate premium subscription
      await SubscriptionService.activatePremiumSubscription(
        parseInt(captureResult.userId),
        'PAYPAL',
        captureResult.captureId
      );

      res.json({
        success: true,
        message: 'Payment successful! Premium access activated.',
        captureId: captureResult.captureId
      });
    } else {
      res.status(400).json({ 
        error: 'Payment capture failed',
        details: captureResult
      });
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPayPalOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const orderDetails = await paypalService.getOrderDetails(orderId);

    if (orderDetails.success) {
      res.json({
        success: true,
        order: orderDetails.order
      });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('PayPal order details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const handlePayPalWebhook = async (req, res) => {
  try {
    const headers = req.headers;
    const body = req.body;

    // Verify webhook signature
    const isValid = await paypalService.verifyWebhookSignature(headers, body);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    // Handle the webhook event
    const result = await paypalService.handleWebhookEvent(body);

    if (result.success) {
      res.json({ success: true, message: 'Webhook processed' });
    } else {
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // PayPal functions
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderDetails,
  handlePayPalWebhook
};