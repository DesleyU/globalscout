const express = require('express');
const router = express.Router();
const { 
  getProfile,
  updateProfile, 
  searchUsers, 
  getUserById, 
  getRecommendations,
  uploadAvatar,
  getProfileVisitors
} = require('../controllers/userController');
const { validate, profileUpdateSchema } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/security');
const upload = require('../middleware/upload');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *               position:
 *                 type: string
 *                 enum: [GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD]
 *               age:
 *                 type: integer
 *               height:
 *                 type: integer
 *               weight:
 *                 type: integer
 *               nationality:
 *                 type: string
 *               clubName:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               country:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticateToken, validate(profileUpdateSchema), updateProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPEG, PNG, GIF, max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post('/avatar', authenticateToken, upload.single('avatar'), validateFileUpload, uploadAvatar);

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search users with filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [PLAYER, CLUB, SCOUT_AGENT]
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *           enum: [GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD]
 *       - in: query
 *         name: club
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/search', authenticateToken, searchUsers);

/**
 * @swagger
 * /api/users/recommendations:
 *   get:
 *     summary: Get user recommendations
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', authenticateToken, getRecommendations);

/**
 * @swagger
 * /api/users/profile/visitors:
 *   get:
 *     summary: Get profile visitors (basic users get limited info)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile visitors retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile/visitors', authenticateToken, getProfileVisitors);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/:id', authenticateToken, getUserById);

module.exports = router;