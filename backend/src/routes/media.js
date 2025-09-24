const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validateFileUpload } = require('../middleware/security');
const { upload, uploadVideo, getUserVideos, deleteVideo } = require('../controllers/mediaController');

const router = express.Router();

// Upload video (players only)
router.post('/video', authenticateToken, upload.single('video'), validateFileUpload, uploadVideo);

// Get user's videos
router.get('/videos', authenticateToken, getUserVideos);

// Get specific user's videos (for viewing other profiles)
router.get('/videos/:userId', authenticateToken, getUserVideos);

// Delete video
router.delete('/video/:id', authenticateToken, deleteVideo);

module.exports = router;