const Stripe = require('stripe');
const prisma = require('../config/database');

class StripeService {
  constructor() {
    // Check if we're in mock mode (when Stripe keys are placeholders)
    this.isMockMode = process.env.STRIPE_SECRET_KEY?.includes('your-test') || 
                      !process.env.STRIPE_SECRET_KEY ||
                      process.env.NODE_ENV === 'test';
    
    if (!this.isMockMode) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  // Create a customer in Stripe
  async createCustomer(email, name, metadata = {}) {
    try {
      if (this.isMockMode) {
        // Mock customer for development
        return {
          id: `cus_mock_${Date.now()}`,
          email,
          name,
          metadata,
          created: Math.floor(Date.now() / 1000)
        };
      }
      
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata
      });
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  // Create a payment intent for one-time payment
  async createPaymentIntent(amount, currency = 'eur', customerId, metadata = {}) {
    try {
      if (this.isMockMode) {
        // Mock payment intent for development
        return {
          id: `pi_mock_${Date.now()}`,
          client_secret: `pi_mock_${Date.now()}_secret_mock`,
          amount: Math.round(amount * 100),
          currency,
          customer: customerId,
          metadata,
          status: 'requires_payment_method',
          created: Math.floor(Date.now() / 1000)
        };
      }
      
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Stripe create payment intent error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  // Create a subscription
  async createSubscription(customerId, priceId, metadata = {}) {
    try {
      if (this.isMockMode) {
        // Mock subscription for development
        return {
          id: `sub_mock_${Date.now()}`,
          customer: customerId,
          status: 'active',
          metadata,
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
          latest_invoice: {
            payment_intent: {
              id: `pi_mock_${Date.now()}`,
              client_secret: `pi_mock_${Date.now()}_secret_mock`,
              status: 'succeeded'
            }
          }
        };
      }
      
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent) {
    try {
      const userId = paymentIntent.metadata.userId;
      if (!userId) return;

      // Update user account type to premium
      await prisma.user.update({
        where: { id: userId },
        data: { accountType: 'PREMIUM' }
      });

      console.log(`Payment succeeded for user ${userId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle failed payment
  async handlePaymentFailed(paymentIntent) {
    try {
      const userId = paymentIntent.metadata.userId;
      console.log(`Payment failed for user ${userId}`);
      // Could send notification email here
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Handle subscription created
  async handleSubscriptionCreated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Create subscription record in database
      await prisma.subscription.create({
        data: {
          userId,
          tier: 'PREMIUM',
          status: subscription.status.toUpperCase(),
          stripeCustomerId: subscription.customer,
          stripeSubscriptionId: subscription.id,
          paymentId: subscription.latest_invoice
        }
      });

      // Update user account type
      await prisma.user.update({
        where: { id: userId },
        data: { accountType: 'PREMIUM' }
      });

      console.log(`Subscription created for user ${userId}`);
    } catch (error) {
      console.error('Error handling subscription creation:', error);
    }
  }

  // Handle subscription updated
  async handleSubscriptionUpdated(subscription) {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Update subscription record
      await prisma.subscription.updateMany({
        where: { 
          userId,
          stripeSubscriptionId: subscription.id 
        },
        data: {
          status: subscription.status.toUpperCase()
        }
      });

      // Update user account type based on subscription status
      const accountType = subscription.status === 'active' ? 'PREMIUM' : 'BASIC';
      await prisma.user.update({
        where: { id: userId },
        data: { accountType }
      });

      console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
    } catch (error) {
      console.error('Error handling subscription update:', error);
    }
  }

  // Handle subscription canceled
  async handleSubscriptionCanceled(subscription) {
    try {
      const userId = subscription.metadata.userId;
      if (!userId) return;

      // Update subscription record
      await prisma.subscription.updateMany({
        where: { 
          userId,
          stripeSubscriptionId: subscription.id 
        },
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

      console.log(`Subscription canceled for user ${userId}`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
    }
  }

  // Handle successful invoice payment
  async handleInvoicePaymentSucceeded(invoice) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.userId;
      
      if (!userId) return;

      // Ensure user has premium access
      await prisma.user.update({
        where: { id: userId },
        data: { accountType: 'PREMIUM' }
      });

      console.log(`Invoice payment succeeded for user ${userId}`);
    } catch (error) {
      console.error('Error handling invoice payment success:', error);
    }
  }

  // Handle failed invoice payment
  async handleInvoicePaymentFailed(invoice) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.userId;
      
      console.log(`Invoice payment failed for user ${userId}`);
      // Could implement retry logic or send notification
    } catch (error) {
      console.error('Error handling invoice payment failure:', error);
    }
  }

  // Get or create customer for user
  async getOrCreateCustomer(userId, email, name) {
    try {
      // Check if user already has a Stripe customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true }
      });

      if (user?.stripeCustomerId) {
        // Return existing customer
        return await this.stripe.customers.retrieve(user.stripeCustomerId);
      }

      // Create new customer
      const customer = await this.createCustomer(email, name, { userId });
      
      // Save customer ID to user record
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      return customer;
    } catch (error) {
      console.error('Error getting or creating customer:', error);
      throw error;
    }
  }
}

module.exports = new StripeService();