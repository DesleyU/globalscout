const express = require('express');
const router = express.Router();
const {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus,
  getFollowStats
} = require('../controllers/followController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Follow/unfollow a user
router.post('/:userId/follow', followUser);
router.delete('/:userId/unfollow', unfollowUser);

// Get followers and following
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

// Check follow status
router.get('/:userId/status', checkFollowStatus);

// Get follow stats
router.get('/:userId/stats', getFollowStats);

module.exports = router;