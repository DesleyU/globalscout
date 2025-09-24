const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const {
  createPaymentIntent,
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  handleWebhook,
  getPaymentConfig
} = require('../controllers/paymentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentIntent:
 *       type: object
 *       properties:
 *         clientSecret:
 *           type: string
 *           description: Stripe client secret for payment
 *         customerId:
 *           type: string
 *           description: Stripe customer ID
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         tier:
 *           type: string
 *           enum: [BASIC, PREMIUM]
 *         status:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payment/config:
 *   get:
 *     summary: Get payment configuration
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     publishableKey:
 *                       type: string
 *                     prices:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/config', authenticateToken, getPaymentConfig);

/**
 * @swagger
 * /api/payment/create-intent:
 *   post:
 *     summary: Create payment intent for one-time payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 default: 9.99
 *               currency:
 *                 type: string
 *                 default: eur
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentIntent'
 *       400:
 *         description: User already has premium access
 *       401:
 *         description: Unauthorized
 */
router.post('/create-intent', authenticateToken, validateInput, createPaymentIntent);

/**
 * @swagger
 * /api/payment/create-subscription:
 *   post:
 *     summary: Create subscription for recurring payments
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priceId
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: Stripe price ID for the subscription
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptionId:
 *                       type: string
 *                     clientSecret:
 *                       type: string
 *                     customerId:
 *                       type: string
 *       400:
 *         description: Invalid request or user already has premium access
 *       401:
 *         description: Unauthorized
 */
router.post('/create-subscription', authenticateToken, validateInput, createSubscription);

/**
 * @swagger
 * /api/payment/cancel-subscription:
 *   post:
 *     summary: Cancel active subscription
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptionId:
 *                       type: string
 *                     status:
 *                       type: string
 *       404:
 *         description: No active subscription found
 *       401:
 *         description: Unauthorized
 */
router.post('/cancel-subscription', authenticateToken, cancelSubscription);

/**
 * @swagger
 * /api/payment/subscription-status:
 *   get:
 *     summary: Get current subscription status
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasSubscription:
 *                       type: boolean
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: Unauthorized
 */
router.get('/subscription-status', authenticateToken, getSubscriptionStatus);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Payment]
 *     description: Endpoint for Stripe to send webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid webhook signature or processing failed
 */
// Note: Webhook endpoint should not use authentication middleware
// and should receive raw body for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;