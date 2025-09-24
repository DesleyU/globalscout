const express = require('express');
const router = express.Router();
const { 
  sendConnectionRequest, 
  respondToConnection, 
  getConnections, 
  getPendingRequests 
} = require('../controllers/connectionController');
const { validate, connectionSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Connection:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED]
 *         message:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/connections/send:
 *   post:
 *     summary: Send connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *             properties:
 *               receiverId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Connection request sent successfully
 *       400:
 *         description: Invalid request or connection already exists
 *       401:
 *         description: Unauthorized
 */
router.post('/send', authenticateToken, validate(connectionSchema), sendConnectionRequest);

/**
 * @swagger
 * /api/connections/{connectionId}/respond:
 *   put:
 *     summary: Respond to connection request
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: connectionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accept, reject]
 *     responses:
 *       200:
 *         description: Connection response processed successfully
 *       400:
 *         description: Invalid action
 *       404:
 *         description: Connection request not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:connectionId/respond', authenticateToken, respondToConnection);

/**
 * @swagger
 * /api/connections:
 *   get:
 *     summary: Get user connections
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACCEPTED, REJECTED]
 *           default: ACCEPTED
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getConnections);

/**
 * @swagger
 * /api/connections/requests:
 *   get:
 *     summary: Get pending connection requests
 *     tags: [Connections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [received, sent]
 *           default: received
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Pending requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', authenticateToken, getPendingRequests);

module.exports = router;