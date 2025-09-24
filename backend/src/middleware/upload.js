const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const userId = req.user.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}${extension}`);
  }
});

// File filter for images only with enhanced security
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed'), false);
  }

  // Check file extension
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png, and .gif files are allowed'), false);
  }

  // Additional security: Check for suspicious filenames
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
    /\.(exe|bat|cmd|scr|pif|com)$/i,  // Executable files
    /\.(php|jsp|asp|js|html|htm)$/i,   // Script files
    /^\./, // Hidden files
    /\s{2,}/, // Multiple spaces
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.originalname)) {
      return cb(new Error('Invalid filename detected'), false);
    }
  }

  // Check filename length
  if (file.originalname.length > 255) {
    return cb(new Error('Filename too long'), false);
  }

  cb(null, true);
};

// Configure multer with enhanced security
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB default
    files: 1, // Only one file at a time
    fields: 5, // Limit number of fields
    fieldNameSize: 50, // Limit field name size
    fieldSize: 1024, // 1KB field size limit
  },
  onError: (err, next) => {
    console.error('Avatar upload error:', err);
    next(err);
  }
});

module.exports = upload;