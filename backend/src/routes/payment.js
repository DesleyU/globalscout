const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { validateInput } = require('../middleware/security');
const {
  // PayPal functions
  createPayPalOrder,
  capturePayPalOrder,
  getPayPalOrderDetails,
  handlePayPalWebhook
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
 *           description: Client secret for payment
 *         customerId:
 *           type: string
 *           description: Customer ID
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
 * /api/payment/paypal/create-order:
 *   post:
 *     summary: Create PayPal order for premium subscription
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
 *     responses:
 *       200:
 *         description: PayPal order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orderId:
 *                   type: string
 *                 approvalUrl:
 *                   type: string
 *       400:
 *         description: User already has premium access
 *       401:
 *         description: Unauthorized
 */
router.post('/paypal/create-order', authenticateToken, validateInput, createPayPalOrder);

/**
 * @swagger
 * /api/payment/paypal/capture-order:
 *   post:
 *     summary: Capture PayPal order after approval
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
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 captureId:
 *                   type: string
 *       400:
 *         description: Payment capture failed
 *       401:
 *         description: Unauthorized
 */
router.post('/paypal/capture-order', authenticateToken, validateInput, capturePayPalOrder);

/**
 * @swagger
 * /api/payment/paypal/order/{orderId}:
 *   get:
 *     summary: Get PayPal order details
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 */
router.get('/paypal/order/:orderId', authenticateToken, getPayPalOrderDetails);

/**
 * @swagger
 * /api/payment/paypal/webhook:
 *   post:
 *     summary: Handle PayPal webhook events
 *     tags: [Payment]
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
 *         description: Invalid webhook signature
 */
router.post('/paypal/webhook', express.raw({ type: 'application/json' }), handlePayPalWebhook);

module.exports = router;