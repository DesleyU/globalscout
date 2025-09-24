const prisma = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const SubscriptionService = require('../services/subscriptionService');

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed video types
  const allowedVideoTypes = [
    'video/mp4',
    'video/mov',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo'
  ];

  // Check MIME type
  if (!allowedVideoTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only MP4, MOV, and AVI videos are allowed!'), false);
  }

  // Check file extension
  const allowedExtensions = ['.mp4', '.mov', '.avi'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension. Only .mp4, .mov, and .avi files are allowed!'), false);
  }

  // Additional security: Check for suspicious filenames
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
    /\.(exe|bat|cmd|scr|pif|com)$/i,  // Executable files
    /\.(php|jsp|asp|js|html|htm)$/i   // Script files
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.originalname)) {
      return cb(new Error('Invalid filename detected!'), false);
    }
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_VIDEO_SIZE || 500 * 1024 * 1024, // 500MB default
    files: 1, // Only one file at a time
    fields: 10, // Limit number of fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024, // 1MB field size limit
  },
  onError: (err, next) => {
    console.error('Multer error:', err);
    next(err);
  }
});

// Upload video
const uploadVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, tags } = req.body;

    // Check if user is a player
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (user.role !== 'PLAYER') {
      return res.status(403).json({ error: 'Only players can upload videos' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Check video upload limits based on subscription
    const userLimits = await SubscriptionService.getUserLimits(userId);
    
    if (userLimits.maxVideos !== -1) { // -1 means unlimited
      const existingVideosCount = await prisma.media.count({
        where: {
          userId: userId,
          type: 'video'
        }
      });

      if (existingVideosCount >= userLimits.maxVideos) {
        return res.status(403).json({ 
          error: `Video upload limit reached. Basic users can upload up to ${userLimits.maxVideos} video(s). Upgrade to Premium for unlimited uploads.`,
          limit: userLimits.maxVideos,
          current: existingVideosCount
        });
      }
    }

    // Create media record
    const media = await prisma.media.create({
      data: {
        userId: userId,
        type: 'video',
        url: `/uploads/videos/${req.file.filename}`,
        title: title || 'Player Video',
        description: description || '',
        tags: tags || ''
      }
    });

    res.json({
      id: media.id,
      url: media.url,
      title: media.title,
      description: media.description,
      tags: media.tags,
      createdAt: media.createdAt
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's videos
const getUserVideos = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const videos = await prisma.media.findMany({
      where: {
        userId: userId,
        type: 'video'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(videos);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const userId = req.user.id;
    const videoId = req.params.id;

    // Find the video
    const video = await prisma.media.findFirst({
      where: {
        id: videoId,
        userId: userId,
        type: 'video'
      }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../', video.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.media.delete({
      where: { id: videoId }
    });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  upload,
  uploadVideo,
  getUserVideos,
  deleteVideo
};